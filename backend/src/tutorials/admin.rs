use axum::{
    extract::{Path, State},
    Json,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::{error::AppError, state::AppState};

use super::repo;

pub async fn list_all_tutorials(
    State(state): State<AppState>,
) -> Result<Json<Vec<repo::TutorialSummary>>, AppError> {
    let db = state.db()?;
    let items = repo::list_all(db).await?;
    Ok(Json(items))
}

#[derive(Deserialize)]
pub struct PageInputRequest {
    pub title: String,
    pub body_md: String,
}

#[derive(Deserialize)]
pub struct CreateTutorialRequest {
    pub slug: String,
    pub title: String,
    pub excerpt: Option<String>,
    #[serde(default)]
    pub body_md: Option<String>,
    pub cover_image_url: Option<String>,
    pub video_url: Option<String>,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub featured: bool,
    #[serde(default)]
    pub pages: Vec<PageInputRequest>,
}

#[derive(Deserialize)]
pub struct UpdateTutorialRequest {
    pub slug: String,
    pub title: String,
    pub excerpt: Option<String>,
    #[serde(default)]
    pub body_md: Option<String>,
    pub cover_image_url: Option<String>,
    pub video_url: Option<String>,
    #[serde(default)]
    pub tags: Vec<String>,
    pub featured: Option<bool>,
    #[serde(default)]
    pub pages: Vec<PageInputRequest>,
}

fn concat_pages(pages: &[PageInputRequest]) -> String {
    pages
        .iter()
        .map(|p| {
            if p.title.is_empty() {
                p.body_md.clone()
            } else {
                format!("# {}\n\n{}", p.title, p.body_md)
            }
        })
        .collect::<Vec<_>>()
        .join("\n\n---\n\n")
}

pub async fn create_tutorial(
    State(state): State<AppState>,
    Json(body): Json<CreateTutorialRequest>,
) -> Result<Json<repo::Tutorial>, AppError> {
    let db = state.db()?;

    // Compute body_md: use pages if provided, else fall back to body_md field
    let body_md = if !body.pages.is_empty() {
        concat_pages(&body.pages)
    } else {
        body.body_md.unwrap_or_default()
    };

    let row = repo::insert(
        db,
        &body.slug,
        &body.title,
        body.excerpt.as_deref(),
        &body_md,
        body.cover_image_url.as_deref(),
        body.video_url.as_deref(),
        &body.tags,
        body.featured,
    )
    .await?;

    // Save pages
    let page_inputs: Vec<repo::PageInput> = if !body.pages.is_empty() {
        body.pages.iter().map(|p| repo::PageInput {
            title: p.title.clone(),
            body_md: p.body_md.clone(),
        }).collect()
    } else {
        vec![repo::PageInput {
            title: "Introduction".to_string(),
            body_md: body_md.clone(),
        }]
    };
    repo::upsert_pages(db, row.id, &page_inputs).await?;

    let pages = repo::list_pages(db, row.id).await?;
    let total_pages = pages.len() as i32;
    Ok(Json(repo::Tutorial {
        id: row.id,
        slug: row.slug,
        title: row.title,
        excerpt: row.excerpt,
        body_md: row.body_md,
        cover_image_url: row.cover_image_url,
        video_url: row.video_url,
        tags: row.tags,
        status: row.status,
        featured: row.featured,
        published_at: row.published_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
        pages,
        total_pages,
    }))
}

pub async fn update_tutorial(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(body): Json<UpdateTutorialRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let db = state.db()?;

    let body_md = if !body.pages.is_empty() {
        concat_pages(&body.pages)
    } else {
        body.body_md.unwrap_or_default()
    };

    let updated = repo::update(
        db,
        id,
        &body.slug,
        &body.title,
        body.excerpt.as_deref(),
        &body_md,
        body.cover_image_url.as_deref(),
        body.video_url.as_deref(),
        &body.tags,
        body.featured,
    )
    .await?;
    if !updated {
        return Err(AppError::NotFound);
    }

    // Save pages
    let page_inputs: Vec<repo::PageInput> = if !body.pages.is_empty() {
        body.pages.iter().map(|p| repo::PageInput {
            title: p.title.clone(),
            body_md: p.body_md.clone(),
        }).collect()
    } else {
        vec![repo::PageInput {
            title: "Introduction".to_string(),
            body_md: body_md.clone(),
        }]
    };
    repo::upsert_pages(db, id, &page_inputs).await?;

    Ok(Json(serde_json::json!({ "ok": true })))
}

pub async fn publish_tutorial(
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

pub async fn unpublish_tutorial(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let db = state.db()?;
    let ok = repo::unpublish(db, id).await?;
    if !ok {
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
        return Err(AppError::NotFound);
    }
    Ok(Json(serde_json::json!({ "ok": true })))
}

pub async fn delete_tutorial(
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
