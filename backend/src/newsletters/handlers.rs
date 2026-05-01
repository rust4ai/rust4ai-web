use axum::{
    extract::{Path, Query, State},
    Json,
};
use serde::Deserialize;

use crate::{error::AppError, state::AppState};

use super::repo;

#[derive(Deserialize)]
pub struct ListQuery {
    pub page: Option<i64>,
    pub limit: Option<i64>,
}

pub async fn list_newsletters(
    State(state): State<AppState>,
    Query(q): Query<ListQuery>,
) -> Result<Json<Vec<repo::NewsletterSummary>>, AppError> {
    let db = state.db()?;
    let limit = q.limit.unwrap_or(20).min(100);
    let offset = (q.page.unwrap_or(1) - 1).max(0) * limit;
    let items = repo::list_published(db, limit, offset).await?;
    Ok(Json(items))
}

pub async fn get_newsletter(
    State(state): State<AppState>,
    Path(slug): Path<String>,
) -> Result<Json<repo::Newsletter>, AppError> {
    let db = state.db()?;
    let item = repo::get_published_by_slug(db, &slug)
        .await?
        .ok_or(AppError::NotFound)?;
    Ok(Json(item))
}
