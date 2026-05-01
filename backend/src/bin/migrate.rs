use sqlx::postgres::PgPoolOptions;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();

    let url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    println!("Connecting to database...");
    let pool = PgPoolOptions::new()
        .max_connections(2)
        .connect(&url)
        .await?;
    println!("Connected.");

    println!("\nRunning migrations...");

    let migrator = sqlx::migrate!("./migrations");

    // Show which migrations will be applied
    for migration in migrator.iter() {
        println!(
            "  Found: {} (v{})",
            migration.description, migration.version
        );
    }

    migrator.run(&pool).await?;

    // Report current state
    let applied: Vec<(i64, String)> = sqlx::query_as(
        "SELECT version, description FROM _sqlx_migrations ORDER BY version",
    )
    .fetch_all(&pool)
    .await?;

    println!("\nApplied migrations:");
    for (version, description) in &applied {
        println!("  [v{version}] {description}");
    }

    println!("\nAll migrations up to date ({} total).", applied.len());
    Ok(())
}
