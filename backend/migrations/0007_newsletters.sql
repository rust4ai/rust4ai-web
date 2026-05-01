CREATE TABLE newsletters (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            TEXT NOT NULL UNIQUE,
    title           TEXT NOT NULL,
    excerpt         TEXT,
    body_md         TEXT NOT NULL,
    body_html       TEXT,
    cover_image_url TEXT,
    tags            TEXT[] NOT NULL DEFAULT '{}',
    status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
    featured        BOOLEAN NOT NULL DEFAULT false,
    sent_at         TIMESTAMPTZ,
    published_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX newsletters_status_idx ON newsletters(status, published_at DESC);
