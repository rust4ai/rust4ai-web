use chrono::{DateTime, Utc};
use serde::Serialize;
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

#[derive(Serialize, FromRow)]
pub struct Tutorial {
    pub id: Uuid,
    pub slug: String,
    pub title: String,
    pub excerpt: Option<String>,
    pub body_md: String,
    pub cover_image_url: Option<String>,
    pub video_url: Option<String>,
    pub tags: Vec<String>,
    pub status: String,
    pub featured: bool,
    pub published_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Serialize, FromRow)]
pub struct TutorialSummary {
    pub id: Uuid,
    pub slug: String,
    pub title: String,
    pub excerpt: Option<String>,
    pub cover_image_url: Option<String>,
    pub video_url: Option<String>,
    pub tags: Vec<String>,
    pub status: String,
    pub featured: bool,
    pub published_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

pub async fn list_published(pool: &PgPool, limit: i64, offset: i64) -> Result<Vec<TutorialSummary>, sqlx::Error> {
    sqlx::query_as::<_, TutorialSummary>(
        "SELECT id, slug, title, excerpt, cover_image_url, video_url, tags, status, featured, published_at, created_at
         FROM tutorials WHERE status = 'published'
         ORDER BY published_at DESC LIMIT $1 OFFSET $2",
    )
    .bind(limit)
    .bind(offset)
    .fetch_all(pool)
    .await
}

pub async fn list_featured(pool: &PgPool) -> Result<Vec<TutorialSummary>, sqlx::Error> {
    sqlx::query_as::<_, TutorialSummary>(
        "SELECT id, slug, title, excerpt, cover_image_url, video_url, tags, status, featured, published_at, created_at
         FROM tutorials WHERE status = 'published' AND featured = true
         ORDER BY published_at DESC LIMIT 6",
    )
    .fetch_all(pool)
    .await
}

pub async fn get_published_by_slug(pool: &PgPool, slug: &str) -> Result<Option<Tutorial>, sqlx::Error> {
    sqlx::query_as::<_, Tutorial>(
        "SELECT id, slug, title, excerpt, body_md, cover_image_url, video_url, tags, status, featured, published_at, created_at, updated_at
         FROM tutorials WHERE slug = $1 AND status = 'published'",
    )
    .bind(slug)
    .fetch_optional(pool)
    .await
}

pub async fn list_all(pool: &PgPool) -> Result<Vec<TutorialSummary>, sqlx::Error> {
    sqlx::query_as::<_, TutorialSummary>(
        "SELECT id, slug, title, excerpt, cover_image_url, video_url, tags, status, featured, published_at, created_at
         FROM tutorials ORDER BY updated_at DESC",
    )
    .fetch_all(pool)
    .await
}

pub async fn get_by_id(pool: &PgPool, id: Uuid) -> Result<Option<Tutorial>, sqlx::Error> {
    sqlx::query_as::<_, Tutorial>(
        "SELECT id, slug, title, excerpt, body_md, cover_image_url, video_url, tags, status, featured, published_at, created_at, updated_at
         FROM tutorials WHERE id = $1",
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
    cover_image_url: Option<&str>,
    video_url: Option<&str>,
    tags: &[String],
    featured: bool,
) -> Result<Tutorial, sqlx::Error> {
    sqlx::query_as::<_, Tutorial>(
        "INSERT INTO tutorials (slug, title, excerpt, body_md, cover_image_url, video_url, tags, featured)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, slug, title, excerpt, body_md, cover_image_url, video_url, tags, status, featured, published_at, created_at, updated_at",
    )
    .bind(slug)
    .bind(title)
    .bind(excerpt)
    .bind(body_md)
    .bind(cover_image_url)
    .bind(video_url)
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
    cover_image_url: Option<&str>,
    video_url: Option<&str>,
    tags: &[String],
    featured: Option<bool>,
) -> Result<bool, sqlx::Error> {
    let result = if let Some(featured) = featured {
        sqlx::query(
            "UPDATE tutorials SET slug = $2, title = $3, excerpt = $4, body_md = $5,
             cover_image_url = $6, video_url = $7, tags = $8, featured = $9, updated_at = now() WHERE id = $1",
        )
        .bind(id)
        .bind(slug)
        .bind(title)
        .bind(excerpt)
        .bind(body_md)
        .bind(cover_image_url)
        .bind(video_url)
        .bind(tags)
        .bind(featured)
        .execute(pool)
        .await?
    } else {
        sqlx::query(
            "UPDATE tutorials SET slug = $2, title = $3, excerpt = $4, body_md = $5,
             cover_image_url = $6, video_url = $7, tags = $8, updated_at = now() WHERE id = $1",
        )
        .bind(id)
        .bind(slug)
        .bind(title)
        .bind(excerpt)
        .bind(body_md)
        .bind(cover_image_url)
        .bind(video_url)
        .bind(tags)
        .execute(pool)
        .await?
    };
    Ok(result.rows_affected() > 0)
}

pub async fn toggle_featured(pool: &PgPool, id: Uuid) -> Result<bool, sqlx::Error> {
    let row = sqlx::query_as::<_, Tutorial>(
        "SELECT id, slug, title, excerpt, body_md, cover_image_url, video_url, tags, status, featured, published_at, created_at, updated_at
         FROM tutorials WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    let Some(tutorial) = row else {
        return Ok(false);
    };

    if tutorial.featured {
        sqlx::query("UPDATE tutorials SET featured = false, updated_at = now() WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await?;
    } else {
        sqlx::query("UPDATE tutorials SET featured = true, updated_at = now() WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await?;
    }

    Ok(true)
}

pub async fn publish(pool: &PgPool, id: Uuid) -> Result<bool, sqlx::Error> {
    let result = sqlx::query(
        "UPDATE tutorials SET status = 'published', published_at = now(), updated_at = now() WHERE id = $1",
    )
    .bind(id)
    .execute(pool)
    .await?;
    Ok(result.rows_affected() > 0)
}

pub async fn delete(pool: &PgPool, id: Uuid) -> Result<bool, sqlx::Error> {
    let result = sqlx::query("DELETE FROM tutorials WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(result.rows_affected() > 0)
}
