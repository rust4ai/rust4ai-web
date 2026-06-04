# rust4ai-web

The website behind **[rust4ai](https://github.com/rust4ai)** — a showcase of the Rust ecosystem for AI and machine learning. It features curated projects, hands-on tutorials, and a blog, all served from a single full-stack Rust + React application.

## Stack

| Layer | Tech |
|-------|------|
| **API** | Rust + Axum 0.8 + Tokio |
| **Database** | PostgreSQL + SQLx (compile-time checked queries) |
| **Auth** | [futureauth](https://crates.io/crates/futureauth) (email magic-link) + JWT, admin allowlist |
| **Email** | Resend |
| **Storage** | S3-compatible (via `rust-s3`) |
| **Frontend** | React 18 + TypeScript + Vite 6 |
| **Styling** | Tailwind CSS 3 + Typography |
| **Markdown** | `react-markdown` + `rehype-highlight` + `remark-gfm` |
| **Deploy** | Docker + Railway (single image, frontend embedded via `rust-embed`) |

The Rust binary embeds the built frontend with `rust-embed`, so production runs as one container that serves both the API and the static React app.

## Project Structure

```
rust4ai-web/
├── backend/
│   ├── src/
│   │   ├── main.rs            # Axum app entry (bin: rust4ai)
│   │   ├── projects/          # Featured projects (model, repo, handlers)
│   │   ├── blog/              # Blog posts
│   │   ├── tutorials/         # Tutorials (single- and multi-page)
│   │   ├── admin/             # Admin CRUD + publish/feature handlers
│   │   ├── auth/              # futureauth + JWT
│   │   └── bin/
│   │       ├── migrate.rs     # Run migrations (bin: migrate)
│   │       └── seed.rs        # Load seed content (bin: seed)
│   └── migrations/            # SQL migrations
├── frontend/                  # React + Vite app
├── seed/                      # Seed content (see "Content" below)
│   ├── projects.json          # Featured projects
│   ├── tutorials.json         # Tutorials
│   └── *.md                   # Blog posts (one file per post)
├── dev.sh                     # One-command local dev
├── Dockerfile                 # Multi-stage production build
└── railway.toml               # Railway deploy config
```

## Local Development

### Prerequisites

- Rust (edition 2024)
- Node.js 20+
- PostgreSQL (local or hosted, e.g. Neon)
- `cargo-watch` (optional, enables backend auto-reload)

### Setup

```bash
# Configure environment
cp .env.example .env
# Edit .env — at minimum set DATABASE_URL

# Start everything (frontend HMR + backend auto-reload)
./dev.sh
```

`dev.sh` installs frontend deps if needed, builds the frontend for embedding, and starts:

- **Frontend** — http://localhost:5173 (Vite HMR, proxies `/api` → `:8080`)
- **Backend** — http://localhost:8080 (Axum API)

### Database

Run migrations and load seed content:

```bash
cargo run --bin migrate   # apply SQL migrations
cargo run --bin seed      # load projects, tutorials, and blog posts
```

### Environment Variables

See `.env.example`. Key variables:

```
DATABASE_URL=postgres://user:pass@host/db?sslmode=require
RESEND_API_KEY=re_xxxxxxxxxxxx
FUTUREAUTH_SECRET_KEY=vx_sec_xxxxxxxxxxxx
APP_URL=http://localhost:8080
RUST_LOG=rust4ai=debug,tower_http=info
ADMIN_EMAILS=you@rust4ai.com
```

`ADMIN_EMAILS` is a comma-separated allowlist of accounts permitted to use the admin endpoints.

## Content

All content lives in `seed/` and is loaded into PostgreSQL with `cargo run --bin seed`. The seed is idempotent — every entry upserts on its `slug` (`ON CONFLICT (slug) DO UPDATE`), so you can edit and re-run freely.

### Featured Projects — `seed/projects.json`

A JSON array. Each entry:

```json
{
  "slug": "my-project",
  "title": "My Project",
  "excerpt": "One-line description shown in listings.",
  "body_md": "# My Project\n\nFull markdown body...",
  "cover_image_url": null,
  "repo_url": "https://github.com/org/repo",
  "video_url": null,
  "tags": ["tag1", "tag2"],
  "featured": true
}
```

### Blog Posts — `seed/*.md`

One markdown file per post, with YAML-style frontmatter:

```markdown
---
slug: my-post
title: My Post Title
excerpt: A short summary for listings.
tags: [rust, ai]
featured: true
cover_image_url:
---

# My Post Title

Markdown body goes here...
```

### Tutorials — `seed/tutorials.json`

A JSON array. Each entry is either single-page (`body_md`) or multi-page (`pages` array):

```json
{
  "slug": "my-tutorial",
  "title": "My Tutorial",
  "excerpt": "Short description.",
  "pages": [
    { "title": "Introduction", "body_md": "..." },
    { "title": "Next Steps",   "body_md": "..." }
  ],
  "cover_image_url": null,
  "video_url": null,
  "tags": ["tag1"],
  "featured": true
}
```

After editing any seed file, reload with:

```bash
cargo run --bin seed
```

## API

Public, read-only endpoints:

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/posts` · `/posts/featured` · `/posts/{slug}` | Blog posts |
| `GET` | `/projects` · `/projects/featured` · `/projects/{slug}` | Featured projects |
| `GET` | `/tutorials` · `/tutorials/featured` · `/tutorials/{slug}` | Tutorials |

Admin endpoints (auth required) under `/admin/*` provide CRUD plus `publish` / `unpublish` / `feature` actions for each content type.

## Deployment

Production builds use the multi-stage `Dockerfile`:

1. Build the React frontend (`vite build`)
2. Compile the Rust binary (`cargo build --release`) with the frontend embedded
3. Package into a slim Debian runtime image

`railway.toml` configures the Railway deploy. Set the environment variables from `.env.example` in the Railway dashboard, then push — Railway auto-detects the Dockerfile.

## Related

Part of the [rust4ai](https://github.com/rust4ai) family of Rust + AI projects, including [Solarabase](https://github.com/rust4ai/solarabase-monorepo) (agentic knowledgebase platform), [Spice](https://github.com/rust4ai/spice) (LLM agent test framework), and the [rust4all-template](https://github.com/rust4ai/rust4all-template) full-stack starter.
