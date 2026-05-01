use crate::config::Config;
use futureauth::FutureAuth;
use resend_rs::Resend;
use sqlx::PgPool;
use std::sync::Arc;

#[derive(Clone)]
pub struct AppState {
    pub db: Option<PgPool>,
    pub auth: Option<Arc<FutureAuth>>,
    pub resend: Option<Arc<Resend>>,
    pub config: Config,
}

impl AsRef<Arc<FutureAuth>> for AppState {
    fn as_ref(&self) -> &Arc<FutureAuth> {
        self.auth.as_ref().expect("FutureAuth not configured")
    }
}

impl AppState {
    pub fn new(
        db: Option<PgPool>,
        auth: Option<Arc<FutureAuth>>,
        config: Config,
    ) -> Self {
        let resend = config
            .resend_api_key
            .as_ref()
            .map(|key| Arc::new(Resend::new(key)));
        Self {
            db,
            auth,
            resend,
            config,
        }
    }

    pub fn db(&self) -> Result<&PgPool, crate::error::AppError> {
        self.db
            .as_ref()
            .ok_or(crate::error::AppError::BadRequest(
                "Database not configured".into(),
            ))
    }

    pub fn resend(&self) -> Result<&Resend, crate::error::AppError> {
        self.resend
            .as_ref()
            .map(|r| r.as_ref())
            .ok_or(crate::error::AppError::BadRequest(
                "Email sending not configured".into(),
            ))
    }

    pub fn is_admin(&self, email: &str) -> bool {
        self.config
            .admin_emails
            .contains(&email.to_lowercase())
    }
}
