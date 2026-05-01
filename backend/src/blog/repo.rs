use chrono::{DateTime, Utc};
use serde::Serialize;
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

#[derive(Serialize, FromRow)]
pub struct Post {
    pub id: Uuid,
    pub slug: String,
    pub title: String,
    pub excerpt: Option<String>,
    pub body_md: String,
    pub cover_image_url: Option<String>,
    pub tags: Vec<String>,
    pub status: String,
    pub featured: bool,
    pub published_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Serialize, FromRow)]
pub struct PostSummary {
    pub id: Uuid,
    pub slug: String,
    pub title: String,
    pub excerpt: Option<String>,
    pub cover_image_url: Option<String>,
    pub tags: Vec<String>,
    pub status: String,
    pub featured: bool,
    pub published_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

pub async fn list_published(
    pool: &PgPool,
    tag: Option<&str>,
    limit: i64,
    offset: i64,
) -> Result<Vec<PostSummary>, sqlx::Error> {
    if let Some(tag) = tag {
        sqlx::query_as::<_, PostSummary>(
            "SELECT id, slug, title, excerpt, cover_image_url, tags, status, featured, published_at, created_at
             FROM posts WHERE status = 'published' AND $1 = ANY(tags)
             ORDER BY published_at DESC LIMIT $2 OFFSET $3",
        )
        .bind(tag)
        .bind(limit)
        .bind(offset)
        .fetch_all(pool)
        .await
    } else {
        sqlx::query_as::<_, PostSummary>(
            "SELECT id, slug, title, excerpt, cover_image_url, tags, status, featured, published_at, created_at
             FROM posts WHERE status = 'published'
             ORDER BY published_at DESC LIMIT $1 OFFSET $2",
        )
        .bind(limit)
        .bind(offset)
        .fetch_all(pool)
        .await
    }
}

pub async fn list_featured(pool: &PgPool) -> Result<Vec<PostSummary>, sqlx::Error> {
    sqlx::query_as::<_, PostSummary>(
        "SELECT id, slug, title, excerpt, cover_image_url, tags, status, featured, published_at, created_at
         FROM posts WHERE status = 'published' AND featured = true
         ORDER BY published_at DESC LIMIT 4",
    )
    .fetch_all(pool)
    .await
}

pub async fn get_published_by_slug(pool: &PgPool, slug: &str) -> Result<Option<Post>, sqlx::Error> {
    sqlx::query_as::<_, Post>(
        "SELECT id, slug, title, excerpt, body_md, cover_image_url, tags, status, featured, published_at, created_at, updated_at
         FROM posts WHERE slug = $1 AND status = 'published'",
    )
    .bind(slug)
    .fetch_optional(pool)
    .await
}

pub async fn list_all(pool: &PgPool) -> Result<Vec<PostSummary>, sqlx::Error> {
    sqlx::query_as::<_, PostSummary>(
        "SELECT id, slug, title, excerpt, cover_image_url, tags, status, featured, published_at, created_at
         FROM posts ORDER BY updated_at DESC",
    )
    .fetch_all(pool)
    .await
}

pub async fn get_by_id(pool: &PgPool, id: Uuid) -> Result<Option<Post>, sqlx::Error> {
    sqlx::query_as::<_, Post>(
        "SELECT id, slug, title, excerpt, body_md, cover_image_url, tags, status, featured, published_at, created_at, updated_at
         FROM posts WHERE id = $1",
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
    tags: &[String],
    featured: bool,
) -> Result<Post, sqlx::Error> {
    sqlx::query_as::<_, Post>(
        "INSERT INTO posts (slug, title, excerpt, body_md, cover_image_url, tags, featured)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, slug, title, excerpt, body_md, cover_image_url, tags, status, featured, published_at, created_at, updated_at",
    )
    .bind(slug)
    .bind(title)
    .bind(excerpt)
    .bind(body_md)
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
    cover_image_url: Option<&str>,
    tags: &[String],
    featured: Option<bool>,
) -> Result<bool, sqlx::Error> {
    let result = if let Some(featured) = featured {
        sqlx::query(
            "UPDATE posts SET slug = $2, title = $3, excerpt = $4, body_md = $5,
             cover_image_url = $6, tags = $7, featured = $8, updated_at = now() WHERE id = $1",
        )
        .bind(id)
        .bind(slug)
        .bind(title)
        .bind(excerpt)
        .bind(body_md)
        .bind(cover_image_url)
        .bind(tags)
        .bind(featured)
        .execute(pool)
        .await?
    } else {
        sqlx::query(
            "UPDATE posts SET slug = $2, title = $3, excerpt = $4, body_md = $5,
             cover_image_url = $6, tags = $7, updated_at = now() WHERE id = $1",
        )
        .bind(id)
        .bind(slug)
        .bind(title)
        .bind(excerpt)
        .bind(body_md)
        .bind(cover_image_url)
        .bind(tags)
        .execute(pool)
        .await?
    };
    Ok(result.rows_affected() > 0)
}

pub async fn toggle_featured(pool: &PgPool, id: Uuid) -> Result<bool, sqlx::Error> {
    // Get current featured count (excluding this post)
    let row = sqlx::query_as::<_, Post>(
        "SELECT id, slug, title, excerpt, body_md, cover_image_url, tags, status, featured, published_at, created_at, updated_at
         FROM posts WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    let Some(post) = row else {
        return Ok(false);
    };

    if post.featured {
        // Unfeaturing — always allowed
        sqlx::query("UPDATE posts SET featured = false, updated_at = now() WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await?;
    } else {
        // Featuring — check count
        let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM posts WHERE featured = true")
            .fetch_one(pool)
            .await?;

        if count >= 4 {
            // Return false to indicate max reached — caller can handle the error
            return Ok(false);
        }

        sqlx::query("UPDATE posts SET featured = true, updated_at = now() WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await?;
    }

    Ok(true)
}

pub async fn publish(pool: &PgPool, id: Uuid) -> Result<bool, sqlx::Error> {
    let result = sqlx::query(
        "UPDATE posts SET status = 'published', published_at = now(), updated_at = now() WHERE id = $1",
    )
    .bind(id)
    .execute(pool)
    .await?;
    Ok(result.rows_affected() > 0)
}

pub async fn delete(pool: &PgPool, id: Uuid) -> Result<bool, sqlx::Error> {
    let result = sqlx::query("DELETE FROM posts WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(result.rows_affected() > 0)
}
