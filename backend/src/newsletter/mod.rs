pub mod email;
pub mod handlers;
pub mod repo;
pub mod service;

use axum::{
    routing::{get, post},
    Router,
};

use crate::state::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/newsletter/subscribe", post(handlers::subscribe))
        .route("/newsletter/verify", get(handlers::verify))
        .route("/newsletter/unsubscribe", get(handlers::unsubscribe))
}
