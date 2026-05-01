use axum::{routing::get, Router};
use futureauth::{FutureAuth, FutureAuthConfig};
use sqlx::postgres::PgPoolOptions;
use std::net::SocketAddr;
use tower_http::{compression::CompressionLayer, trace::TraceLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod admin;
mod auth;
mod blog;
mod config;
mod error;
mod newsletter;
mod state;
mod static_assets;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();

    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "rust4ai=info,tower_http=info".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let cfg = config::Config::from_env();

    // Connect to DB if configured
    let pool = if let Some(ref url) = cfg.database_url {
        match PgPoolOptions::new()
            .max_connections(10)
            .connect(url)
            .await
        {
            Ok(pool) => {
                sqlx::migrate!("./migrations").run(&pool).await?;
                tracing::info!("database connected, migrations applied");
                Some(pool)
            }
            Err(e) => {
                tracing::warn!("database connection failed, running without DB: {e}");
                None
            }
        }
    } else {
        tracing::warn!("DATABASE_URL not set — blog, newsletter, and admin features disabled");
        None
    };

    // Initialize FutureAuth if configured
    let fa = if let (Some(pool), Some(secret)) =
        (&pool, &cfg.futureauth_secret_key)
    {
        let fa = FutureAuth::new(
            pool.clone(),
            FutureAuthConfig {
                api_url: "https://future-auth.com".to_string(),
                secret_key: secret.clone(),
                project_name: "rust4ai".to_string(),
                ..Default::default()
            },
        );
        fa.ensure_tables().await?;
        tracing::info!("FutureAuth initialized");
        Some(fa)
    } else {
        tracing::warn!("FUTUREAUTH_SECRET_KEY not set — admin auth disabled");
        None
    };

    let app_state = state::AppState::new(pool, fa, cfg);

    // Build API routes — always mount them, they'll return errors if DB isn't there
    let api = Router::new()
        .merge(newsletter::routes())
        .merge(blog::public_routes())
        .merge(
            Router::new()
                .merge(blog::admin_routes())
                .merge(admin::routes())
                .layer(axum::middleware::from_fn_with_state(
                    app_state.clone(),
                    auth::middleware::require_admin,
                )),
        );

    let mut app = Router::new()
        .route("/healthz", get(|| async { "ok" }));

    // Only mount auth routes if FutureAuth is configured
    if app_state.auth.is_some() {
        app = app.merge(
            futureauth::axum::auth_router::<state::AppState>(
                app_state.auth.clone().unwrap(),
            ),
        );
    }

    let app = app
        .nest("/api", api)
        .fallback(static_assets::static_handler)
        .layer(CompressionLayer::new())
        .layer(TraceLayer::new_for_http())
        .with_state(app_state);

    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(8080);
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!("listening on {addr}");
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .await?;
    Ok(())
}
