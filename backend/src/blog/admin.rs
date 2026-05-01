use axum::{
    extract::{Path, State},
    Json,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::{error::AppError, state::AppState};

use super::repo;

pub async fn list_all_posts(
    State(state): State<AppState>,
) -> Result<Json<Vec<repo::PostSummary>>, AppError> {
    let db = state.db()?;
    let posts = repo::list_all(db).await?;
    Ok(Json(posts))
}

#[derive(Deserialize)]
pub struct CreatePostRequest {
    pub slug: String,
    pub title: String,
    pub excerpt: Option<String>,
    pub body_md: String,
    pub cover_image_url: Option<String>,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub featured: bool,
}

pub async fn create_post(
    State(state): State<AppState>,
    Json(body): Json<CreatePostRequest>,
) -> Result<Json<repo::Post>, AppError> {
    let db = state.db()?;
    let post = repo::insert(
        db,
        &body.slug,
        &body.title,
        body.excerpt.as_deref(),
        &body.body_md,
        body.cover_image_url.as_deref(),
        &body.tags,
        body.featured,
    )
    .await?;
    Ok(Json(post))
}

#[derive(Deserialize)]
pub struct UpdatePostRequest {
    pub slug: String,
    pub title: String,
    pub excerpt: Option<String>,
    pub body_md: String,
    pub cover_image_url: Option<String>,
    #[serde(default)]
    pub tags: Vec<String>,
    pub featured: Option<bool>,
}

pub async fn update_post(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(body): Json<UpdatePostRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let db = state.db()?;
    let updated = repo::update(
        db,
        id,
        &body.slug,
        &body.title,
        body.excerpt.as_deref(),
        &body.body_md,
        body.cover_image_url.as_deref(),
        &body.tags,
        body.featured,
    )
    .await?;
    if !updated {
        return Err(AppError::NotFound);
    }
    Ok(Json(serde_json::json!({ "ok": true })))
}

pub async fn publish_post(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let db = state.db()?;
    let published = repo::publish(db, id).await?;
    if !published {
        return Err(AppError::NotFound);
    }
    Ok(Json(serde_json::json!({ "ok": true })))
}

pub async fn toggle_featured(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let db = state.db()?;
    let ok = repo::toggle_featured(db, id).await?;
    if !ok {
        return Err(AppError::BadRequest(
            "Cannot feature more than 4 posts. Unfeature one first.".into(),
        ));
    }
    Ok(Json(serde_json::json!({ "ok": true })))
}

pub async fn delete_post(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let db = state.db()?;
    let deleted = repo::delete(db, id).await?;
    if !deleted {
        return Err(AppError::NotFound);
    }
    Ok(Json(serde_json::json!({ "ok": true })))
}
