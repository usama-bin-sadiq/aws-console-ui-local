"use client";

import { apiFetch } from "@/lib/api-client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import AuthShell from "@/app/login/AuthShell";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FieldErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

interface CreatedAccount {
  username: string;
  email?: string;
  accountName?: string;
  accountId?: string;
  accessKeyId?: string;
}

interface AuthApiResponse {
  success?: boolean;
  error?: string;
  retryAfter?: number;
  user?: {
    username?: string;
    email?: string;
    accountName?: string;
    accountId?: string;
    accessKeyId?: string;
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validateFields(v: {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}): FieldErrors {
  const errors: FieldErrors = {};

  if (!v.username.trim()) {
    errors.username = "Enter a user name.";
  }

  const email = v.email.trim();
  if (!email) {
    errors.email = "Enter your email address.";
  } else if (!EMAIL_RE.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!v.password || v.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  if (!v.confirmPassword) {
    errors.confirmPassword = "Re-enter your password.";
  } else if (v.confirmPassword !== v.password) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

function formatApiError(status: number, data: AuthApiResponse | null): string {
  const base = data?.error;

  if (status === 429) {
    const message = base || "Too many attempts. Please try again later.";
    const retryAfter = typeof data?.retryAfter === "number" ? data.retryAfter : 0;
    if (retryAfter > 0) {
      const minutes = Math.max(1, Math.ceil(retryAfter / 60));
      return `${message} Try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`;
    }
    return message;
  }

  if (base) return base;
  if (status === 409) return "Username already exists";
  return "Sign up failed. Please try again.";
}

function firstErrorElement(errors: FieldErrors): HTMLElement | null {
  const order: Array<keyof FieldErrors> = ["username", "email", "password", "confirmPassword"];
  for (const key of order) {
    if (errors[key]) {
      return document.getElementById(`su-${key}`);
    }
  }
  return null;
}

// ─── Styles (AWS-style form markup) ───────────────────────────────────────────

const CSS = `
.su-page {
  min-height: 100vh;
  background: var(--surface);
  color: var(--text);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 48px 24px;
  font-family: "Open Sans", "Helvetica Neue", Arial, sans-serif;
  font-size: 14px;
  container-type: inline-size;
}
.su-page *, .su-page *::before, .su-page *::after { box-sizing: border-box; }

.su-card {
  flex: 0 1 400px;
  min-width: min(100%, 300px);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 28px;
}

.su-body { min-width: 0; }
.su-muted-aside { color: var(--muted); font-size: 16px; line-height: 1.6; }
.su-muted-aside a, .su-terms a { text-decoration: underline; }
.su-title { font-size: 24px; font-weight: 700; margin: 0 0 16px; color: var(--text); }
.su-sub { font-size: 16px; line-height: 1.6; color: var(--muted); margin: 0 0 20px; }

.su-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
.su-label { font-size: 14px; font-weight: 700; color: var(--text); }
.su-hint { font-size: 12px; color: var(--muted); margin: 0; }

.su-input {
  height: 44px;
  width: 100%;
  min-width: 0;
  border: 1px solid #8c97a5;
  border-radius: 8px;
  padding: 0 12px;
  font: 14px "Open Sans", "Helvetica Neue", Arial, sans-serif;
  background: var(--surface);
  color: var(--text);
}
.su-input::placeholder { color: var(--muted); }
.su-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--hl);
}
.su-input:disabled { background: var(--bg); color: var(--muted); }

.su-username-error .su-input,
.su-email-error .su-input,
.su-password-error .su-input,
.su-confirmPassword-error .su-input { border-color: var(--err); border-width: 2px; }
.su-error-text { color: var(--err); font-size: 12px; display: flex; gap: 6px; align-items: center; margin: 0; }

.su-check {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  font-size: 14px;
  min-height: 44px;
  cursor: pointer;
}
.su-check input { margin-top: 3px; width: 18px; height: 18px; flex: none; accent-color: var(--accent); }

.su-rules { list-style: none; margin: 6px 0 0; padding: 0; font-size: 12px; }
.su-rules li { display: flex; gap: 6px; align-items: center; color: var(--muted); }
.su-rule-ok { color: var(--ok); font-weight: 700; }
.su-rule-pending { color: var(--muted); }

.su-alert {
  border: 1px solid var(--border);
  background: var(--hl);
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 14px;
  margin-bottom: 20px;
}
.su-alert-success { border-color: var(--ok); background: var(--okbg); }
.su-alert-error { border-color: var(--err); background: rgba(217, 21, 21, 0.08); }
.su-alert-success-title { font-weight: 700; margin-bottom: 8px; }

.su-kv { display: flex; gap: 8px; font-size: 13px; padding: 2px 0; }
.su-kv dt { color: var(--muted); min-width: 120px; }
.su-kv dd { margin: 0; color: var(--text); word-break: break-all; }

.su-form-error {
  border: 1px solid var(--err);
  background: rgba(217, 21, 21, 0.08);
  border-radius: 8px;
  padding: 12px 16px;
  color: var(--text);
  font-size: 14px;
  margin: 0 0 16px;
}

.su-button {
  min-height: 44px;
  width: 100%;
  padding: 0 20px;
  border-radius: 20px;
  border: 2px solid var(--pri);
  background: var(--pri);
  color: #fff;
  font-family: inherit;
  font-weight: 700;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
}
.su-button:hover:not(:disabled) { background: var(--prih); border-color: var(--prih); }
.su-button:disabled { opacity: 0.55; cursor: not-allowed; }
.su-button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

.su-spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: su-spin 0.7s linear infinite;
}
@keyframes su-spin { to { transform: rotate(360deg); } }

.su-link { color: var(--link); text-decoration: none; }
.su-link:hover { color: var(--linkh); text-decoration: underline; }

.su-terms { color: var(--muted); font-size: 12px; margin: 16px 0 0; }
.su-footer { color: var(--muted); font-size: 14px; margin: 20px 0 0; text-align: center; }

@container (max-width: 760px) {
  .su-page { padding: 24px 16px; }
  .su-card { padding: 20px; }
  .su-title { font-size: 22px; }
}
`;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SignupPage() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountName, setAccountName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedAccount | null>(null);
  const [signInError, setSignInError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [phase, setPhase] = useState<"creating" | "signingIn">("creating");

  const clearFieldError = (key: keyof FieldErrors) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next: FieldErrors = { ...prev };
      delete next[key];
      return next;
    });
  };

  const inputType = showPassword ? "text" : "password";
  const passwordTooShort = password.length < MIN_PASSWORD_LENGTH;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending || created) return;

    const errors = validateFields({ username, email, password, confirmPassword });
    setFieldErrors(errors);
    setFormError(null);
    setSignInError(null);

    const invalid = firstErrorElement(errors);
    if (invalid) {
      invalid.focus();
      return;
    }

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    const trimmedAccountName = accountName.trim();

    setPending(true);
    setPhase("creating");

    try {
      const res = await apiFetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "signup",
          username: trimmedUsername,
          password,
          email: trimmedEmail,
          ...(trimmedAccountName ? { accountName: trimmedAccountName } : {}),
        }),
      });

      let data: AuthApiResponse | null = null;
      try {
        data = (await res.json()) as AuthApiResponse;
      } catch {
        data = null;
      }

      if (!res.ok) {
        setFormError(formatApiError(res.status, data));
        setPending(false);
        return;
      }

      // Account created — surface success info before establishing the session.
      setCreated({
        username: data?.user?.username ?? trimmedUsername,
        email: data?.user?.email ?? trimmedEmail,
        accountName: data?.user?.accountName,
        accountId: data?.user?.accountId,
        accessKeyId: data?.user?.accessKeyId,
      });

      setPhase("signingIn");
      try {
        await signIn(trimmedUsername, password);
      } catch (err) {
        setSignInError(
          err instanceof Error && err.message
            ? err.message
            : "Sign in failed with your new account.",
        );
        setPending(false);
        return;
      }

      router.push("/");
    } catch (err) {
      setFormError(
        err instanceof Error && err.message
          ? err.message
          : "Something went wrong. Please try again.",
      );
      setPending(false);
    }
  }

  const buttonLabel = pending
    ? phase === "creating"
      ? "Creating account..."
      : "Signing in..."
    : "Create account";

  return (
    <AuthShell
      heroTitle="Create an account"
      heroBody={<p>Set up a console account and start managing your services.</p>}
      heroAside={
        <p className="su-muted-aside">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      }
      cardTitle="Sign up"
    >
      <style>{CSS}</style>
      <div className="su-body">
        {created && (
          <div className="su-alert su-alert-success" role="status">
            <div className="su-alert-success-title">Account created</div>
            <dl style={{ margin: 0 }}>
              <div className="su-kv">
                <dt>User name</dt>
                <dd>{created.username}</dd>
              </div>
              {created.accountName && (
                <div className="su-kv">
                  <dt>Account name</dt>
                  <dd>{created.accountName}</dd>
                </div>
              )}
              {created.accountId && (
                <div className="su-kv">
                  <dt>Account ID</dt>
                  <dd>{created.accountId}</dd>
                </div>
              )}
              {created.accessKeyId && (
                <div className="su-kv">
                  <dt>Access key ID</dt>
                  <dd>{created.accessKeyId}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        <form noValidate onSubmit={handleSubmit}>
          <div className="su-field">
            <label className="su-label" htmlFor="su-username">
              User name
            </label>
            <input
              id="su-username"
              className="su-input"
              type="text"
              placeholder="[user name]"
              autoComplete="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                clearFieldError("username");
              }}
              aria-invalid={fieldErrors.username ? true : undefined}
              aria-describedby={fieldErrors.username ? "su-username-error" : "su-username-hint"}
              disabled={pending || created !== null}
            />
            {fieldErrors.username ? (
              <p className="su-error-text" id="su-username-error" role="alert">
                {fieldErrors.username}
              </p>
            ) : (
              <p className="su-hint" id="su-username-hint">
                Used to sign in to this console.
              </p>
            )}
          </div>

          <div className="su-field">
            <label className="su-label" htmlFor="su-email">
              Email address
            </label>
            <input
              id="su-email"
              className="su-input"
              type="email"
              placeholder="[name@example.com]"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearFieldError("email");
              }}
              aria-invalid={fieldErrors.email ? true : undefined}
              aria-describedby={fieldErrors.email ? "su-email-error" : "su-email-hint"}
              disabled={pending || created !== null}
            />
            {fieldErrors.email ? (
              <p className="su-error-text" id="su-email-error" role="alert">
                {fieldErrors.email}
              </p>
            ) : (
              <p className="su-hint" id="su-email-hint">
                No verification email is sent in this emulator — you can sign in right away.
              </p>
            )}
          </div>

          <div className="su-field">
            <label className="su-label" htmlFor="su-password">
              Password
            </label>
            <input
              id="su-password"
              className="su-input"
              type={inputType}
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearFieldError("password");
              }}
              aria-invalid={fieldErrors.password ? true : undefined}
              aria-describedby={fieldErrors.password ? "su-password-error" : "su-password-rules"}
              disabled={pending || created !== null}
            />
            {fieldErrors.password && (
              <p className="su-error-text" id="su-password-error" role="alert">
                {fieldErrors.password}
              </p>
            )}
            <ul className="su-rules" id="su-password-rules">
              <li className={passwordTooShort ? "su-rule-pending" : "su-rule-ok"}>
                <span aria-hidden="true">{passwordTooShort ? "○" : "✓"}</span>
                Minimum {MIN_PASSWORD_LENGTH} characters
              </li>
            </ul>
            <label className="su-check">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                disabled={created !== null}
              />
              Show password
            </label>
          </div>

          <div className="su-field">
            <label className="su-label" htmlFor="su-confirmPassword">
              Confirm password
            </label>
            <input
              id="su-confirmPassword"
              className="su-input"
              type={inputType}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                clearFieldError("confirmPassword");
              }}
              aria-invalid={fieldErrors.confirmPassword ? true : undefined}
              aria-describedby={
                fieldErrors.confirmPassword ? "su-confirmPassword-error" : undefined
              }
              disabled={pending || created !== null}
            />
            {fieldErrors.confirmPassword && (
              <p className="su-error-text" id="su-confirmPassword-error" role="alert">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          <div className="su-field">
            <label className="su-label" htmlFor="su-accountName">
              Account name
            </label>
            <input
              id="su-accountName"
              className="su-input"
              type="text"
              autoComplete="off"
              placeholder="[account name]"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              aria-describedby="su-accountName-hint"
              disabled={pending || created !== null}
            />
            <p className="su-hint" id="su-accountName-hint">
              Optional — a name is generated for you if left blank.
            </p>
          </div>

          {formError && (
            <p className="su-form-error" role="alert">
              {formError}
            </p>
          )}

          {signInError && (
            <p className="su-form-error" role="alert">
              Your account was created, but automatic sign-in failed: {signInError}{" "}
              <Link href="/login" className="su-link">
                Sign in
              </Link>{" "}
              with your new account.
            </p>
          )}

          <button type="submit" className="su-button" disabled={pending || created !== null}>
            {pending && <span className="su-spinner" aria-hidden="true" />}
            {buttonLabel}
          </button>

          <p className="su-terms">
            By continuing, you agree to the Terms of Use — this is a local emulator, no real cloud
            account is created.
          </p>
        </form>
      </div>
    </AuthShell>
  );
}
