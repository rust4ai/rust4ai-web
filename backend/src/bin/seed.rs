use serde::Deserialize;
use sqlx::postgres::PgPoolOptions;
use std::path::Path;

#[derive(Deserialize)]
struct SeedTutorial {
    slug: String,
    title: String,
    excerpt: Option<String>,
    body_md: String,
    cover_image_url: Option<String>,
    video_url: Option<String>,
    tags: Vec<String>,
    featured: bool,
}

#[derive(Deserialize)]
struct SeedProject {
    slug: String,
    title: String,
    excerpt: Option<String>,
    body_md: String,
    cover_image_url: Option<String>,
    repo_url: Option<String>,
    video_url: Option<String>,
    tags: Vec<String>,
    featured: bool,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();

    let url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    println!("Connecting to database...");
    let pool = PgPoolOptions::new()
        .max_connections(2)
        .connect(&url)
        .await?;
    println!("Connected.\n");

    let seed_dir = Path::new(env!("CARGO_MANIFEST_DIR")).join("../seed");
    let seed_dir = seed_dir.canonicalize().unwrap_or_else(|_| {
        eprintln!("Seed directory not found at {:?}", seed_dir);
        std::process::exit(1);
    });

    println!("Seed directory: {}", seed_dir.display());

    // Seed posts from markdown files
    seed_posts(&pool, &seed_dir).await?;

    // Seed tutorials from JSON
    let tutorials_path = seed_dir.join("tutorials.json");
    if tutorials_path.exists() {
        println!("\n--- Seeding Tutorials ---");
        let content = std::fs::read_to_string(&tutorials_path)?;
        let tutorials: Vec<SeedTutorial> = serde_json::from_str(&content)?;
        for t in &tutorials {
            println!("  Tutorial: {}", t.title);
            sqlx::query(
                "INSERT INTO tutorials (slug, title, excerpt, body_md, cover_image_url, video_url, tags, status, published_at, featured)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, 'published', now(), $8)
                 ON CONFLICT (slug) DO UPDATE SET
                    title = EXCLUDED.title,
                    excerpt = EXCLUDED.excerpt,
                    body_md = EXCLUDED.body_md,
                    cover_image_url = COALESCE(EXCLUDED.cover_image_url, tutorials.cover_image_url),
                    video_url = COALESCE(EXCLUDED.video_url, tutorials.video_url),
                    tags = EXCLUDED.tags,
                    featured = EXCLUDED.featured,
                    updated_at = now()"
            )
            .bind(&t.slug)
            .bind(&t.title)
            .bind(&t.excerpt)
            .bind(&t.body_md)
            .bind(&t.cover_image_url)
            .bind(&t.video_url)
            .bind(&t.tags)
            .bind(t.featured)
            .execute(&pool)
            .await?;
        }
        println!("  Seeded {} tutorials.", tutorials.len());
    }

    // Seed projects from JSON
    let projects_path = seed_dir.join("projects.json");
    if projects_path.exists() {
        println!("\n--- Seeding Projects ---");
        let content = std::fs::read_to_string(&projects_path)?;
        let projects: Vec<SeedProject> = serde_json::from_str(&content)?;
        for p in &projects {
            println!("  Project: {}", p.title);
            sqlx::query(
                "INSERT INTO projects (slug, title, excerpt, body_md, cover_image_url, repo_url, video_url, tags, status, published_at, featured)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'published', now(), $9)
                 ON CONFLICT (slug) DO UPDATE SET
                    title = EXCLUDED.title,
                    excerpt = EXCLUDED.excerpt,
                    body_md = EXCLUDED.body_md,
                    cover_image_url = COALESCE(EXCLUDED.cover_image_url, projects.cover_image_url),
                    repo_url = COALESCE(EXCLUDED.repo_url, projects.repo_url),
                    video_url = COALESCE(EXCLUDED.video_url, projects.video_url),
                    tags = EXCLUDED.tags,
                    featured = EXCLUDED.featured,
                    updated_at = now()"
            )
            .bind(&p.slug)
            .bind(&p.title)
            .bind(&p.excerpt)
            .bind(&p.body_md)
            .bind(&p.cover_image_url)
            .bind(&p.repo_url)
            .bind(&p.video_url)
            .bind(&p.tags)
            .bind(p.featured)
            .execute(&pool)
            .await?;
        }
        println!("  Seeded {} projects.", projects.len());
    }

    println!("\nDone!");
    Ok(())
}

async fn seed_posts(pool: &sqlx::PgPool, seed_dir: &Path) -> anyhow::Result<()> {
    // Collect markdown files
    let mut files: Vec<_> = std::fs::read_dir(seed_dir)?
        .filter_map(|e| e.ok())
        .filter(|e| e.path().extension().and_then(|ext| ext.to_str()) == Some("md"))
        .collect();
    files.sort_by_key(|e| e.file_name());

    if files.is_empty() {
        println!("No markdown seed files found.");
        return Ok(());
    }

    println!("Found {} markdown files.\n", files.len());

    for entry in &files {
        let path = entry.path();
        let filename = path.file_name().unwrap().to_string_lossy();
        println!("Processing: {filename}");

        let content = std::fs::read_to_string(&path)?;
        let (frontmatter, body) = parse_frontmatter(&content)?;

        sqlx::query(
            "INSERT INTO posts (slug, title, excerpt, body_md, tags, status, published_at, featured, cover_image_url)
             VALUES ($1, $2, $3, $4, $5, 'published', now(), $6, $7)
             ON CONFLICT (slug) DO UPDATE SET
                title = EXCLUDED.title,
                excerpt = EXCLUDED.excerpt,
                body_md = EXCLUDED.body_md,
                tags = EXCLUDED.tags,
                featured = EXCLUDED.featured,
                cover_image_url = COALESCE(EXCLUDED.cover_image_url, posts.cover_image_url),
                updated_at = now()"
        )
        .bind(&frontmatter.slug)
        .bind(&frontmatter.title)
        .bind(&frontmatter.excerpt)
        .bind(&body)
        .bind(&frontmatter.tags)
        .bind(frontmatter.featured)
        .bind(&frontmatter.cover_image_url)
        .execute(pool)
        .await?;

        println!("  -> Upserted: {}", frontmatter.slug);
    }

    Ok(())
}

#[derive(Debug)]
struct Frontmatter {
    slug: String,
    title: String,
    excerpt: Option<String>,
    tags: Vec<String>,
    featured: bool,
    cover_image_url: Option<String>,
}

fn parse_frontmatter(content: &str) -> anyhow::Result<(Frontmatter, String)> {
    let content = content.trim();
    if !content.starts_with("---") {
        anyhow::bail!("Missing frontmatter delimiter");
    }

    let after_first = &content[3..];
    let end = after_first.find("---").ok_or_else(|| anyhow::anyhow!("Missing closing frontmatter delimiter"))?;

    let yaml = &after_first[..end];
    let body = after_first[end + 3..].trim().to_string();

    let mut slug = String::new();
    let mut title = String::new();
    let mut excerpt = None;
    let mut tags = Vec::new();
    let mut featured = false;
    let mut cover_image_url = None;

    for line in yaml.lines() {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }
        if let Some(val) = line.strip_prefix("slug:") {
            slug = val.trim().to_string();
        } else if let Some(val) = line.strip_prefix("title:") {
            let val = val.trim();
            title = val.trim_matches('"').trim_matches('\'').to_string();
        } else if let Some(val) = line.strip_prefix("excerpt:") {
            let val = val.trim();
            if !val.is_empty() {
                excerpt = Some(val.trim_matches('"').trim_matches('\'').to_string());
            }
        } else if let Some(val) = line.strip_prefix("tags:") {
            let val = val.trim();
            let val = val.trim_start_matches('[').trim_end_matches(']');
            tags = val.split(',').map(|t| t.trim().to_string()).filter(|t| !t.is_empty()).collect();
        } else if let Some(val) = line.strip_prefix("featured:") {
            featured = val.trim() == "true";
        } else if let Some(val) = line.strip_prefix("cover_image_url:") {
            let val = val.trim();
            if !val.is_empty() {
                cover_image_url = Some(val.trim_matches('"').trim_matches('\'').to_string());
            }
        }
    }

    if slug.is_empty() || title.is_empty() {
        anyhow::bail!("Frontmatter must include slug and title");
    }

    Ok((Frontmatter { slug, title, excerpt, tags, featured, cover_image_url }, body))
}
