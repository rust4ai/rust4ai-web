use axum::{routing::{get, post, delete}, Router};
use crate::state::AppState;

mod handlers;

pub fn admin_routes() -> Router<AppState> {
    Router::new()
        .route("/admin/media/upload", post(handlers::upload))
        .route("/admin/media", get(handlers::list))
        .route("/admin/media/{id}", delete(handlers::delete_media))
}
