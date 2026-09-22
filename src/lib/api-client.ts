/**
 * API client wrapper that automatically injects user credentials and identity
 * into every request to /api/* routes, enabling per-user data isolation.
 */

function getUserSession(): {
  accessKeyId?: string;
  secretAccessKey?: string;
  sessionToken?: string;
  region?: string;
  username?: string;
  isSuperAdmin?: boolean;
} {
  if (typeof window === "undefined") return {};

  try {
    // Try root session
    const rootSession = localStorage.getItem("aws_console_root_session");
    if (rootSession) {
      const session = JSON.parse(rootSession);
      return {
        accessKeyId: session.credentials?.accessKeyId,
        secretAccessKey: session.credentials?.secretAccessKey,
        sessionToken: session.credentials?.sessionToken,
        region: process.env.NEXT_PUBLIC_AWS_REGION || process.env.AWS_REGION || "us-east-1",
        username: "root",
        isSuperAdmin: true,
      };
    }

    // Try amplify session
    const amplifySession = localStorage.getItem("aws_console_amplify_session");
    if (amplifySession) {
      const session = JSON.parse(amplifySession);
      return {
        accessKeyId: session.credentials?.accessKeyId,
        secretAccessKey: session.credentials?.secretAccessKey,
        sessionToken: session.credentials?.sessionToken,
        region: process.env.NEXT_PUBLIC_AWS_REGION || process.env.AWS_REGION || "us-east-1",
        username: session.username,
        isSuperAdmin: session.username === "root",
      };
    }

    // Try credentials session
    const credsSession = localStorage.getItem("aws_console_credentials_session");
    if (credsSession) {
      const session = JSON.parse(credsSession);
      return {
        accessKeyId: session.credentials?.accessKeyId,
        secretAccessKey: session.credentials?.secretAccessKey,
        sessionToken: session.credentials?.sessionToken,
        region: process.env.NEXT_PUBLIC_AWS_REGION || process.env.AWS_REGION || "us-east-1",
        username: session.credentials?.accessKeyId === "test" ? "root" : "custom",
        isSuperAdmin: session.credentials?.accessKeyId === "test",
      };
    }
  } catch {
    // ignore parse errors
  }

  return {};
}

/**
 * Wrapper around `fetch` that injects AWS credentials + user identity into
 * request headers for all /api/* calls.
 */
export async function apiFetch(
  url: string | URL,
  init?: RequestInit & { json?: unknown }
): Promise<Response> {
  const session = getUserSession();

  const headers = new Headers(init?.headers);

  // Inject user credentials
  if (session.accessKeyId) headers.set("x-aws-access-key-id", session.accessKeyId);
  if (session.secretAccessKey) headers.set("x-aws-secret-access-key", session.secretAccessKey);
  if (session.sessionToken) headers.set("x-aws-session-token", session.sessionToken);
  if (session.region) headers.set("x-aws-region", session.region);

  // Inject user identity for data isolation
  if (session.username) headers.set("x-aws-username", session.username);
  if (session.isSuperAdmin !== undefined) headers.set("x-aws-is-super-admin", String(session.isSuperAdmin));

  // Convenience: serialize json body
  if (init?.json !== undefined) {
    headers.set("Content-Type", "application/json");
    const finalInit: RequestInit = {
      ...init,
      headers,
      body: JSON.stringify(init.json),
    };
    delete (finalInit as any).json;
    return fetch(url, finalInit);
  }

  return fetch(url, { ...init, headers });
}
