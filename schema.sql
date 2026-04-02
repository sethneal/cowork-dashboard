CREATE TABLE IF NOT EXISTS widgets (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       TEXT        UNIQUE NOT NULL,
  title      TEXT        NOT NULL,
  type       TEXT        NOT NULL CHECK (type IN ('html', 'markdown', 'checklist')),
  content    JSONB       NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  position   INTEGER     NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS checklist_items (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id  UUID        NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
  text       TEXT        NOT NULL,
  checked    BOOLEAN     NOT NULL DEFAULT false,
  position   INTEGER     NOT NULL DEFAULT 0,
  UNIQUE (widget_id, text)
);
