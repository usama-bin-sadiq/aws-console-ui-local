import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { NextResponse } from "next/server";
import { client, initializeDatabase } from "@/lib/db/client";

export const SESSION_COOKIE = "aws_console_session";
export const CSRF_COOKIE = "aws_console_csrf";
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

interface SessionRow {
  username: string;
  csrf_hash: string;
  expires_at: number | bigint;
}

interface MfaChallengeRow {
  username: string;
  expires_at: number | bigint;
}

export interface SessionContext {
  username: string;
  csrfHash: string;
  expiresAt: number;
}

export interface NewSession {
  token: string;
  csrfToken: string;
  expiresAt: number;
}

let initialization: Promise<void> | null = null;

function ensureInitialized(): Promise<void> {
  if (!initialization) {
    initialization = initializeDatabase().catch((error) => {
      initialization = null;
      throw error;
    });
  }
  return initialization;
}

function hashToken(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function createToken(): string {
  return randomBytes(32).toString("base64url");
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function getCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;
  const prefix = `${name}=`;
  const value = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  if (!value) return null;
  try {
    return decodeURIComponent(value.slice(prefix.length));
  } catch {
    return null;
  }
}

export async function createSession(username: string): Promise<NewSession> {
  await ensureInitialized();
  const token = createToken();
  const csrfToken = createToken();
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  await client.execute({
    sql: "INSERT INTO auth_sessions (token_hash, username, csrf_hash, expires_at) VALUES (?, ?, ?, ?)",
    args: [hashToken(token), username, hashToken(csrfToken), expiresAt],
  });
  return { token, csrfToken, expiresAt };
}

export async function getSessionFromRequest(request: Request): Promise<SessionContext | null> {
  const token = getCookie(request, SESSION_COOKIE);
  if (!token) return null;

  await ensureInitialized();
  const result = await client.execute({
    sql: "SELECT username, csrf_hash, expires_at FROM auth_sessions WHERE token_hash = ?",
    args: [hashToken(token)],
  });
  const row = result.rows[0] as unknown as SessionRow | undefined;
  if (!row) return null;

  const expiresAt = Number(row.expires_at);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    await client.execute({
      sql: "DELETE FROM auth_sessions WHERE token_hash = ?",
      args: [hashToken(token)],
    });
    return null;
  }

  return { username: row.username, csrfHash: row.csrf_hash, expiresAt };
}

export function setSessionCookies(response: NextResponse, session: NewSession): void {
  const secure = process.env.NODE_ENV === "production";
  response.cookies.set({
    name: SESSION_COOKIE,
    value: session.token,
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  response.cookies.set({
    name: CSRF_COOKIE,
    value: session.csrfToken,
    httpOnly: false,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSessionCookies(response: NextResponse): void {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  response.cookies.set({
    name: CSRF_COOKIE,
    value: "",
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function destroySession(request: Request): Promise<void> {
  const token = getCookie(request, SESSION_COOKIE);
  if (!token) return;
  await ensureInitialized();
  await client.execute({
    sql: "DELETE FROM auth_sessions WHERE token_hash = ?",
    args: [hashToken(token)],
  });
}

export async function validateCsrf(request: Request, session: SessionContext): Promise<boolean> {
  const headerToken = request.headers.get("x-csrf-token");
  const cookieToken = getCookie(request, CSRF_COOKIE);
  if (!headerToken || !cookieToken) return false;
  return (
    safeEqual(hashToken(headerToken), session.csrfHash) &&
    safeEqual(hashToken(cookieToken), session.csrfHash)
  );
}

export async function createMfaChallenge(username: string): Promise<string> {
  await ensureInitialized();
  const token = createToken();
  const expiresAt = Date.now() + 10 * 60 * 1000;
  await client.execute({
    sql: "INSERT INTO auth_mfa_challenges (token_hash, username, expires_at) VALUES (?, ?, ?)",
    args: [hashToken(token), username, expiresAt],
  });
  return token;
}

export async function consumeMfaChallenge(token: string, username: string): Promise<boolean> {
  await ensureInitialized();
  const tokenHash = hashToken(token);
  const result = await client.execute({
    sql: "SELECT username, expires_at FROM auth_mfa_challenges WHERE token_hash = ?",
    args: [tokenHash],
  });
  const row = result.rows[0] as unknown as MfaChallengeRow | undefined;
  await client.execute({
    sql: "DELETE FROM auth_mfa_challenges WHERE token_hash = ?",
    args: [tokenHash],
  });
  return Boolean(row && row.username === username && Number(row.expires_at) > Date.now());
}
