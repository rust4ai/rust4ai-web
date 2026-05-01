CREATE TABLE tutorial_pages (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutorial_id  UUID NOT NULL REFERENCES tutorials(id) ON DELETE CASCADE,
    page_number  INT NOT NULL,
    title        TEXT NOT NULL DEFAULT '',
    body_md      TEXT NOT NULL DEFAULT '',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tutorial_id, page_number)
);
CREATE INDEX tutorial_pages_tutorial_idx ON tutorial_pages(tutorial_id, page_number);

-- Migrate existing body_md into page 1 for all tutorials
INSERT INTO tutorial_pages (tutorial_id, page_number, title, body_md)
SELECT id, 1, 'Introduction', body_md FROM tutorials WHERE body_md != '';
