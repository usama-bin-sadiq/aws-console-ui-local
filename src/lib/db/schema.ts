import { sqliteTable, integer, text, uniqueIndex, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    username: text("username").notNull().unique(),
    password: text("password").notNull(),
    email: text("email").notNull(),
    accountName: text("account_name"),
    accountId: text("account_id"),
    permissions: text("permissions").notNull().default('["*"]'),
    isRoot: integer("is_root", { mode: "boolean" }).notNull().default(false),
    accessKeyId: text("access_key_id").notNull(),
    secretAccessKey: text("secret_access_key").notNull(),
    mfaEnabled: integer("mfa_enabled", { mode: "boolean" }).notNull().default(false),
    mfaSecret: text("mfa_secret"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    lastLogin: text("last_login"),
  },
  (table) => ({
    usernameIdx: uniqueIndex("idx_users_username").on(table.username),
  }),
);

export const widgetConfig = sqliteTable(
  "widget_config",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id").notNull().default("default"),
    widgetId: text("widget_id").notNull(),
    positionX: integer("position_x").notNull().default(0),
    positionY: integer("position_y").notNull().default(0),
    width: integer("width").notNull().default(1),
    height: integer("height").notNull().default(1),
    visible: integer("visible", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    userWidgetUnique: uniqueIndex("idx_widget_config_user_widget").on(table.userId, table.widgetId),
    userIdx: index("idx_widget_config_user").on(table.userId),
    visibleIdx: index("idx_widget_config_visible").on(table.userId, table.visible),
  }),
);

export const favorites = sqliteTable(
  "favorites",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id").notNull().default("default"),
    serviceId: text("service_id").notNull(),
    serviceName: text("service_name").notNull(),
    serviceHref: text("service_href").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    userServiceUnique: uniqueIndex("idx_favorites_user_service").on(table.userId, table.serviceId),
    userIdx: index("idx_favorites_user").on(table.userId),
  }),
);

export const recentlyVisited = sqliteTable(
  "recently_visited",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id").notNull().default("default"),
    serviceId: text("service_id").notNull(),
    serviceName: text("service_name").notNull(),
    serviceHref: text("service_href").notNull(),
    visitedAt: text("visited_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    userVisitedIdx: index("idx_recently_visited_user").on(table.userId, table.visitedAt),
  }),
);

export const terminalHistory = sqliteTable(
  "terminal_history",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    sessionId: text("session_id").notNull(),
    command: text("command").notNull(),
    output: text("output").notNull().default(""),
    exitCode: integer("exit_code").notNull().default(0),
    executedAt: text("executed_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    sessionExecutedIdx: index("idx_terminal_history_session").on(table.sessionId, table.executedAt),
  }),
);

// Types for the application
export type UserRecord = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type WidgetConfigRecord = typeof widgetConfig.$inferSelect;
export type NewWidgetConfig = typeof widgetConfig.$inferInsert;

export type FavoriteRecord = typeof favorites.$inferSelect;
export type NewFavorite = typeof favorites.$inferInsert;

export type RecentlyVisitedRecord = typeof recentlyVisited.$inferSelect;
export type NewRecentlyVisited = typeof recentlyVisited.$inferInsert;

export type TerminalHistoryRecord = typeof terminalHistory.$inferSelect;
export type NewTerminalHistory = typeof terminalHistory.$inferInsert;
