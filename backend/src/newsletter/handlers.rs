use axum::{
    extract::{ConnectInfo, Query, State},
    http::{HeaderMap, StatusCode},
    Json,
};
use serde::Deserialize;
use std::net::SocketAddr;

use crate::{error::AppError, state::AppState};

use super::service;

#[derive(Deserialize)]
pub struct SubscribeRequest {
    pub email: String,
    #[serde(default)]
    pub company: String, // honeypot
}

pub async fn subscribe(
    State(state): State<AppState>,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    headers: HeaderMap,
    Json(body): Json<SubscribeRequest>,
) -> Result<StatusCode, AppError> {
    // Honeypot check — bots fill hidden fields
    if !body.company.is_empty() {
        return Ok(StatusCode::ACCEPTED);
    }

    let user_agent = headers
        .get("user-agent")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());

    service::subscribe(
        &state,
        &body.email,
        Some(addr.ip()),
        user_agent.as_deref(),
    )
    .await?;

    Ok(StatusCode::ACCEPTED)
}

#[derive(Deserialize)]
pub struct VerifyQuery {
    pub token: String,
}

pub async fn verify(
    State(state): State<AppState>,
    Query(q): Query<VerifyQuery>,
) -> Result<axum::response::Redirect, AppError> {
    service::verify(&state, &q.token).await?;
    Ok(axum::response::Redirect::to("/?verified=1"))
}

pub async fn unsubscribe(
    State(state): State<AppState>,
    Query(q): Query<VerifyQuery>,
) -> Result<axum::response::Redirect, AppError> {
    service::unsubscribe(&state, &q.token).await?;
    Ok(axum::response::Redirect::to("/?unsubscribed=1"))
}
