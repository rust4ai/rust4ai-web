use chrono::{DateTime, Utc};
use serde::Serialize;
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

#[derive(Serialize, FromRow)]
pub struct Project {
    pub id: Uuid,
    pub slug: String,
    pub title: String,
    pub excerpt: Option<String>,
    pub body_md: String,
    pub cover_image_url: Option<String>,
    pub repo_url: Option<String>,
    pub video_url: Option<String>,
    pub tags: Vec<String>,
    pub status: String,
    pub featured: bool,
    pub published_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Serialize, FromRow)]
pub struct ProjectSummary {
    pub id: Uuid,
    pub slug: String,
    pub title: String,
    pub excerpt: Option<String>,
    pub cover_image_url: Option<String>,
    pub repo_url: Option<String>,
    pub video_url: Option<String>,
    pub tags: Vec<String>,
    pub status: String,
    pub featured: bool,
    pub published_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

pub async fn list_published(pool: &PgPool, limit: i64, offset: i64) -> Result<Vec<ProjectSummary>, sqlx::Error> {
    sqlx::query_as::<_, ProjectSummary>(
        "SELECT id, slug, title, excerpt, cover_image_url, repo_url, video_url, tags, status, featured, published_at, created_at
         FROM projects WHERE status = 'published'
         ORDER BY published_at DESC LIMIT $1 OFFSET $2",
    )
    .bind(limit)
    .bind(offset)
    .fetch_all(pool)
    .await
}

pub async fn list_featured(pool: &PgPool) -> Result<Vec<ProjectSummary>, sqlx::Error> {
    sqlx::query_as::<_, ProjectSummary>(
        "SELECT id, slug, title, excerpt, cover_image_url, repo_url, video_url, tags, status, featured, published_at, created_at
         FROM projects WHERE status = 'published' AND featured = true
         ORDER BY published_at DESC LIMIT 6",
    )
    .fetch_all(pool)
    .await
}

pub async fn get_published_by_slug(pool: &PgPool, slug: &str) -> Result<Option<Project>, sqlx::Error> {
    sqlx::query_as::<_, Project>(
        "SELECT id, slug, title, excerpt, body_md, cover_image_url, repo_url, video_url, tags, status, featured, published_at, created_at, updated_at
         FROM projects WHERE slug = $1 AND status = 'published'",
    )
    .bind(slug)
    .fetch_optional(pool)
    .await
}

pub async fn list_all(pool: &PgPool) -> Result<Vec<ProjectSummary>, sqlx::Error> {
    sqlx::query_as::<_, ProjectSummary>(
        "SELECT id, slug, title, excerpt, cover_image_url, repo_url, video_url, tags, status, featured, published_at, created_at
         FROM projects ORDER BY updated_at DESC",
    )
    .fetch_all(pool)
    .await
}

pub async fn get_by_id(pool: &PgPool, id: Uuid) -> Result<Option<Project>, sqlx::Error> {
    sqlx::query_as::<_, Project>(
        "SELECT id, slug, title, excerpt, body_md, cover_image_url, repo_url, video_url, tags, status, featured, published_at, created_at, updated_at
         FROM projects WHERE id = $1",
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
    repo_url: Option<&str>,
    video_url: Option<&str>,
    tags: &[String],
    featured: bool,
) -> Result<Project, sqlx::Error> {
    sqlx::query_as::<_, Project>(
        "INSERT INTO projects (slug, title, excerpt, body_md, cover_image_url, repo_url, video_url, tags, featured)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, slug, title, excerpt, body_md, cover_image_url, repo_url, video_url, tags, status, featured, published_at, created_at, updated_at",
    )
    .bind(slug)
    .bind(title)
    .bind(excerpt)
    .bind(body_md)
    .bind(cover_image_url)
    .bind(repo_url)
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
    repo_url: Option<&str>,
    video_url: Option<&str>,
    tags: &[String],
    featured: Option<bool>,
) -> Result<bool, sqlx::Error> {
    let result = if let Some(featured) = featured {
        sqlx::query(
            "UPDATE projects SET slug = $2, title = $3, excerpt = $4, body_md = $5,
             cover_image_url = $6, repo_url = $7, video_url = $8, tags = $9, featured = $10, updated_at = now() WHERE id = $1",
        )
        .bind(id)
        .bind(slug)
        .bind(title)
        .bind(excerpt)
        .bind(body_md)
        .bind(cover_image_url)
        .bind(repo_url)
        .bind(video_url)
        .bind(tags)
        .bind(featured)
        .execute(pool)
        .await?
    } else {
        sqlx::query(
            "UPDATE projects SET slug = $2, title = $3, excerpt = $4, body_md = $5,
             cover_image_url = $6, repo_url = $7, video_url = $8, tags = $9, updated_at = now() WHERE id = $1",
        )
        .bind(id)
        .bind(slug)
        .bind(title)
        .bind(excerpt)
        .bind(body_md)
        .bind(cover_image_url)
        .bind(repo_url)
        .bind(video_url)
        .bind(tags)
        .execute(pool)
        .await?
    };
    Ok(result.rows_affected() > 0)
}

pub async fn toggle_featured(pool: &PgPool, id: Uuid) -> Result<bool, sqlx::Error> {
    let row = sqlx::query_as::<_, Project>(
        "SELECT id, slug, title, excerpt, body_md, cover_image_url, repo_url, video_url, tags, status, featured, published_at, created_at, updated_at
         FROM projects WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    let Some(project) = row else {
        return Ok(false);
    };

    if project.featured {
        sqlx::query("UPDATE projects SET featured = false, updated_at = now() WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await?;
    } else {
        sqlx::query("UPDATE projects SET featured = true, updated_at = now() WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await?;
    }

    Ok(true)
}

pub async fn publish(pool: &PgPool, id: Uuid) -> Result<bool, sqlx::Error> {
    let result = sqlx::query(
        "UPDATE projects SET status = 'published', published_at = now(), updated_at = now() WHERE id = $1",
    )
    .bind(id)
    .execute(pool)
    .await?;
    Ok(result.rows_affected() > 0)
}

pub async fn delete(pool: &PgPool, id: Uuid) -> Result<bool, sqlx::Error> {
    let result = sqlx::query("DELETE FROM projects WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(result.rows_affected() > 0)
}
