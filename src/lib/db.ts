/**
 * Database layer - Drizzle ORM + libSQL (Next.js compatible, no native compilation)
 * Maintains backward-compatible API with the old better-sqlite3 implementation
 */

import { db, initializeDatabase, schema } from "./db/client";
import { eq, desc, and, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

// Initialize on first import (lazy initialization)
let initialized = false;
async function ensureInitialized() {
  if (!initialized) {
    await initializeDatabase();
    initialized = true;
  }
}

// ─── Type exports (backward compatible - snake_case for old API) ──────────────

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

export interface TerminalHistoryEntry {
  id: number;
  session_id: string;
  command: string;
  output: string;
  exit_code: number;
  executed_at: string;
}

export interface UserRecord {
  id: number;
  username: string;
  password: string;
  email: string;
  account_name: string;
  account_id: string | null;
  permissions: string;
  is_root: number;
  access_key_id: string;
  secret_access_key: string;
  mfa_enabled: number;
  mfa_secret: string | null;
  created_at: string;
  last_login: string | null;
}

// ─── Conversion helpers (camelCase from Drizzle -> snake_case for old API) ─────

function toWidgetConfig(row: any): WidgetConfig {
  return {
    id: row.id,
    user_id: row.userId,
    widget_id: row.widgetId,
    position_x: row.positionX,
    position_y: row.positionY,
    width: row.width,
    height: row.height,
    visible: row.visible ? 1 : 0,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  };
}

function toFavorite(row: any): Favorite {
  return {
    id: row.id,
    user_id: row.userId,
    service_id: row.serviceId,
    service_name: row.serviceName,
    service_href: row.serviceHref,
    created_at: row.createdAt,
  };
}

function toRecentlyVisited(row: any): RecentlyVisited {
  return {
    id: row.id,
    user_id: row.userId,
    service_id: row.serviceId,
    service_name: row.serviceName,
    service_href: row.serviceHref,
    visited_at: row.visitedAt,
  };
}

function toTerminalHistory(row: any): TerminalHistoryEntry {
  return {
    id: row.id,
    session_id: row.sessionId,
    command: row.command,
    output: row.output,
    exit_code: row.exitCode,
    executed_at: row.executedAt,
  };
}

function toUserRecord(row: any): UserRecord {
  return {
    id: row.id,
    username: row.username,
    password: row.password,
    email: row.email,
    account_name: row.accountName || "",
    account_id: row.accountId ?? null,
    permissions: row.permissions,
    is_root: row.isRoot ? 1 : 0,
    access_key_id: row.accessKeyId,
    secret_access_key: row.secretAccessKey,
    mfa_enabled: row.mfaEnabled ? 1 : 0,
    mfa_secret: row.mfaSecret || null,
    created_at: row.createdAt,
    last_login: row.lastLogin || null,
  };
}

// ─── Async API (new, preferred) ────────────────────────────────────────────────

export async function getWidgetConfigAsync(userId: string = "default"): Promise<WidgetConfig[]> {
  await ensureInitialized();
  const rows = await db
    .select()
    .from(schema.widgetConfig)
    .where(eq(schema.widgetConfig.userId, userId))
    .orderBy(schema.widgetConfig.positionY, schema.widgetConfig.positionX);
  return rows.map(toWidgetConfig);
}

export async function updateWidgetConfigAsync(
  userId: string,
  widgetId: string,
  updates: Partial<
    Pick<WidgetConfig, "position_x" | "position_y" | "width" | "height" | "visible">
  >,
) {
  await ensureInitialized();
  const setClause: Record<string, unknown> = { updatedAt: sql`CURRENT_TIMESTAMP` };
  if (updates.position_x !== undefined) setClause.positionX = updates.position_x;
  if (updates.position_y !== undefined) setClause.positionY = updates.position_y;
  if (updates.width !== undefined) setClause.width = updates.width;
  if (updates.height !== undefined) setClause.height = updates.height;
  if (updates.visible !== undefined) setClause.visible = updates.visible === 1;

  await db
    .update(schema.widgetConfig)
    .set(setClause)
    .where(and(eq(schema.widgetConfig.userId, userId), eq(schema.widgetConfig.widgetId, widgetId)));
}

export async function resetWidgetConfigAsync(userId: string = "default") {
  await ensureInitialized();
  await db.delete(schema.widgetConfig).where(eq(schema.widgetConfig.userId, userId));
  await initializeDatabase();
}

export async function getFavoritesAsync(userId: string = "default"): Promise<Favorite[]> {
  await ensureInitialized();
  const rows = await db
    .select()
    .from(schema.favorites)
    .where(eq(schema.favorites.userId, userId))
    .orderBy(desc(schema.favorites.createdAt));
  return rows.map(toFavorite);
}

export async function addFavoriteAsync(
  userId: string,
  serviceId: string,
  serviceName: string,
  serviceHref: string,
) {
  await ensureInitialized();
  await db
    .insert(schema.favorites)
    .values({ userId, serviceId, serviceName, serviceHref })
    .onConflictDoUpdate({
      target: [schema.favorites.userId, schema.favorites.serviceId],
      set: { serviceName, serviceHref },
    });
}

export async function removeFavoriteAsync(userId: string, serviceId: string) {
  await ensureInitialized();
  await db
    .delete(schema.favorites)
    .where(and(eq(schema.favorites.userId, userId), eq(schema.favorites.serviceId, serviceId)));
}

export async function getRecentlyVisitedAsync(
  userId: string = "default",
  limit: number = 5,
): Promise<RecentlyVisited[]> {
  await ensureInitialized();
  const rows = await db
    .select()
    .from(schema.recentlyVisited)
    .where(eq(schema.recentlyVisited.userId, userId))
    .orderBy(desc(schema.recentlyVisited.visitedAt))
    .limit(limit);
  return rows.map(toRecentlyVisited);
}

export async function addRecentlyVisitedAsync(
  userId: string,
  serviceId: string,
  serviceName: string,
  serviceHref: string,
) {
  await ensureInitialized();
  await db
    .insert(schema.recentlyVisited)
    .values({ userId, serviceId, serviceName, serviceHref, visitedAt: sql`CURRENT_TIMESTAMP` });

  await db.delete(schema.recentlyVisited).where(
    and(
      eq(schema.recentlyVisited.userId, userId),
      sql`${schema.recentlyVisited.id} NOT IN (
        SELECT ${schema.recentlyVisited.id} FROM ${schema.recentlyVisited}
        WHERE ${schema.recentlyVisited.userId} = ${userId}
        ORDER BY ${schema.recentlyVisited.visitedAt} DESC
        LIMIT 50
      )`,
    ),
  );
}

export async function addTerminalHistoryAsync(
  sessionId: string,
  command: string,
  output: string,
  exitCode: number,
): Promise<void> {
  await ensureInitialized();
  await db.insert(schema.terminalHistory).values({ sessionId, command, output, exitCode });

  await db.delete(schema.terminalHistory).where(
    and(
      eq(schema.terminalHistory.sessionId, sessionId),
      sql`${schema.terminalHistory.id} NOT IN (
        SELECT ${schema.terminalHistory.id} FROM ${schema.terminalHistory}
        WHERE ${schema.terminalHistory.sessionId} = ${sessionId}
        ORDER BY ${schema.terminalHistory.executedAt} DESC
        LIMIT 500
      )`,
    ),
  );
}

export async function getTerminalHistoryAsync(
  sessionId: string,
  limit: number = 100,
): Promise<TerminalHistoryEntry[]> {
  await ensureInitialized();
  const rows = await db
    .select()
    .from(schema.terminalHistory)
    .where(eq(schema.terminalHistory.sessionId, sessionId))
    .orderBy(desc(schema.terminalHistory.executedAt))
    .limit(limit);
  return rows.map(toTerminalHistory);
}

// ─── User operations (async) ──────────────────────────────────────────────────

export async function getUserByUsernameAsync(username: string): Promise<UserRecord | undefined> {
  await ensureInitialized();
  const rows = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.username, username))
    .limit(1);
  return rows[0] ? toUserRecord(rows[0]) : undefined;
}

export async function getUserByEmailAsync(email: string): Promise<UserRecord | undefined> {
  await ensureInitialized();
  const rows = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  return rows[0] ? toUserRecord(rows[0]) : undefined;
}

export async function getUserByIdAsync(id: number): Promise<UserRecord | undefined> {
  await ensureInitialized();
  const rows = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
  return rows[0] ? toUserRecord(rows[0]) : undefined;
}

export async function getAllUsersAsync(): Promise<Omit<UserRecord, "password" | "mfa_secret">[]> {
  await ensureInitialized();
  const rows = await db
    .select({
      id: schema.users.id,
      username: schema.users.username,
      email: schema.users.email,
      accountName: schema.users.accountName,
      accountId: schema.users.accountId,
      permissions: schema.users.permissions,
      isRoot: schema.users.isRoot,
      accessKeyId: schema.users.accessKeyId,
      secretAccessKey: schema.users.secretAccessKey,
      mfaEnabled: schema.users.mfaEnabled,
      createdAt: schema.users.createdAt,
      lastLogin: schema.users.lastLogin,
    })
    .from(schema.users);
  return rows.map((r) => ({
    id: r.id,
    username: r.username,
    email: r.email,
    account_name: r.accountName || "",
    account_id: r.accountId ?? null,
    permissions: r.permissions,
    is_root: r.isRoot ? 1 : 0,
    access_key_id: r.accessKeyId,
    secret_access_key: r.secretAccessKey,
    mfa_enabled: r.mfaEnabled ? 1 : 0,
    created_at: r.createdAt,
    last_login: r.lastLogin || null,
  }));
}

export async function createUserAsync(data: {
  username: string;
  password: string;
  email: string;
  accountName?: string;
  accountId?: string;
  permissions?: string[];
  isRoot?: boolean;
}): Promise<UserRecord> {
  await ensureInitialized();
  const accessKeyId = `AKIA${data.username.toUpperCase().slice(0, 12).padEnd(12, "X")}0002`;
  const secretAccessKey = `wJalrXUtnFEMI/${data.username}/${Date.now()}/secret`;
  const passwordHash = bcrypt.hashSync(data.password, BCRYPT_ROUNDS);
  const accountId = data.accountId ?? generateAccountId();

  await db.insert(schema.users).values({
    username: data.username,
    password: passwordHash,
    email: data.email,
    accountName: data.accountName || `${data.username}-account`,
    accountId,
    permissions: JSON.stringify(data.permissions || ["*"]),
    isRoot: data.isRoot ?? false,
    accessKeyId,
    secretAccessKey,
  });

  const user = await getUserByUsernameAsync(data.username);
  if (!user) throw new Error("Failed to create user");
  return user;
}

export async function updateUserLastLoginAsync(username: string): Promise<void> {
  await ensureInitialized();
  await db
    .update(schema.users)
    .set({ lastLogin: sql`CURRENT_TIMESTAMP` })
    .where(eq(schema.users.username, username));
}

export async function updateUserMFAAsync(
  username: string,
  mfaEnabled: boolean,
  mfaSecret?: string | null,
): Promise<void> {
  await ensureInitialized();
  await db
    .update(schema.users)
    .set({ mfaEnabled, mfaSecret: mfaSecret || null })
    .where(eq(schema.users.username, username));
}

export async function updateUserPasswordAsync(
  username: string,
  newPassword: string,
): Promise<void> {
  await ensureInitialized();
  const passwordHash = bcrypt.hashSync(newPassword, BCRYPT_ROUNDS);
  await db
    .update(schema.users)
    .set({ password: passwordHash })
    .where(eq(schema.users.username, username));
}

export async function deleteUserAsync(username: string): Promise<boolean> {
  await ensureInitialized();
  const result = await db.delete(schema.users).where(eq(schema.users.username, username));
  const deleted = result as { changes?: number; rowsAffected?: number };
  return (deleted.changes ?? 0) > 0 || (deleted.rowsAffected ?? 0) > 0;
}

export async function validateUserAsync(
  username: string,
  password: string,
): Promise<UserRecord | undefined> {
  const user = await getUserByUsernameAsync(username);
  if (user && bcrypt.compareSync(password, user.password)) {
    return user;
  }
  return undefined;
}

// Validate a password against an already-resolved user record (used by the
// email / account-ID sign-in paths where the user is looked up first).
export function validateUserRecord(user: UserRecord, password: string): boolean {
  return bcrypt.compareSync(password, user.password);
}

// Generate a 12-digit AWS-style account ID ("63" + 10 random digits).
function generateAccountId(): string {
  let digits = "63";
  for (let i = 0; i < 10; i++) {
    digits += Math.floor(Math.random() * 10);
  }
  return digits;
}

export async function getUserPermissionsAsync(username: string): Promise<string[]> {
  const user = await getUserByUsernameAsync(username);
  if (!user) return ["*"];
  try {
    const parsed = JSON.parse(user.permissions);
    if (Array.isArray(parsed)) return parsed;
    return ["*"];
  } catch {
    return ["*"];
  }
}
