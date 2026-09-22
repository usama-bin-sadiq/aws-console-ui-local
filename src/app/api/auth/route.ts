import { NextResponse } from "next/server";
import {
  validateUserAsync,
  createUserAsync,
  getUserByUsernameAsync,
  updateUserLastLoginAsync,
  updateUserPasswordAsync,
  updateUserMFAAsync,
} from "@/lib/db";
import { generateMFASecret, generateQRCode, verifyTOTP } from "@/lib/mfa";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limiter";

const RATE_LIMITS = {
  signin: { windowMs: 15 * 60 * 1000, maxRequests: 5 },
  signup: { windowMs: 60 * 60 * 1000, maxRequests: 3 },
  resetPassword: { windowMs: 60 * 60 * 1000, maxRequests: 3 },
  verifyMFASignin: { windowMs: 15 * 60 * 1000, maxRequests: 5 },
} as const;

function generateSessionToken(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  return forwarded?.split(",")[0]?.trim() || realIp || "unknown";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;
    const clientIp = getClientIp(request);
    const rateLimitKey = `${action}:${clientIp}`;

    if (action in RATE_LIMITS) {
      const limit = RATE_LIMITS[action as keyof typeof RATE_LIMITS];
      const result = checkRateLimit(rateLimitKey, { ...limit, keyPrefix: 'auth' });
      
      if (!result.allowed) {
        const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
        return NextResponse.json(
          { error: "Too many attempts. Please try again later.", retryAfter },
          { 
            status: 429,
            headers: {
              "Retry-After": String(retryAfter),
              "X-RateLimit-Limit": String(result.total),
              "X-RateLimit-Remaining": String(result.remaining),
              "X-RateLimit-Reset": String(Math.ceil(result.resetTime / 1000)),
            }
          }
        );
      }
    }

    // ─── Sign In ────────────────────────────────────────────────────────────
    if (action === "signin") {
      const { username, password } = body;
      if (!username || !password) {
        return NextResponse.json({ error: "Username and password required" }, { status: 400 });
      }

      const user = await validateUserAsync(username, password);
      if (!user) {
        return NextResponse.json({ error: "Incorrect username or password" }, { status: 401 });
      }

      if (user.mfa_enabled === 1) {
        const sessionToken = generateSessionToken();
        return NextResponse.json({
          mfaRequired: true,
          sessionToken,
          username: user.username,
        });
      }

      resetRateLimit(rateLimitKey, 'auth');
      await updateUserLastLoginAsync(username);

      return NextResponse.json({
        success: true,
        user: {
          username: user.username,
          email: user.email,
          accountName: user.account_name,
          permissions: JSON.parse(user.permissions),
          isRoot: user.is_root === 1,
          accessKeyId: user.access_key_id,
          secretAccessKey: user.secret_access_key,
          mfaEnabled: user.mfa_enabled === 1,
        },
      });
    }

    // ─── Verify MFA Sign-In ────────────────────────────────────────────────
    if (action === "verifyMFASignin") {
      const { username, sessionToken, code } = body;
      if (!username || !sessionToken || !code) {
        return NextResponse.json({ error: "Username, session token, and MFA code required" }, { status: 400 });
      }

      const user = await getUserByUsernameAsync(username);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      if (user.mfa_enabled !== 1) {
        return NextResponse.json({ error: "MFA is not enabled for this user" }, { status: 400 });
      }

      const isValid = verifyTOTP(user.mfa_secret || "", code);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid MFA code" }, { status: 401 });
      }

      resetRateLimit(rateLimitKey, 'auth');
      await updateUserLastLoginAsync(username);

      return NextResponse.json({
        success: true,
        user: {
          username: user.username,
          email: user.email,
          accountName: user.account_name,
          permissions: JSON.parse(user.permissions),
          isRoot: user.is_root === 1,
          accessKeyId: user.access_key_id,
          secretAccessKey: user.secret_access_key,
          mfaEnabled: user.mfa_enabled === 1,
        },
      });
    }

    // ─── Sign Up ────────────────────────────────────────────────────────────
    if (action === "signup") {
      const { username, password, email, accountName } = body;
      if (!username || !password || !email) {
        return NextResponse.json({ error: "Username, password, and email required" }, { status: 400 });
      }

      const existing = await getUserByUsernameAsync(username);
      if (existing) {
        return NextResponse.json({ error: "Username already exists" }, { status: 409 });
      }

      const user = await createUserAsync({ username, password, email, accountName });

      resetRateLimit(rateLimitKey, 'auth');

      return NextResponse.json({
        success: true,
        user: {
          username: user.username,
          email: user.email,
          accountName: user.account_name,
          permissions: JSON.parse(user.permissions),
          isRoot: user.is_root === 1,
          accessKeyId: user.access_key_id,
          secretAccessKey: user.secret_access_key,
        },
      });
    }

    // ─── Reset Password ─────────────────────────────────────────────────────
    if (action === "resetPassword") {
      const { username, newPassword } = body;
      if (!username || !newPassword) {
        return NextResponse.json({ error: "Username and new password required" }, { status: 400 });
      }

      const user = await getUserByUsernameAsync(username);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      await updateUserPasswordAsync(username, newPassword);
      
      resetRateLimit(rateLimitKey, 'auth');
      
      return NextResponse.json({ success: true });
    }

    // ─── Setup MFA ──────────────────────────────────────────────────────────
    if (action === "setupMFA") {
      const { username } = body;
      if (!username) {
        return NextResponse.json({ error: "Username required" }, { status: 400 });
      }

      const user = await getUserByUsernameAsync(username);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const secret = generateMFASecret();
      const qrCode = await generateQRCode(username, secret);

      await updateUserMFAAsync(username, false, secret);

      return NextResponse.json({
        success: true,
        secret,
        qrCode,
      });
    }

    // ─── Verify MFA ─────────────────────────────────────────────────────────
    if (action === "verifyMFA") {
      const { username, code } = body;
      if (!username || !code) {
        return NextResponse.json({ error: "Username and code required" }, { status: 400 });
      }

      const user = await getUserByUsernameAsync(username);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      if (!user.mfa_secret) {
        return NextResponse.json({ error: "MFA setup not initiated. Call setupMFA first." }, { status: 400 });
      }

      const isValid = verifyTOTP(user.mfa_secret, code);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid MFA code" }, { status: 400 });
      }

      await updateUserMFAAsync(username, true, user.mfa_secret);

      return NextResponse.json({ success: true });
    }

    // ─── Disable MFA ────────────────────────────────────────────────────────
    if (action === "disableMFA") {
      const { username, code } = body;
      if (!username || !code) {
        return NextResponse.json({ error: "Username and MFA code required" }, { status: 400 });
      }

      const user = await getUserByUsernameAsync(username);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      if (user.mfa_enabled !== 1) {
        return NextResponse.json({ error: "MFA is not enabled" }, { status: 400 });
      }

      const isValid = verifyTOTP(user.mfa_secret || "", code);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid MFA code" }, { status: 401 });
      }

      await updateUserMFAAsync(username, false, null);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}