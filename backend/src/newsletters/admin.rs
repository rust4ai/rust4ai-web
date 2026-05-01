use axum::{
    extract::{Path, State},
    Json,
};
use resend_rs::types::CreateEmailBaseOptions;
use serde::Deserialize;
use uuid::Uuid;

use crate::{error::AppError, state::AppState};

use super::repo;

pub async fn list_all_newsletters(
    State(state): State<AppState>,
) -> Result<Json<Vec<repo::NewsletterSummary>>, AppError> {
    let db = state.db()?;
    let items = repo::list_all(db).await?;
    Ok(Json(items))
}

#[derive(Deserialize)]
pub struct CreateNewsletterRequest {
    pub slug: String,
    pub title: String,
    pub excerpt: Option<String>,
    pub body_md: String,
    pub body_html: Option<String>,
    pub cover_image_url: Option<String>,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub featured: bool,
}

pub async fn create_newsletter(
    State(state): State<AppState>,
    Json(body): Json<CreateNewsletterRequest>,
) -> Result<Json<repo::Newsletter>, AppError> {
    let db = state.db()?;
    let item = repo::insert(
        db,
        &body.slug,
        &body.title,
        body.excerpt.as_deref(),
        &body.body_md,
        body.body_html.as_deref(),
        body.cover_image_url.as_deref(),
        &body.tags,
        body.featured,
    )
    .await?;
    Ok(Json(item))
}

#[derive(Deserialize)]
pub struct UpdateNewsletterRequest {
    pub slug: String,
    pub title: String,
    pub excerpt: Option<String>,
    pub body_md: String,
    pub body_html: Option<String>,
    pub cover_image_url: Option<String>,
    #[serde(default)]
    pub tags: Vec<String>,
    pub featured: Option<bool>,
}

pub async fn update_newsletter(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(body): Json<UpdateNewsletterRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let db = state.db()?;
    let updated = repo::update(
        db,
        id,
        &body.slug,
        &body.title,
        body.excerpt.as_deref(),
        &body.body_md,
        body.body_html.as_deref(),
        body.cover_image_url.as_deref(),
        &body.tags,
        body.featured,
    )
    .await?;
    if !updated {
        return Err(AppError::NotFound);
    }
    Ok(Json(serde_json::json!({ "ok": true })))
}

pub async fn publish_newsletter(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let db = state.db()?;
    let published = repo::publish(db, id).await?;
    if !published {
        return Err(AppError::NotFound);
    }
    Ok(Json(serde_json::json!({ "ok": true })))
}

pub async fn delete_newsletter(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let db = state.db()?;
    let deleted = repo::delete(db, id).await?;
    if !deleted {
        return Err(AppError::NotFound);
    }
    Ok(Json(serde_json::json!({ "ok": true })))
}

/// Send this newsletter to all confirmed subscribers. Can only be done once.
pub async fn send_newsletter(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let db = state.db()?;
    let resend = state.resend()?;

    // Get the newsletter
    let nl = repo::get_by_id(db, id)
        .await?
        .ok_or(AppError::NotFound)?;

    // Guard: already sent
    if nl.sent_at.is_some() {
        return Err(AppError::BadRequest(
            "This newsletter has already been sent.".into(),
        ));
    }

    // Guard: must be published
    if nl.status != "published" {
        return Err(AppError::BadRequest(
            "Newsletter must be published before sending.".into(),
        ));
    }

    // Get confirmed subscribers
    let subscribers = repo::confirmed_subscriber_emails(db).await?;
    if subscribers.is_empty() {
        return Err(AppError::BadRequest("No confirmed subscribers to send to.".into()));
    }

    // Build email body — use body_html if available, otherwise wrap body_md in basic HTML
    let html_body = if let Some(ref html) = nl.body_html {
        html.clone()
    } else {
        format!(
            r#"<div style="font-family:ui-monospace,monospace;max-width:640px;margin:auto;padding:32px">
                <h1 style="font-size:24px">{}</h1>
                <div style="white-space:pre-wrap">{}</div>
            </div>"#,
            nl.title, nl.body_md
        )
    };

    let mut sent_count = 0u32;
    let mut errors = Vec::new();

    for (email, unsub_token) in &subscribers {
        let unsub_url = format!(
            "{}/api/newsletter/unsubscribe?token={}",
            state.config.app_url, unsub_token
        );
        let full_html = format!(
            r#"{}<hr style="margin:32px 0;border:none;border-top:1px solid #ddd">
            <p style="font-size:12px;color:#999"><a href="{}" style="color:#999">Unsubscribe</a></p>"#,
            html_body, unsub_url
        );

        let msg = CreateEmailBaseOptions::new(
            "rust4ai <hello@rust4ai.com>",
            [email.as_str()],
            &nl.title,
        )
        .with_html(&full_html);

        match resend.emails.send(msg).await {
            Ok(_) => sent_count += 1,
            Err(e) => {
                tracing::error!("Failed to send newsletter to {email}: {e}");
                errors.push(email.clone());
            }
        }
    }

    // Mark as sent (only once)
    repo::mark_sent(db, id).await?;

    Ok(Json(serde_json::json!({
        "ok": true,
        "sent": sent_count,
        "failed": errors.len(),
        "total_subscribers": subscribers.len()
    })))
}
