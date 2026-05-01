use std::net::IpAddr;

use crate::{error::AppError, state::AppState};

use super::{email, repo};

pub async fn subscribe(
    state: &AppState,
    email_addr: &str,
    ip: Option<IpAddr>,
    user_agent: Option<&str>,
) -> Result<(), AppError> {
    let db = state.db()?;

    // Basic validation
    if !email_addr.contains('@') || email_addr.len() < 5 {
        return Err(AppError::BadRequest("Invalid email address".into()));
    }

    let existing = repo::find_by_email(db, email_addr).await?;

    match existing {
        Some(sub) if sub.status == "confirmed" => {
            // Don't leak that they're already subscribed
            Ok(())
        }
        Some(sub) if sub.status == "pending" => {
            // Rate limit re-sends: max once per 5 min
            if let Some(sent_at) = sub.verify_sent_at {
                let elapsed = chrono::Utc::now() - sent_at;
                if elapsed.num_minutes() < 5 {
                    return Ok(());
                }
            }
            // Re-send verification
            let verify_url = format!(
                "{}/api/newsletter/verify?token={}",
                state.config.app_url,
                sub.verify_token.as_deref().unwrap_or("")
            );
            if let Ok(resend) = state.resend() {
                email::send_verification(resend, email_addr, &verify_url).await?;
            } else {
                tracing::warn!("Resend not configured — skipping verification email");
            }
            repo::update_verify_sent_at(db, sub.id).await?;
            Ok(())
        }
        Some(_) => {
            // unsubscribed — treat as new signup
            let (verify_token, unsub_token) = generate_tokens();
            repo::resubscribe(db, email_addr, &verify_token, &unsub_token).await?;
            let verify_url = format!(
                "{}/api/newsletter/verify?token={}",
                state.config.app_url, verify_token
            );
            if let Ok(resend) = state.resend() {
                email::send_verification(resend, email_addr, &verify_url).await?;
            } else {
                tracing::warn!("Resend not configured — skipping verification email");
            }
            Ok(())
        }
        None => {
            let (verify_token, unsub_token) = generate_tokens();
            repo::insert(
                db,
                email_addr,
                &verify_token,
                &unsub_token,
                ip,
                user_agent,
            )
            .await?;
            let verify_url = format!(
                "{}/api/newsletter/verify?token={}",
                state.config.app_url, verify_token
            );
            if let Ok(resend) = state.resend() {
                email::send_verification(resend, email_addr, &verify_url).await?;
            } else {
                tracing::warn!("Resend not configured — skipping verification email");
            }
            Ok(())
        }
    }
}

pub async fn verify(state: &AppState, token: &str) -> Result<(), AppError> {
    let db = state.db()?;
    let updated = repo::confirm_by_token(db, token).await?;
    if !updated {
        return Err(AppError::BadRequest("Invalid or expired verification token".into()));
    }
    Ok(())
}

pub async fn unsubscribe(state: &AppState, token: &str) -> Result<(), AppError> {
    let db = state.db()?;
    let updated = repo::unsubscribe_by_token(db, token).await?;
    if !updated {
        return Err(AppError::BadRequest("Invalid unsubscribe token".into()));
    }
    Ok(())
}

fn generate_tokens() -> (String, String) {
    use base64::Engine;
    let mut verify_bytes = [0u8; 32];
    let mut unsub_bytes = [0u8; 32];
    rand::Rng::fill(&mut rand::thread_rng(), &mut verify_bytes);
    rand::Rng::fill(&mut rand::thread_rng(), &mut unsub_bytes);
    let verify = base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(verify_bytes);
    let unsub = base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(unsub_bytes);
    (verify, unsub)
}
