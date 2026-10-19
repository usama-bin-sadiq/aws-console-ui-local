import { NextResponse } from "next/server";
import {
  validateUserAsync,
  validateUserRecord,
  createUserAsync,
  getUserByUsernameAsync,
  getUserByEmailAsync,
  updateUserLastLoginAsync,
  updateUserPasswordAsync,
  updateUserMFAAsync,
} from "@/lib/db";
import type { UserRecord } from "@/lib/db";
import { generateMFASecret, generateQRCode, verifyTOTP } from "@/lib/mfa";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limiter";
import {
  clearSessionCookies,
  consumeMfaChallenge,
  createMfaChallenge,
  createSession,
  destroySession,
  getSessionFromRequest,
  setSessionCookies,
} from "@/lib/session-store";

const RATE_LIMITS = {
  signin: { windowMs: 15 * 60 * 1000, maxRequests: 5 },
  signup: { windowMs: 60 * 60 * 1000, maxRequests: 3 },
  resetPassword: { windowMs: 60 * 60 * 1000, maxRequests: 3 },
  verifyMFASignin: { windowMs: 15 * 60 * 1000, maxRequests: 5 },
} as const;

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  return forwarded?.split(",")[0]?.trim() || realIp || "unknown";
}

function toPublicUser(user: UserRecord) {
  return {
    username: user.username,
    email: user.email,
    accountName: user.account_name,
    permissions: JSON.parse(user.permissions),
    isRoot: user.is_root === 1,
    accessKeyId: user.access_key_id,
    mfaEnabled: user.mfa_enabled === 1,
    accountId: user.account_id ?? null,
  };
}

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = await getUserByUsernameAsync(session.username);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user: toPublicUser(user) });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;
    const clientIp = getClientIp(request);
    const rateLimitKey = `${action}:${clientIp}`;

    if (action in RATE_LIMITS) {
      const limit = RATE_LIMITS[action as keyof typeof RATE_LIMITS];
      const result = checkRateLimit(rateLimitKey, { ...limit, keyPrefix: "auth" });

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
            },
          },
        );
      }
    }

    if (action === "signout") {
      await destroySession(request);
      const response = NextResponse.json({ success: true });
      clearSessionCookies(response);
      return response;
    }

    if (!["signin", "signup", "verifyMFASignin", "signout"].includes(action)) {
      const origin = request.headers.get("origin");
      const host = request.headers.get("host");
      if (origin && host) {
        try {
          if (new URL(origin).host !== host) {
            return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
          }
        } catch {
          return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
        }
      }
    }

    // ─── Sign In ────────────────────────────────────────────────────────────
    if (action === "signin") {
      const { username, password, email, accountId } = body;
      if (!password || (!username && !email)) {
        return NextResponse.json(
          { error: "Username, email, or account ID and password required" },
          { status: 400 },
        );
      }

      const ACCOUNT_MISMATCH = "The account ID or user name you entered doesn't exist";
      const BAD_CREDENTIALS = "Incorrect user name or password";

      let user: UserRecord | undefined;

      if (email) {
        // Root path: resolve by email, then check the password.
        user = await getUserByEmailAsync(email);
        if (!user || !validateUserRecord(user, password)) {
          return NextResponse.json({ error: BAD_CREDENTIALS }, { status: 401 });
        }
      } else if (accountId) {
        // IAM path: resolve by username, then require a matching account ID
        // (or account name alias). Legacy rows without an account ID are accepted.
        user = await getUserByUsernameAsync(username);
        if (!user) {
          return NextResponse.json({ error: ACCOUNT_MISMATCH }, { status: 401 });
        }
        const accountMatches = user.account_id === accountId || user.account_name === accountId;
        if (user.account_id !== null && !accountMatches) {
          return NextResponse.json({ error: ACCOUNT_MISMATCH }, { status: 401 });
        }
        if (!validateUserRecord(user, password)) {
          return NextResponse.json({ error: BAD_CREDENTIALS }, { status: 401 });
        }
      } else {
        // Legacy path: username + password only.
        user = await validateUserAsync(username, password);
        if (!user) {
          return NextResponse.json({ error: BAD_CREDENTIALS }, { status: 401 });
        }
      }

      if (user.mfa_enabled === 1) {
        const sessionToken = await createMfaChallenge(user.username);
        return NextResponse.json({
          mfaRequired: true,
          sessionToken,
          username: user.username,
        });
      }

      resetRateLimit(rateLimitKey, "auth");
      await updateUserLastLoginAsync(user.username);

      const session = await createSession(user.username);
      const response = NextResponse.json({
        success: true,
        user: toPublicUser(user),
      });
      setSessionCookies(response, session);
      return response;
    }

    // ─── Verify MFA Sign-In ────────────────────────────────────────────────
    if (action === "verifyMFASignin") {
      const { username, sessionToken, code } = body;
      if (!username || !sessionToken || !code) {
        return NextResponse.json(
          { error: "Username, session token, and MFA code required" },
          { status: 400 },
        );
      }

      if (!(await consumeMfaChallenge(sessionToken, username))) {
        return NextResponse.json({ error: "MFA challenge expired or invalid" }, { status: 401 });
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

      resetRateLimit(rateLimitKey, "auth");
      await updateUserLastLoginAsync(username);

      const session = await createSession(username);
      const response = NextResponse.json({
        success: true,
        user: toPublicUser(user),
      });
      setSessionCookies(response, session);
      return response;
    }

    // ─── Sign Up ────────────────────────────────────────────────────────────
    if (action === "signup") {
      const { username, password, email, accountName } = body;
      if (!username || !password || !email) {
        return NextResponse.json(
          { error: "Username, password, and email required" },
          { status: 400 },
        );
      }

      const existing = await getUserByUsernameAsync(username);
      if (existing) {
        return NextResponse.json({ error: "Username already exists" }, { status: 409 });
      }

      const user = await createUserAsync({ username, password, email, accountName });

      resetRateLimit(rateLimitKey, "auth");

      const session = await createSession(user.username);
      const response = NextResponse.json({
        success: true,
        user: toPublicUser(user),
      });
      setSessionCookies(response, session);
      return response;
    }

    // ─── Reset Password ─────────────────────────────────────────────────────
    if (action === "resetPassword") {
      const { newPassword } = body;
      const session = await getSessionFromRequest(request);
      if (!session) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }
      if (!newPassword) {
        return NextResponse.json({ error: "New password required" }, { status: 400 });
      }

      await updateUserPasswordAsync(session.username, newPassword);
      resetRateLimit(rateLimitKey, "auth");
      return NextResponse.json({ success: true });
    }

    // ─── Setup MFA ──────────────────────────────────────────────────────────
    if (action === "setupMFA") {
      const session = await getSessionFromRequest(request);
      if (!session) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      const user = await getUserByUsernameAsync(session.username);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const secret = generateMFASecret();
      const qrCode = await generateQRCode(session.username, secret);
      await updateUserMFAAsync(session.username, false, secret);

      return NextResponse.json({ success: true, secret, qrCode });
    }

    // ─── Verify MFA ─────────────────────────────────────────────────────────
    if (action === "verifyMFA") {
      const { code } = body;
      const session = await getSessionFromRequest(request);
      if (!session) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }
      if (!code) {
        return NextResponse.json({ error: "Code required" }, { status: 400 });
      }

      const user = await getUserByUsernameAsync(session.username);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      if (!user.mfa_secret) {
        return NextResponse.json(
          { error: "MFA setup not initiated. Call setupMFA first." },
          { status: 400 },
        );
      }

      const isValid = verifyTOTP(user.mfa_secret, code);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid MFA code" }, { status: 400 });
      }

      await updateUserMFAAsync(session.username, true, user.mfa_secret);
      return NextResponse.json({ success: true });
    }

    // ─── Disable MFA ────────────────────────────────────────────────────────
    if (action === "disableMFA") {
      const { code } = body;
      const session = await getSessionFromRequest(request);
      if (!session) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }
      if (!code) {
        return NextResponse.json({ error: "MFA code required" }, { status: 400 });
      }

      const user = await getUserByUsernameAsync(session.username);
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

      await updateUserMFAAsync(session.username, false, null);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
