CREATE TABLE media (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sha256          TEXT NOT NULL UNIQUE,
    filename        TEXT NOT NULL,
    content_type    TEXT NOT NULL,
    size_bytes      BIGINT NOT NULL,
    url             TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX media_created_idx ON media (created_at DESC);
