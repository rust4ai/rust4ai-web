CREATE TABLE projects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            TEXT NOT NULL UNIQUE,
    title           TEXT NOT NULL,
    excerpt         TEXT,
    body_md         TEXT NOT NULL,
    cover_image_url TEXT,
    repo_url        TEXT,
    video_url       TEXT,
    tags            TEXT[] NOT NULL DEFAULT '{}',
    status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
    featured        BOOLEAN NOT NULL DEFAULT false,
    published_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX projects_status_idx ON projects(status, published_at DESC);
CREATE INDEX projects_featured_idx ON projects(featured) WHERE featured = true;
