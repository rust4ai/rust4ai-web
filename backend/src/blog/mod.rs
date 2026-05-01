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
        .route("/posts", get(handlers::list_posts))
        .route("/posts/featured", get(handlers::featured_posts))
        .route("/posts/{slug}", get(handlers::get_post))
}

pub fn admin_routes() -> Router<AppState> {
    Router::new()
        .route("/admin/posts", get(admin::list_all_posts))
        .route("/admin/posts", post(admin::create_post))
        .route("/admin/posts/{id}", put(admin::update_post))
        .route("/admin/posts/{id}", delete(admin::delete_post))
        .route("/admin/posts/{id}/publish", post(admin::publish_post))
        .route("/admin/posts/{id}/feature", post(admin::toggle_featured))
}
