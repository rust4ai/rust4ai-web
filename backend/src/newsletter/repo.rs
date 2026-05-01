use chrono::{DateTime, Utc};
use sqlx::{FromRow, PgPool};
use std::net::IpAddr;
use uuid::Uuid;

#[derive(FromRow)]
pub struct Subscriber {
    pub id: Uuid,
    pub email: String,
    pub status: String,
    pub verify_token: Option<String>,
    pub verify_sent_at: Option<DateTime<Utc>>,
    pub unsub_token: String,
}

pub async fn find_by_email(pool: &PgPool, email: &str) -> Result<Option<Subscriber>, sqlx::Error> {
    sqlx::query_as::<_, Subscriber>(
        "SELECT id, email, status, verify_token, verify_sent_at, unsub_token FROM subscribers WHERE email = $1",
    )
    .bind(email)
    .fetch_optional(pool)
    .await
}

pub async fn insert(
    pool: &PgPool,
    email: &str,
    verify_token: &str,
    unsub_token: &str,
    ip: Option<IpAddr>,
    user_agent: Option<&str>,
) -> Result<(), sqlx::Error> {
    let ip_str = ip.map(|i| i.to_string());
    sqlx::query(
        "INSERT INTO subscribers (email, verify_token, unsub_token, verify_sent_at, ip_at_signup, user_agent)
         VALUES ($1, $2, $3, now(), $4::inet, $5)",
    )
    .bind(email)
    .bind(verify_token)
    .bind(unsub_token)
    .bind(ip_str)
    .bind(user_agent)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn update_verify_sent_at(pool: &PgPool, id: Uuid) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE subscribers SET verify_sent_at = now(), updated_at = now() WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn resubscribe(
    pool: &PgPool,
    email: &str,
    verify_token: &str,
    unsub_token: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "UPDATE subscribers SET status = 'pending', verify_token = $2, unsub_token = $3,
         verify_sent_at = now(), confirmed_at = NULL, updated_at = now() WHERE email = $1",
    )
    .bind(email)
    .bind(verify_token)
    .bind(unsub_token)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn confirm_by_token(pool: &PgPool, token: &str) -> Result<bool, sqlx::Error> {
    let result = sqlx::query(
        "UPDATE subscribers SET status = 'confirmed', verify_token = NULL, confirmed_at = now(), updated_at = now()
         WHERE verify_token = $1 AND status = 'pending'",
    )
    .bind(token)
    .execute(pool)
    .await?;
    Ok(result.rows_affected() > 0)
}

pub async fn unsubscribe_by_token(pool: &PgPool, token: &str) -> Result<bool, sqlx::Error> {
    let result = sqlx::query(
        "UPDATE subscribers SET status = 'unsubscribed', updated_at = now()
         WHERE unsub_token = $1 AND status = 'confirmed'",
    )
    .bind(token)
    .execute(pool)
    .await?;
    Ok(result.rows_affected() > 0)
}

#[derive(FromRow)]
pub struct SubscriberRow {
    pub id: Uuid,
    pub email: String,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub confirmed_at: Option<DateTime<Utc>>,
}

pub async fn list_all(pool: &PgPool) -> Result<Vec<SubscriberRow>, sqlx::Error> {
    sqlx::query_as::<_, SubscriberRow>(
        "SELECT id, email, status, created_at, confirmed_at FROM subscribers ORDER BY created_at DESC",
    )
    .fetch_all(pool)
    .await
}

pub struct SubscriberCounts {
    pub pending: i64,
    pub confirmed: i64,
    pub unsubscribed: i64,
}

pub async fn counts(pool: &PgPool) -> Result<SubscriberCounts, sqlx::Error> {
    let row: (i64, i64, i64) = sqlx::query_as(
        "SELECT
           COUNT(*) FILTER (WHERE status = 'pending'),
           COUNT(*) FILTER (WHERE status = 'confirmed'),
           COUNT(*) FILTER (WHERE status = 'unsubscribed')
         FROM subscribers",
    )
    .fetch_one(pool)
    .await?;
    Ok(SubscriberCounts {
        pending: row.0,
        confirmed: row.1,
        unsubscribed: row.2,
    })
}
