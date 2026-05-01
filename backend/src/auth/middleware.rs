use axum::{
    extract::{Request, State},
    middleware::Next,
    response::{IntoResponse, Response},
    http::StatusCode,
    Json,
};
use serde_json::json;

use crate::state::AppState;

/// Middleware that checks the authenticated user is in the admin email list.
/// If FutureAuth isn't configured, all admin routes return 403.
pub async fn require_admin(
    State(state): State<AppState>,
    request: Request,
    next: Next,
) -> Response {
    let auth = &state.auth;
    if auth.is_none() {
        return (StatusCode::FORBIDDEN, Json(json!({"error": "Auth not configured"}))).into_response();
    }
    let fa = auth.as_ref().unwrap();

    // Extract session cookie
    let cookie_value = request
        .headers()
        .get("cookie")
        .and_then(|v| v.to_str().ok())
        .and_then(|cookies| {
            cookies
                .split(';')
                .find_map(|c| {
                    let c = c.trim();
                    c.strip_prefix("futureauth_session=")
                })
        });

    let token = match cookie_value {
        Some(t) => t.to_string(),
        None => {
            return (StatusCode::UNAUTHORIZED, Json(json!({"error": "Unauthorized"}))).into_response();
        }
    };

    let session = fa.get_session(&token).await;
    match session {
        Ok(Some((user, _session))) => {
            let email = user.email.as_deref().unwrap_or("");
            if !state.is_admin(email) {
                return (StatusCode::FORBIDDEN, Json(json!({"error": "Forbidden"}))).into_response();
            }
            next.run(request).await
        }
        _ => {
            (StatusCode::UNAUTHORIZED, Json(json!({"error": "Unauthorized"}))).into_response()
        }
    }
}
