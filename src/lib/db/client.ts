import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { sql } from "drizzle-orm";
import * as schema from "./schema";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BCRYPT_ROUNDS = 12;

const dbUrl = process.env.DATABASE_URL || `file:${path.join(process.cwd(), "data", "console.db")}`;

const client = createClient({ url: dbUrl });
export const db = drizzle(client, { schema });

// Initialize database tables and seed data
export async function initializeDatabase() {
  // Create tables directly using raw SQL via the client
  await client.execute(`
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
  `);

  await client.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);
  `);

  await client.execute(`
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
  `);

  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_widget_config_user ON widget_config(user_id);
    CREATE INDEX IF NOT EXISTS idx_widget_config_visible ON widget_config(user_id, visible);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_widget_config_user_widget ON widget_config(user_id, widget_id);
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL DEFAULT 'default',
      service_id TEXT NOT NULL,
      service_name TEXT NOT NULL,
      service_href TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, service_id)
    );
  `);

  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_favorites_user_service ON favorites(user_id, service_id);
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS recently_visited (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL DEFAULT 'default',
      service_id TEXT NOT NULL,
      service_name TEXT NOT NULL,
      service_href TEXT NOT NULL,
      visited_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_recently_visited_user ON recently_visited(user_id, visited_at DESC);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_recently_visited_user_service ON recently_visited(user_id, service_id);
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS terminal_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      command TEXT NOT NULL,
      output TEXT NOT NULL DEFAULT '',
      exit_code INTEGER NOT NULL DEFAULT 0,
      executed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_terminal_history_session ON terminal_history(session_id, executed_at DESC);
  `);

  // Seed default users if empty
  const userCount = await db.select({ count: sql<number>`count(*)` }).from(schema.users);
  if (userCount[0]?.count === 0) {
    await db.insert(schema.users).values([
      {
        username: "root",
        password: bcrypt.hashSync("root123", BCRYPT_ROUNDS),
        email: "root@localhost",
        accountName: "root-account",
        permissions: JSON.stringify(["*"]),
        isRoot: true,
        accessKeyId: "test",
        secretAccessKey: "test",
      },
      {
        username: "admin",
        password: bcrypt.hashSync("admin123", BCRYPT_ROUNDS),
        email: "admin@localhost",
        accountName: "admin-account",
        permissions: JSON.stringify(["*"]),
        isRoot: false,
        accessKeyId: "AKIAADMIN000000000",
        secretAccessKey: "admin_secret_key_000",
      },
      {
        username: "readonly",
        password: bcrypt.hashSync("readonly123", BCRYPT_ROUNDS),
        email: "readonly@localhost",
        accountName: "readonly-account",
        permissions: JSON.stringify(["s3:GetObject", "ec2:Describe*", "rds:Describe*", "lambda:List*", "iam:Get*"]),
        isRoot: false,
        accessKeyId: "AKIAREADONLY000000",
        secretAccessKey: "readonly_secret_key_00",
      },
    ]);
  }

  // Insert default widget configuration if not exists
  const widgetCount = await db.select({ count: sql<number>`count(*)` })
    .from(schema.widgetConfig)
    .where(sql`${schema.widgetConfig.userId} = 'default'`);
  
  if (widgetCount[0]?.count === 0) {
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

    await db.insert(schema.widgetConfig).values(
      defaultWidgets.map(w => ({
        userId: "default",
        widgetId: w.id,
        positionX: w.x,
        positionY: w.y,
        width: w.w,
        height: w.h,
        visible: true,
      }))
    );
  }
}

// Export schema for direct access if needed
export { schema };

// Re-export types
export type {
  UserRecord,
  NewUser,
  WidgetConfigRecord,
  NewWidgetConfig,
  FavoriteRecord,
  NewFavorite,
  RecentlyVisitedRecord,
  NewRecentlyVisited,
  TerminalHistoryRecord,
  NewTerminalHistory,
} from "./schema";