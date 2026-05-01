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
        .route("/projects", get(handlers::list_projects))
        .route("/projects/featured", get(handlers::featured_projects))
        .route("/projects/{slug}", get(handlers::get_project))
}

pub fn admin_routes() -> Router<AppState> {
    Router::new()
        .route("/admin/projects", get(admin::list_all_projects))
        .route("/admin/projects", post(admin::create_project))
        .route("/admin/projects/{id}", put(admin::update_project))
        .route("/admin/projects/{id}", delete(admin::delete_project))
        .route("/admin/projects/{id}/publish", post(admin::publish_project))
        .route("/admin/projects/{id}/feature", post(admin::toggle_featured))
}
