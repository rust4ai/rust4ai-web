use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

#[derive(Serialize, FromRow)]
pub struct TutorialRow {
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

#[derive(Serialize)]
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
    pub pages: Vec<TutorialPage>,
    pub total_pages: i32,
}

#[derive(Serialize, FromRow, Clone)]
pub struct TutorialPage {
    pub id: Uuid,
    pub tutorial_id: Uuid,
    pub page_number: i32,
    pub title: String,
    pub body_md: String,
}

#[derive(Deserialize)]
pub struct PageInput {
    pub title: String,
    pub body_md: String,
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
    let row = sqlx::query_as::<_, TutorialRow>(
        "SELECT id, slug, title, excerpt, body_md, cover_image_url, video_url, tags, status, featured, published_at, created_at, updated_at
         FROM tutorials WHERE slug = $1 AND status = 'published'",
    )
    .bind(slug)
    .fetch_optional(pool)
    .await?;

    match row {
        Some(r) => {
            let pages = list_pages(pool, r.id).await?;
            Ok(Some(tutorial_from_row(r, pages)))
        }
        None => Ok(None),
    }
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
    let row = sqlx::query_as::<_, TutorialRow>(
        "SELECT id, slug, title, excerpt, body_md, cover_image_url, video_url, tags, status, featured, published_at, created_at, updated_at
         FROM tutorials WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    match row {
        Some(r) => {
            let pages = list_pages(pool, r.id).await?;
            Ok(Some(tutorial_from_row(r, pages)))
        }
        None => Ok(None),
    }
}

fn tutorial_from_row(r: TutorialRow, pages: Vec<TutorialPage>) -> Tutorial {
    let total_pages = pages.len() as i32;
    Tutorial {
        id: r.id,
        slug: r.slug,
        title: r.title,
        excerpt: r.excerpt,
        body_md: r.body_md,
        cover_image_url: r.cover_image_url,
        video_url: r.video_url,
        tags: r.tags,
        status: r.status,
        featured: r.featured,
        published_at: r.published_at,
        created_at: r.created_at,
        updated_at: r.updated_at,
        pages,
        total_pages,
    }
}

pub async fn list_pages(pool: &PgPool, tutorial_id: Uuid) -> Result<Vec<TutorialPage>, sqlx::Error> {
    sqlx::query_as::<_, TutorialPage>(
        "SELECT id, tutorial_id, page_number, title, body_md
         FROM tutorial_pages WHERE tutorial_id = $1
         ORDER BY page_number",
    )
    .bind(tutorial_id)
    .fetch_all(pool)
    .await
}

pub async fn upsert_pages(pool: &PgPool, tutorial_id: Uuid, pages: &[PageInput]) -> Result<(), sqlx::Error> {
    // Delete existing pages
    sqlx::query("DELETE FROM tutorial_pages WHERE tutorial_id = $1")
        .bind(tutorial_id)
        .execute(pool)
        .await?;

    // Insert new pages
    for (i, page) in pages.iter().enumerate() {
        sqlx::query(
            "INSERT INTO tutorial_pages (tutorial_id, page_number, title, body_md)
             VALUES ($1, $2, $3, $4)",
        )
        .bind(tutorial_id)
        .bind((i + 1) as i32)
        .bind(&page.title)
        .bind(&page.body_md)
        .execute(pool)
        .await?;
    }

    Ok(())
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
) -> Result<TutorialRow, sqlx::Error> {
    sqlx::query_as::<_, TutorialRow>(
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
    let row = sqlx::query_as::<_, TutorialRow>(
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

pub async fn unpublish(pool: &PgPool, id: Uuid) -> Result<bool, sqlx::Error> {
    let result = sqlx::query(
        "UPDATE tutorials SET status = 'draft', published_at = NULL, updated_at = now() WHERE id = $1",
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
