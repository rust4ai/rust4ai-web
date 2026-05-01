pub mod handlers;

use axum::{routing::get, Router};

use crate::state::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/admin/subscribers", get(handlers::list_subscribers))
        .route("/admin/subscribers.csv", get(handlers::export_csv))
}
