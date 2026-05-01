use axum::{
    extract::{Path, Query, State},
    Json,
};
use serde::Deserialize;

use crate::{error::AppError, state::AppState};

use super::repo;

#[derive(Deserialize)]
pub struct ListQuery {
    pub tag: Option<String>,
    pub page: Option<i64>,
    pub limit: Option<i64>,
}

pub async fn list_posts(
    State(state): State<AppState>,
    Query(q): Query<ListQuery>,
) -> Result<Json<Vec<repo::PostSummary>>, AppError> {
    let db = state.db()?;
    let limit = q.limit.unwrap_or(20).min(100);
    let offset = (q.page.unwrap_or(1) - 1).max(0) * limit;
    let posts = repo::list_published(db, q.tag.as_deref(), limit, offset).await?;
    Ok(Json(posts))
}

pub async fn featured_posts(
    State(state): State<AppState>,
) -> Result<Json<Vec<repo::PostSummary>>, AppError> {
    let db = state.db()?;
    let posts = repo::list_featured(db).await?;
    Ok(Json(posts))
}

pub async fn get_post(
    State(state): State<AppState>,
    Path(slug): Path<String>,
) -> Result<Json<repo::Post>, AppError> {
    let db = state.db()?;
    let post = repo::get_published_by_slug(db, &slug)
        .await?
        .ok_or(AppError::NotFound)?;
    Ok(Json(post))
}
