use axum::{
    extract::State,
    http::header,
    response::IntoResponse,
    Json,
};
use serde::Serialize;

use crate::{error::AppError, newsletter::repo, state::AppState};

#[derive(Serialize)]
pub struct SubscribersResponse {
    pub counts: CountsResponse,
    pub subscribers: Vec<SubscriberItem>,
}

#[derive(Serialize)]
pub struct CountsResponse {
    pub pending: i64,
    pub confirmed: i64,
    pub unsubscribed: i64,
}

#[derive(Serialize)]
pub struct SubscriberItem {
    pub id: uuid::Uuid,
    pub email: String,
    pub status: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub confirmed_at: Option<chrono::DateTime<chrono::Utc>>,
}

pub async fn list_subscribers(
    State(state): State<AppState>,
) -> Result<Json<SubscribersResponse>, AppError> {
    let db = state.db()?;
    let counts = repo::counts(db).await?;
    let subs = repo::list_all(db).await?;

    Ok(Json(SubscribersResponse {
        counts: CountsResponse {
            pending: counts.pending,
            confirmed: counts.confirmed,
            unsubscribed: counts.unsubscribed,
        },
        subscribers: subs
            .into_iter()
            .map(|s| SubscriberItem {
                id: s.id,
                email: s.email,
                status: s.status,
                created_at: s.created_at,
                confirmed_at: s.confirmed_at,
            })
            .collect(),
    }))
}

pub async fn export_csv(
    State(state): State<AppState>,
) -> Result<impl IntoResponse, AppError> {
    let db = state.db()?;
    let subs = repo::list_all(db).await?;

    let mut csv = String::from("email,status,created_at,confirmed_at\n");
    for s in &subs {
        csv.push_str(&format!(
            "{},{},{},{}\n",
            s.email,
            s.status,
            s.created_at,
            s.confirmed_at.map(|d| d.to_string()).unwrap_or_default(),
        ));
    }

    Ok((
        [
            (header::CONTENT_TYPE, "text/csv"),
            (
                header::CONTENT_DISPOSITION,
                "attachment; filename=\"subscribers.csv\"",
            ),
        ],
        csv,
    ))
}
