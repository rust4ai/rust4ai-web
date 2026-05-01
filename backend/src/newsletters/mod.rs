pub mod admin;
pub mod handlers;
pub mod repo;

use axum::{
    routing::{delete, get, post, put},
    Router,
};

use crate::state::AppState;

pub fn public_routes() -> Router<AppState> {
    Router::new()
        .route("/newsletters", get(handlers::list_newsletters))
        .route("/newsletters/{slug}", get(handlers::get_newsletter))
}

pub fn admin_routes() -> Router<AppState> {
    Router::new()
        .route("/admin/newsletters", get(admin::list_all_newsletters))
        .route("/admin/newsletters", post(admin::create_newsletter))
        .route("/admin/newsletters/{id}", put(admin::update_newsletter))
        .route("/admin/newsletters/{id}", delete(admin::delete_newsletter))
        .route("/admin/newsletters/{id}/publish", post(admin::publish_newsletter))
        .route("/admin/newsletters/{id}/send", post(admin::send_newsletter))
}
