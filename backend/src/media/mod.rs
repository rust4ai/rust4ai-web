use axum::{routing::{get, post, delete}, Router};
use crate::state::AppState;

mod handlers;

pub fn public_routes() -> Router<AppState> {
    Router::new()
        .route("/media/{key}", get(handlers::serve))
}

pub fn admin_routes() -> Router<AppState> {
    Router::new()
        .route("/admin/media/upload", post(handlers::upload))
        .route("/admin/media/generate", post(handlers::generate_image))
        .route("/admin/media", get(handlers::list))
        .route("/admin/media/{id}", delete(handlers::delete_media))
}
