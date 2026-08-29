import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "console.db");

// Singleton database instance
let db: Database.Database | null = null;

export function getDatabase() {
  if (!db) {
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    initializeDatabase(db);
  }
  return db;
}

function initializeDatabase(database: Database.Database) {
  // Create widget_config table
  database.exec(`
    CREATE TABLE IF NOT EXISTS widget_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL DEFAULT 'default',
      widget_id TEXT NOT NULL,
      position_x INTEGER NOT NULL DEFAULT 0,
      position_y INTEGER NOT NULL DEFAULT 0,
      width INTEGER NOT NULL DEFAULT 1,
      height INTEGER NOT NULL DEFAULT 1,
      visible INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, widget_id)
    );

    CREATE INDEX IF NOT EXISTS idx_widget_config_user 
    ON widget_config(user_id);

    CREATE INDEX IF NOT EXISTS idx_widget_config_visible 
    ON widget_config(user_id, visible);
  `);

  // Create favorites table
  database.exec(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL DEFAULT 'default',
      service_id TEXT NOT NULL,
      service_name TEXT NOT NULL,
      service_href TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, service_id)
    );

    CREATE INDEX IF NOT EXISTS idx_favorites_user 
    ON favorites(user_id);
  `);

  // Create recently_visited table
  database.exec(`
    CREATE TABLE IF NOT EXISTS recently_visited (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL DEFAULT 'default',
      service_id TEXT NOT NULL,
      service_name TEXT NOT NULL,
      service_href TEXT NOT NULL,
      visited_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_recently_visited_user 
    ON recently_visited(user_id, visited_at DESC);
  `);

  // Create terminal_history table
  database.exec(`
    CREATE TABLE IF NOT EXISTS terminal_history (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id  TEXT    NOT NULL,
      command     TEXT    NOT NULL,
      output      TEXT    NOT NULL DEFAULT '',
      exit_code   INTEGER NOT NULL DEFAULT 0,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_terminal_history_session
      ON terminal_history(session_id, executed_at DESC);
  `);

  // Insert default widget configuration if not exists
  const count = database.prepare("SELECT COUNT(*) as count FROM widget_config WHERE user_id = 'default'").get() as { count: number };
  
  if (count.count === 0) {
    const insertWidget = database.prepare(`
      INSERT INTO widget_config (user_id, widget_id, position_x, position_y, width, height, visible)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    // Default layout: 2-column grid
    const defaultWidgets = [
      { id: "aws-health", x: 0, y: 0, w: 1, h: 1 },
      { id: "cost-usage", x: 1, y: 0, w: 1, h: 1 },
      { id: "favorites", x: 0, y: 1, w: 1, h: 1 },
      { id: "recently-visited", x: 1, y: 1, w: 1, h: 1 },
      { id: "trusted-advisor", x: 0, y: 2, w: 2, h: 1 },
      { id: "welcome", x: 0, y: 3, w: 1, h: 1 },
      { id: "build-solution", x: 1, y: 3, w: 1, h: 1 },
      { id: "explore-aws", x: 0, y: 4, w: 2, h: 1 },
    ];

    for (const widget of defaultWidgets) {
      insertWidget.run("default", widget.id, widget.x, widget.y, widget.w, widget.h, 1);
    }
  }
}

export interface WidgetConfig {
  id: number;
  user_id: string;
  widget_id: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  visible: number;
  created_at: string;
  updated_at: string;
}

export interface Favorite {
  id: number;
  user_id: string;
  service_id: string;
  service_name: string;
  service_href: string;
  created_at: string;
}

export interface RecentlyVisited {
  id: number;
  user_id: string;
  service_id: string;
  service_name: string;
  service_href: string;
  visited_at: string;
}

// Widget config operations
export function getWidgetConfig(userId: string = "default"): WidgetConfig[] {
  const db = getDatabase();
  return db.prepare("SELECT * FROM widget_config WHERE user_id = ? ORDER BY position_y, position_x").all(userId) as WidgetConfig[];
}

export function updateWidgetConfig(
  userId: string,
  widgetId: string,
  updates: Partial<Pick<WidgetConfig, "position_x" | "position_y" | "width" | "height" | "visible">>
) {
  const db = getDatabase();
  const fields = Object.keys(updates).map(key => `${key} = @${key}`).join(", ");
  const stmt = db.prepare(`
    UPDATE widget_config 
    SET ${fields}, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = @userId AND widget_id = @widgetId
  `);
  stmt.run({ userId, widgetId, ...updates });
}

export function resetWidgetConfig(userId: string = "default") {
  const db = getDatabase();
  db.prepare("DELETE FROM widget_config WHERE user_id = ?").run(userId);
  // Re-initialize will insert defaults
  initializeDatabase(db);
}

// Favorites operations
export function getFavorites(userId: string = "default"): Favorite[] {
  const db = getDatabase();
  return db.prepare("SELECT * FROM favorites WHERE user_id = ? ORDER BY created_at DESC").all(userId) as Favorite[];
}

export function addFavorite(userId: string, serviceId: string, serviceName: string, serviceHref: string) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO favorites (user_id, service_id, service_name, service_href)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(userId, serviceId, serviceName, serviceHref);
}

export function removeFavorite(userId: string, serviceId: string) {
  const db = getDatabase();
  db.prepare("DELETE FROM favorites WHERE user_id = ? AND service_id = ?").run(userId, serviceId);
}

// Recently visited operations
export function getRecentlyVisited(userId: string = "default", limit: number = 5): RecentlyVisited[] {
  const db = getDatabase();
  return db.prepare(`
    SELECT * FROM recently_visited 
    WHERE user_id = ? 
    ORDER BY visited_at DESC 
    LIMIT ?
  `).all(userId, limit) as RecentlyVisited[];
}

export function addRecentlyVisited(userId: string, serviceId: string, serviceName: string, serviceHref: string) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO recently_visited (user_id, service_id, service_name, service_href, visited_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  stmt.run(userId, serviceId, serviceName, serviceHref);

  // Keep only last 50 entries per user
  db.prepare(`
    DELETE FROM recently_visited 
    WHERE user_id = ? AND id NOT IN (
      SELECT id FROM recently_visited 
      WHERE user_id = ? 
      ORDER BY visited_at DESC 
      LIMIT 50
    )
  `).run(userId, userId);
}

export interface TerminalHistoryEntry {
  id: number;
  session_id: string;
  command: string;
  output: string;
  exit_code: number;
  executed_at: string;
}

// Terminal history operations
export function addTerminalHistory(
  sessionId: string,
  command: string,
  output: string,
  exitCode: number
): void {
  const db = getDatabase();
  db.prepare(`
    INSERT INTO terminal_history (session_id, command, output, exit_code)
    VALUES (?, ?, ?, ?)
  `).run(sessionId, command, output, exitCode);

  // Keep only last 500 entries per session
  db.prepare(`
    DELETE FROM terminal_history
    WHERE session_id = ? AND id NOT IN (
      SELECT id FROM terminal_history
      WHERE session_id = ?
      ORDER BY executed_at DESC
      LIMIT 500
    )
  `).run(sessionId, sessionId);
}

export function getTerminalHistory(
  sessionId: string,
  limit: number = 100
): TerminalHistoryEntry[] {
  const db = getDatabase();
  return db.prepare(`
    SELECT * FROM terminal_history
    WHERE session_id = ?
    ORDER BY executed_at DESC
    LIMIT ?
  `).all(sessionId, limit) as TerminalHistoryEntry[];
}
