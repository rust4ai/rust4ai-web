#[derive(Clone)]
pub struct Config {
    pub database_url: Option<String>,
    pub resend_api_key: Option<String>,
    pub futureauth_secret_key: Option<String>,
    pub app_url: String,
    pub admin_emails: Vec<String>,
}

impl Config {
    pub fn from_env() -> Self {
        Self {
            database_url: std::env::var("DATABASE_URL").ok(),
            resend_api_key: std::env::var("RESEND_API_KEY").ok(),
            futureauth_secret_key: std::env::var("FUTUREAUTH_SECRET_KEY").ok(),
            app_url: std::env::var("APP_URL")
                .unwrap_or_else(|_| "http://localhost:8080".to_string()),
            admin_emails: std::env::var("ADMIN_EMAILS")
                .unwrap_or_default()
                .split(',')
                .map(|s| s.trim().to_lowercase())
                .filter(|s| !s.is_empty())
                .collect(),
        }
    }

    pub fn has_db(&self) -> bool {
        self.database_url.is_some()
    }

    pub fn has_resend(&self) -> bool {
        self.resend_api_key.is_some()
    }

    pub fn has_auth(&self) -> bool {
        self.futureauth_secret_key.is_some() && self.database_url.is_some()
    }
}
