use axum::{extract::DefaultBodyLimit, routing::{get, post, delete}, Router};
use crate::state::AppState;

mod handlers;

/// Max upload size: 10 MB
const MAX_UPLOAD_SIZE: usize = 10 * 1024 * 1024;

pub fn public_routes() -> Router<AppState> {
    Router::new()
        .route("/media/{key}", get(handlers::serve))
}

pub fn admin_routes() -> Router<AppState> {
    Router::new()
        .route("/admin/media/upload", post(handlers::upload)
            .layer(DefaultBodyLimit::max(MAX_UPLOAD_SIZE)))
        .route("/admin/media/generate", post(handlers::generate_image))
        .route("/admin/media", get(handlers::list))
        .route("/admin/media/{id}", delete(handlers::delete_media))
}
