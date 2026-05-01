use axum::{routing::{get, post, delete}, Router};
use crate::state::AppState;

mod handlers;

pub fn admin_routes() -> Router<AppState> {
    Router::new()
        .route("/api/admin/media/upload", post(handlers::upload))
        .route("/api/admin/media", get(handlers::list))
        .route("/api/admin/media/{id}", delete(handlers::delete_media))
}
