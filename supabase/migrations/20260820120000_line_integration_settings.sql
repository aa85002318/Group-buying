-- LINE Login + Official Account (私域) settings (admin-managed, additive)

CREATE TABLE IF NOT EXISTS public.line_login_settings (
  singleton_key TEXT PRIMARY KEY DEFAULT 'main',
  enabled BOOLEAN NOT NULL DEFAULT false,
  channel_id TEXT NOT NULL DEFAULT '',
  channel_secret TEXT NOT NULL DEFAULT '',
  liff_id TEXT NOT NULL DEFAULT '',
  admin_notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.line_oa_settings (
  singleton_key TEXT PRIMARY KEY DEFAULT 'main',
  enabled BOOLEAN NOT NULL DEFAULT false,
  channel_id TEXT NOT NULL DEFAULT '',
  channel_secret TEXT NOT NULL DEFAULT '',
  channel_access_token TEXT NOT NULL DEFAULT '',
  bot_basic_id TEXT NOT NULL DEFAULT '',
  admin_notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.line_login_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.line_oa_settings ENABLE ROW LEVEL SECURITY;

INSERT INTO public.line_login_settings (singleton_key)
VALUES ('main')
ON CONFLICT (singleton_key) DO NOTHING;

INSERT INTO public.line_oa_settings (singleton_key)
VALUES ('main')
ON CONFLICT (singleton_key) DO NOTHING;
