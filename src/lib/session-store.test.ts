import { describe, expect, it } from "vite-plus/test";
import {
  CSRF_COOKIE,
  SESSION_COOKIE,
  consumeMfaChallenge,
  createMfaChallenge,
  createSession,
  destroySession,
  getSessionFromRequest,
  validateCsrf,
} from "@/lib/session-store";

describe("server session store", () => {
  it("stores a hashed session, validates CSRF, and destroys the session", async () => {
    const created = await createSession("session-test-user");
    const request = new Request("http://localhost/api/test", {
      headers: {
        cookie: `${SESSION_COOKIE}=${created.token}; ${CSRF_COOKIE}=${created.csrfToken}`,
        "x-csrf-token": created.csrfToken,
      },
    });

    const session = await getSessionFromRequest(request);
    expect(session?.username).toBe("session-test-user");
    expect(session && (await validateCsrf(request, session))).toBe(true);

    await destroySession(request);
    expect(await getSessionFromRequest(request)).toBeNull();
  });

  it("rejects missing, invalid, and consumed sessions/challenges", async () => {
    expect(await getSessionFromRequest(new Request("http://localhost"))).toBeNull();
    expect(
      await getSessionFromRequest(
        new Request("http://localhost", {
          headers: { cookie: `${SESSION_COOKIE}=invalid` },
        }),
      ),
    ).toBeNull();

    const session = await createSession("csrf-test-user");
    const request = new Request("http://localhost", {
      headers: {
        cookie: `${SESSION_COOKIE}=${session.token}; ${CSRF_COOKIE}=wrong`,
        "x-csrf-token": "wrong",
      },
    });
    const context = await getSessionFromRequest(request);
    expect(context && (await validateCsrf(request, context))).toBe(false);
    await destroySession(request);

    const challenge = await createMfaChallenge("mfa-test-user");
    expect(await consumeMfaChallenge(challenge, "mfa-test-user")).toBe(true);
    expect(await consumeMfaChallenge(challenge, "mfa-test-user")).toBe(false);
  });
});
