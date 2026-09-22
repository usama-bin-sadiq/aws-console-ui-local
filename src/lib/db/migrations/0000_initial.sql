-- Initial migration: Create all tables
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  email TEXT NOT NULL,
  account_name TEXT,
  permissions TEXT NOT NULL DEFAULT '["*"]',
  is_root INTEGER NOT NULL DEFAULT 0,
  access_key_id TEXT NOT NULL,
  secret_access_key TEXT NOT NULL,
  mfa_enabled INTEGER NOT NULL DEFAULT 0,
  mfa_secret TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);

CREATE TABLE IF NOT EXISTS widget_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL DEFAULT 'default',
  widget_id TEXT NOT NULL,
  position_x INTEGER NOT NULL DEFAULT 0,
  position_y INTEGER NOT NULL DEFAULT 0,
  width INTEGER NOT NULL DEFAULT 1,
  height INTEGER NOT NULL DEFAULT 1,
  visible INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, widget_id)
);

CREATE INDEX IF NOT EXISTS idx_widget_config_user ON widget_config(user_id);
CREATE INDEX IF NOT EXISTS idx_widget_config_visible ON widget_config(user_id, visible);
CREATE UNIQUE INDEX IF NOT EXISTS idx_widget_config_user_widget ON widget_config(user_id, widget_id);

CREATE TABLE IF NOT EXISTS favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL DEFAULT 'default',
  service_id TEXT NOT NULL,
  service_name TEXT NOT NULL,
  service_href TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_favorites_user_service ON favorites(user_id, service_id);

CREATE TABLE IF NOT EXISTS recently_visited (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL DEFAULT 'default',
  service_id TEXT NOT NULL,
  service_name TEXT NOT NULL,
  service_href TEXT NOT NULL,
  visited_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recently_visited_user ON recently_visited(user_id, visited_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_recently_visited_user_service ON recently_visited(user_id, service_id);

CREATE TABLE IF NOT EXISTS terminal_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  command TEXT NOT NULL,
  output TEXT NOT NULL DEFAULT '',
  exit_code INTEGER NOT NULL DEFAULT 0,
  executed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_terminal_history_session ON terminal_history(session_id, executed_at DESC);