use resend_rs::types::CreateEmailBaseOptions;
use resend_rs::Resend;

pub async fn send_verification(
    resend: &Resend,
    to: &str,
    verify_url: &str,
) -> Result<(), anyhow::Error> {
    let html = format!(
        r#"
        <div style="font-family:ui-monospace,monospace;max-width:560px;margin:auto;padding:32px">
          <h1 style="font-size:22px">Confirm your subscription to rust4ai</h1>
          <p>One click and you're in. We send Rust + AI deep-dives weekly. No spam, ever.</p>
          <p><a href="{verify_url}" style="display:inline-block;background:#CE422B;color:#fff;
              padding:12px 20px;border-radius:8px;text-decoration:none">Confirm my email</a></p>
          <p style="color:#666;font-size:13px">If you didn't sign up, ignore this. The link expires in 24 hours.</p>
        </div>
    "#
    );

    let msg = CreateEmailBaseOptions::new(
        "rust4ai <hello@rust4ai.com>",
        [to],
        "Confirm your rust4ai subscription",
    )
    .with_html(&html);

    resend.emails.send(msg).await?;
    Ok(())
}
