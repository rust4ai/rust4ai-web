CREATE TABLE subscribers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           CITEXT NOT NULL UNIQUE,
    status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','confirmed','unsubscribed')),
    verify_token    TEXT,
    verify_sent_at  TIMESTAMPTZ,
    confirmed_at    TIMESTAMPTZ,
    unsub_token     TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    ip_at_signup    INET,
    user_agent      TEXT
);

CREATE INDEX subscribers_status_idx ON subscribers(status);
