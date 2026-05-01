CREATE TABLE tutorials (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            TEXT NOT NULL UNIQUE,
    title           TEXT NOT NULL,
    excerpt         TEXT,
    body_md         TEXT NOT NULL,
    cover_image_url TEXT,
    video_url       TEXT,
    tags            TEXT[] NOT NULL DEFAULT '{}',
    status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
    featured        BOOLEAN NOT NULL DEFAULT false,
    published_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX tutorials_status_idx ON tutorials(status, published_at DESC);
CREATE INDEX tutorials_featured_idx ON tutorials(featured) WHERE featured = true;
