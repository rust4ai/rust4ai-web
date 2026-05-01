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
pub struct CreateTutorialRequest {
    pub slug: String,
    pub title: String,
    pub excerpt: Option<String>,
    pub body_md: String,
    pub cover_image_url: Option<String>,
    pub video_url: Option<String>,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub featured: bool,
}

pub async fn create_tutorial(
    State(state): State<AppState>,
    Json(body): Json<CreateTutorialRequest>,
) -> Result<Json<repo::Tutorial>, AppError> {
    let db = state.db()?;
    let item = repo::insert(
        db,
        &body.slug,
        &body.title,
        body.excerpt.as_deref(),
        &body.body_md,
        body.cover_image_url.as_deref(),
        body.video_url.as_deref(),
        &body.tags,
        body.featured,
    )
    .await?;
    Ok(Json(item))
}

#[derive(Deserialize)]
pub struct UpdateTutorialRequest {
    pub slug: String,
    pub title: String,
    pub excerpt: Option<String>,
    pub body_md: String,
    pub cover_image_url: Option<String>,
    pub video_url: Option<String>,
    #[serde(default)]
    pub tags: Vec<String>,
    pub featured: Option<bool>,
}

pub async fn update_tutorial(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(body): Json<UpdateTutorialRequest>,
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
        body.video_url.as_deref(),
        &body.tags,
        body.featured,
    )
    .await?;
    if !updated {
        return Err(AppError::NotFound);
    }
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
