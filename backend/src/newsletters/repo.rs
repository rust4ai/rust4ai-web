use chrono::{DateTime, Utc};
use serde::Serialize;
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

#[derive(Serialize, FromRow)]
pub struct Newsletter {
    pub id: Uuid,
    pub slug: String,
    pub title: String,
    pub excerpt: Option<String>,
    pub body_md: String,
    pub body_html: Option<String>,
    pub cover_image_url: Option<String>,
    pub tags: Vec<String>,
    pub status: String,
    pub featured: bool,
    pub sent_at: Option<DateTime<Utc>>,
    pub published_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Serialize, FromRow)]
pub struct NewsletterSummary {
    pub id: Uuid,
    pub slug: String,
    pub title: String,
    pub excerpt: Option<String>,
    pub cover_image_url: Option<String>,
    pub tags: Vec<String>,
    pub status: String,
    pub featured: bool,
    pub sent_at: Option<DateTime<Utc>>,
    pub published_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

pub async fn list_published(pool: &PgPool, limit: i64, offset: i64) -> Result<Vec<NewsletterSummary>, sqlx::Error> {
    sqlx::query_as::<_, NewsletterSummary>(
        "SELECT id, slug, title, excerpt, cover_image_url, tags, status, featured, sent_at, published_at, created_at
         FROM newsletters WHERE status = 'published'
         ORDER BY published_at DESC LIMIT $1 OFFSET $2",
    )
    .bind(limit)
    .bind(offset)
    .fetch_all(pool)
    .await
}

pub async fn get_published_by_slug(pool: &PgPool, slug: &str) -> Result<Option<Newsletter>, sqlx::Error> {
    sqlx::query_as::<_, Newsletter>(
        "SELECT id, slug, title, excerpt, body_md, body_html, cover_image_url, tags, status, featured, sent_at, published_at, created_at, updated_at
         FROM newsletters WHERE slug = $1 AND status = 'published'",
    )
    .bind(slug)
    .fetch_optional(pool)
    .await
}

pub async fn list_all(pool: &PgPool) -> Result<Vec<NewsletterSummary>, sqlx::Error> {
    sqlx::query_as::<_, NewsletterSummary>(
        "SELECT id, slug, title, excerpt, cover_image_url, tags, status, featured, sent_at, published_at, created_at
         FROM newsletters ORDER BY updated_at DESC",
    )
    .fetch_all(pool)
    .await
}

pub async fn get_by_id(pool: &PgPool, id: Uuid) -> Result<Option<Newsletter>, sqlx::Error> {
    sqlx::query_as::<_, Newsletter>(
        "SELECT id, slug, title, excerpt, body_md, body_html, cover_image_url, tags, status, featured, sent_at, published_at, created_at, updated_at
         FROM newsletters WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(pool)
    .await
}

pub async fn insert(
    pool: &PgPool,
    slug: &str,
    title: &str,
    excerpt: Option<&str>,
    body_md: &str,
    body_html: Option<&str>,
    cover_image_url: Option<&str>,
    tags: &[String],
    featured: bool,
) -> Result<Newsletter, sqlx::Error> {
    sqlx::query_as::<_, Newsletter>(
        "INSERT INTO newsletters (slug, title, excerpt, body_md, body_html, cover_image_url, tags, featured)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, slug, title, excerpt, body_md, body_html, cover_image_url, tags, status, featured, sent_at, published_at, created_at, updated_at",
    )
    .bind(slug)
    .bind(title)
    .bind(excerpt)
    .bind(body_md)
    .bind(body_html)
    .bind(cover_image_url)
    .bind(tags)
    .bind(featured)
    .fetch_one(pool)
    .await
}

pub async fn update(
    pool: &PgPool,
    id: Uuid,
    slug: &str,
    title: &str,
    excerpt: Option<&str>,
    body_md: &str,
    body_html: Option<&str>,
    cover_image_url: Option<&str>,
    tags: &[String],
    featured: Option<bool>,
) -> Result<bool, sqlx::Error> {
    let result = if let Some(featured) = featured {
        sqlx::query(
            "UPDATE newsletters SET slug = $2, title = $3, excerpt = $4, body_md = $5, body_html = $6,
             cover_image_url = $7, tags = $8, featured = $9, updated_at = now() WHERE id = $1",
        )
        .bind(id)
        .bind(slug)
        .bind(title)
        .bind(excerpt)
        .bind(body_md)
        .bind(body_html)
        .bind(cover_image_url)
        .bind(tags)
        .bind(featured)
        .execute(pool)
        .await?
    } else {
        sqlx::query(
            "UPDATE newsletters SET slug = $2, title = $3, excerpt = $4, body_md = $5, body_html = $6,
             cover_image_url = $7, tags = $8, updated_at = now() WHERE id = $1",
        )
        .bind(id)
        .bind(slug)
        .bind(title)
        .bind(excerpt)
        .bind(body_md)
        .bind(body_html)
        .bind(cover_image_url)
        .bind(tags)
        .execute(pool)
        .await?
    };
    Ok(result.rows_affected() > 0)
}

pub async fn publish(pool: &PgPool, id: Uuid) -> Result<bool, sqlx::Error> {
    let result = sqlx::query(
        "UPDATE newsletters SET status = 'published', published_at = now(), updated_at = now() WHERE id = $1",
    )
    .bind(id)
    .execute(pool)
    .await?;
    Ok(result.rows_affected() > 0)
}

pub async fn mark_sent(pool: &PgPool, id: Uuid) -> Result<bool, sqlx::Error> {
    let result = sqlx::query(
        "UPDATE newsletters SET sent_at = now(), updated_at = now() WHERE id = $1 AND sent_at IS NULL",
    )
    .bind(id)
    .execute(pool)
    .await?;
    Ok(result.rows_affected() > 0)
}

pub async fn delete(pool: &PgPool, id: Uuid) -> Result<bool, sqlx::Error> {
    let result = sqlx::query("DELETE FROM newsletters WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(result.rows_affected() > 0)
}

/// Get all confirmed subscriber emails for sending
pub async fn confirmed_subscriber_emails(pool: &PgPool) -> Result<Vec<(String, String)>, sqlx::Error> {
    // Returns (email, unsub_token) pairs
    let rows: Vec<(String, String)> = sqlx::query_as(
        "SELECT email, unsub_token FROM subscribers WHERE status = 'confirmed' ORDER BY email",
    )
    .fetch_all(pool)
    .await?;
    Ok(rows)
}
