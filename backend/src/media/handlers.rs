use axum::{
    body::Body,
    extract::{Path, State},
    http::{header, StatusCode},
    response::Response,
    Json,
};
use axum_extra::extract::Multipart;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use sqlx::FromRow;
use uuid::Uuid;

use crate::error::AppError;
use crate::state::AppState;

#[derive(Debug, Serialize, FromRow)]
pub struct MediaItem {
    pub id: Uuid,
    pub sha256: String,
    pub filename: String,
    pub content_type: String,
    pub size_bytes: i64,
    pub url: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

pub async fn upload(
    State(state): State<AppState>,
    mut multipart: Multipart,
) -> Result<Json<MediaItem>, AppError> {
    let db = state.db()?;
    let s3 = state.s3()?;

    let mut file_bytes: Option<Vec<u8>> = None;
    let mut filename: Option<String> = None;
    let mut content_type: Option<String> = None;

    while let Some(field) = multipart.next_field().await.map_err(|e| {
        AppError::BadRequest(format!("Multipart error: {e}"))
    })? {
        if field.name() == Some("file") {
            filename = field.file_name().map(|s| s.to_string());
            content_type = field.content_type().map(|s| s.to_string());
            let data = field.bytes().await.map_err(|e| {
                AppError::BadRequest(format!("Failed to read file: {e}"))
            })?;
            file_bytes = Some(data.to_vec());
        }
    }

    let bytes = file_bytes.ok_or_else(|| AppError::BadRequest("No file provided".into()))?;
    let filename = filename.unwrap_or_else(|| "upload".to_string());
    let content_type = content_type.unwrap_or_else(|| "application/octet-stream".to_string());

    // Compute SHA256
    let mut hasher = Sha256::new();
    hasher.update(&bytes);
    let hash = format!("{:x}", hasher.finalize());

    // Check if already exists (deduplication)
    let existing: Option<MediaItem> = sqlx::query_as(
        "SELECT id, sha256, filename, content_type, size_bytes, url, created_at FROM media WHERE sha256 = $1"
    )
    .bind(&hash)
    .fetch_optional(db)
    .await
    .map_err(AppError::Sqlx)?;

    if let Some(item) = existing {
        return Ok(Json(item));
    }

    // Determine extension from filename
    let ext = filename
        .rsplit('.')
        .next()
        .unwrap_or("bin")
        .to_lowercase();

    let s3_key = format!("media/{}.{}", hash, ext);

    // Upload to S3
    s3.put_object_with_content_type(&s3_key, &bytes, &content_type)
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("S3 upload failed: {e}")))?;

    // Build the public URL (proxied through our backend)
    let url = format!("/{}", s3_key);

    let size_bytes = bytes.len() as i64;

    // Insert into DB
    let item: MediaItem = sqlx::query_as(
        "INSERT INTO media (sha256, filename, content_type, size_bytes, url) VALUES ($1, $2, $3, $4, $5) RETURNING id, sha256, filename, content_type, size_bytes, url, created_at"
    )
    .bind(&hash)
    .bind(&filename)
    .bind(&content_type)
    .bind(size_bytes)
    .bind(&url)
    .fetch_one(db)
    .await
    .map_err(AppError::Sqlx)?;

    Ok(Json(item))
}

pub async fn list(
    State(state): State<AppState>,
) -> Result<Json<Vec<MediaItem>>, AppError> {
    let db = state.db()?;

    let items: Vec<MediaItem> = sqlx::query_as(
        "SELECT id, sha256, filename, content_type, size_bytes, url, created_at FROM media ORDER BY created_at DESC"
    )
    .fetch_all(db)
    .await
    .map_err(AppError::Sqlx)?;

    Ok(Json(items))
}

pub async fn delete_media(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let db = state.db()?;
    let s3 = state.s3()?;

    // Fetch the record to get the S3 key
    let item: MediaItem = sqlx::query_as(
        "SELECT id, sha256, filename, content_type, size_bytes, url, created_at FROM media WHERE id = $1"
    )
    .bind(id)
    .fetch_optional(db)
    .await
    .map_err(AppError::Sqlx)?
    .ok_or(AppError::NotFound)?;

    // Determine S3 key from the stored URL
    let ext = item.filename
        .rsplit('.')
        .next()
        .unwrap_or("bin")
        .to_lowercase();
    let s3_key = format!("media/{}.{}", item.sha256, ext);

    // Delete from S3
    s3.delete_object(&s3_key)
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("S3 delete failed: {e}")))?;

    // Delete from DB
    sqlx::query("DELETE FROM media WHERE id = $1")
        .bind(id)
        .execute(db)
        .await
        .map_err(AppError::Sqlx)?;

    Ok(Json(serde_json::json!({ "ok": true })))
}

pub async fn serve(
    State(state): State<AppState>,
    Path(key): Path<String>,
) -> Result<Response, AppError> {
    let s3 = state.s3()?;

    let s3_key = format!("media/{}", key);

    let result = s3.get_object(&s3_key)
        .await
        .map_err(|e| {
            tracing::warn!("S3 get failed for {}: {e}", s3_key);
            AppError::NotFound
        })?;

    let content_type = result
        .headers()
        .get("content-type")
        .map(|v| v.to_string())
        .unwrap_or_else(|| "application/octet-stream".to_string());

    let bytes = result.bytes().to_vec();

    Ok(Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, content_type)
        .header(header::CACHE_CONTROL, "public, max-age=31536000, immutable")
        .body(Body::from(bytes))
        .unwrap())
}

#[derive(Deserialize)]
pub struct GenerateRequest {
    pub prompt: String,
    pub style: String,
}

pub async fn generate_image(
    State(state): State<AppState>,
    Json(req): Json<GenerateRequest>,
) -> Result<Json<MediaItem>, AppError> {
    let db = state.db()?;
    let s3 = state.s3()?;

    let api_key = state.config.starflask_api_key.as_deref().unwrap_or_default();

    // Call starflask CLI to generate the image
    let payload = serde_json::json!({
        "prompt": req.prompt,
        "style": req.style,
    });

    let output = tokio::process::Command::new("starflask")
        .args(["jobs", "create", "image", "--payload", &payload.to_string(), "--wait"])
        .env("STARFLASK_API_KEY", api_key)
        .output()
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to run starflask: {e}")))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(AppError::Internal(anyhow::anyhow!("starflask failed: {stderr}")));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    // Parse output URL - expect a URL on a line by itself
    let image_url = stdout
        .lines()
        .find(|l| l.starts_with("http"))
        .ok_or_else(|| AppError::Internal(anyhow::anyhow!("No URL in starflask output: {stdout}")))?
        .trim();

    // Download the generated image
    let client = reqwest::Client::new();
    let resp = client.get(image_url).send().await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to download image: {e}")))?;

    let content_type = resp
        .headers()
        .get("content-type")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("image/png")
        .to_string();

    let bytes = resp.bytes().await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to read image bytes: {e}")))?;

    // Compute SHA256
    let mut hasher = Sha256::new();
    hasher.update(&bytes);
    let hash = format!("{:x}", hasher.finalize());

    // Check deduplication
    let existing: Option<MediaItem> = sqlx::query_as(
        "SELECT id, sha256, filename, content_type, size_bytes, url, created_at FROM media WHERE sha256 = $1"
    )
    .bind(&hash)
    .fetch_optional(db)
    .await
    .map_err(AppError::Sqlx)?;

    if let Some(item) = existing {
        return Ok(Json(item));
    }

    // Determine extension from content type
    let ext = match content_type.as_str() {
        "image/png" => "png",
        "image/jpeg" | "image/jpg" => "jpg",
        "image/webp" => "webp",
        _ => "png",
    };

    let filename = format!("generated-{}.{}", &hash[..8], ext);
    let s3_key = format!("media/{}.{}", hash, ext);

    // Upload to S3
    s3.put_object_with_content_type(&s3_key, &bytes, &content_type)
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("S3 upload failed: {e}")))?;

    let url = format!("/{}", s3_key);
    let size_bytes = bytes.len() as i64;

    // Insert into DB
    let item: MediaItem = sqlx::query_as(
        "INSERT INTO media (sha256, filename, content_type, size_bytes, url) VALUES ($1, $2, $3, $4, $5) RETURNING id, sha256, filename, content_type, size_bytes, url, created_at"
    )
    .bind(&hash)
    .bind(&filename)
    .bind(&content_type)
    .bind(size_bytes)
    .bind(&url)
    .fetch_one(db)
    .await
    .map_err(AppError::Sqlx)?;

    Ok(Json(item))
}
