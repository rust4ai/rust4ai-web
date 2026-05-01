ALTER TABLE posts ADD COLUMN featured BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX posts_featured_idx ON posts(featured) WHERE featured = true;
