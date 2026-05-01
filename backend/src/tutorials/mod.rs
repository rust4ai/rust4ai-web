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
        .route("/tutorials", get(handlers::list_tutorials))
        .route("/tutorials/featured", get(handlers::featured_tutorials))
        .route("/tutorials/{slug}", get(handlers::get_tutorial))
}

pub fn admin_routes() -> Router<AppState> {
    Router::new()
        .route("/admin/tutorials", get(admin::list_all_tutorials))
        .route("/admin/tutorials", post(admin::create_tutorial))
        .route("/admin/tutorials/{id}", put(admin::update_tutorial))
        .route("/admin/tutorials/{id}", delete(admin::delete_tutorial))
        .route("/admin/tutorials/{id}/publish", post(admin::publish_tutorial))
        .route("/admin/tutorials/{id}/feature", post(admin::toggle_featured))
}
