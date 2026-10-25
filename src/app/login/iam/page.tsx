"use client";

import { Button, Box } from "@cloudscape-design/components";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import MfaPrompt from "../MfaPrompt";

const REMEMBER_KEY = "aws_console_remembered_account";

const CSS = `
.aws-page {
  box-sizing: border-box;
  min-height: 100vh;
  background: var(--bg-page);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: var(--text-primary);
}
.aws-page *, .aws-page *::before, .aws-page *::after { box-sizing: border-box; }
.aws-card {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: 6px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 420px;
  padding: 30px 36px 34px;
}
.aws-logo { display: block; margin: 0 auto; filter: brightness(0); }
.aws-h1 { margin: 18px 0 22px; font-size: 26px; line-height: 1.2; font-weight: 400; color: var(--text-header); }
.aws-field { margin-bottom: 16px; }
.aws-label-row { display: flex; align-items: baseline; gap: 8px; margin-bottom: 6px; }
.aws-label { display: block; font-size: 14px; font-weight: 400; color: var(--text-primary); margin-bottom: 6px; }
.aws-label-row .aws-label { margin-bottom: 0; }
.aws-input {
  display: block;
  width: 100%;
  height: 40px;
  padding: 8px 12px;
  font-size: 15px;
  font-family: inherit;
  color: var(--text-primary);
  background: var(--bg-card);
  border: 1px solid var(--border-focus);
  border-radius: 8px;
  outline: none;
}
.aws-input::placeholder { color: var(--border-focus); }
.aws-input:focus { border-color: var(--primary-color); box-shadow: 0 0 0 2px var(--primary-color-alpha); }
.aws-checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-primary);
  cursor: pointer;
  user-select: none;
}
.aws-checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  margin: 0;
  accent-color: var(--primary-color);
  cursor: pointer;
}
.aws-remember-row { margin-bottom: 18px; }
.aws-show-row { margin-top: 10px; margin-bottom: 4px; }
.aws-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 40px;
  padding: 8px 18px;
  font-size: 15px;
  font-family: inherit;
  font-weight: 400;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
}
.aws-btn-primary { background: var(--primary-color); color: var(--bg-card); }
.aws-btn-primary:hover:not(:disabled) { background: var(--primary-hover); }
.aws-btn-primary:active:not(:disabled) { background: var(--primary-active); }
.aws-btn-primary:disabled { opacity: 0.7; cursor: default; }
.aws-link, .aws-link-btn {
  color: var(--primary-color);
  font-size: 14px;
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  font-family: inherit;
  cursor: pointer;
  text-decoration: none;
}
.aws-link:hover, .aws-link-btn:hover { color: var(--primary-hover); text-decoration: underline; }
.aws-link-btn { font-size: 13px; }
.aws-nav-links { display: flex; flex-direction: column; gap: 12px; align-items: center; margin-top: 18px; }
.aws-help {
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-secondary);
  background: var(--bg-page);
  border-left: 3px solid var(--primary-color);
  border-radius: 4px;
  padding: 8px 12px;
  margin: 0 0 16px;
}
.aws-error { font-size: 14px; line-height: 1.5; color: var(--error-color); margin: 0 0 14px; }
@media (max-width: 480px) {
  .aws-card { padding: 24px 18px 28px; }
  .aws-h1 { font-size: 22px; }
}
`;

export default function IamLoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [account, setAccount] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAccountHelp, setShowAccountHelp] = useState(false);
  const [showTroubleHelp, setShowTroubleHelp] = useState(false);
  const [mfa, setMfa] = useState<{ username: string; sessionToken: string } | null>(null);

  // Prefill the remembered account on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_KEY);
      if (saved) {
        queueMicrotask(() => {
          setAccount(saved);
        });
        queueMicrotask(() => {
          setRemember(true);
        });
      }
    } catch {
      // localStorage unavailable — ignore
    }
  }, []);

  const handleAccountChange = (value: string) => {
    setAccount(value);
    if (remember) {
      if (value.trim()) localStorage.setItem(REMEMBER_KEY, value.trim());
      else localStorage.removeItem(REMEMBER_KEY);
    }
  };

  const handleRememberChange = (checked: boolean) => {
    setRemember(checked);
    if (checked) {
      if (account.trim()) localStorage.setItem(REMEMBER_KEY, account.trim());
      else localStorage.removeItem(REMEMBER_KEY);
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!account.trim()) {
      setError("Enter your account ID or alias.");
      return;
    }
    if (!username.trim()) {
      setError("Enter your IAM user name.");
      return;
    }
    if (!password) {
      setError("Enter your password.");
      return;
    }

    // Persist the account on a sign-in attempt when "Remember this account" is checked
    if (remember) localStorage.setItem(REMEMBER_KEY, account.trim());

    setLoading(true);
    try {
      await signIn(username.trim(), password, { accountId: account.trim() });
      router.push("/");
    } catch (err) {
      const mfaErr = err as Error & {
        mfaRequired?: boolean;
        sessionToken?: string;
        username?: string;
      };
      if (mfaErr.mfaRequired) {
        setMfa({
          username: mfaErr.username || username.trim(),
          sessionToken: mfaErr.sessionToken || "",
        });
      } else {
        setError((err as Error).message || "Sign in failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box padding="l" className="aws-page">
      <style>{CSS}</style>
      <main className="aws-card">
        <Image src="/aws-logo.svg" alt="AWS" width={40} height={24} className="aws-logo" />
        <h1 className="aws-h1">IAM user sign in</h1>

        {mfa ? (
          <MfaPrompt username={mfa.username} sessionToken={mfa.sessionToken} />
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="aws-field">
              <div className="aws-label-row">
                <label className="aws-label" htmlFor="iam-account">
                  Account ID or alias
                </label>
                <Button
                  variant="link"
                  aria-expanded={showAccountHelp}
                  onClick={() => setShowAccountHelp((v) => !v)}
                >
                  (Don&apos;t have?)
                </Button>
              </div>
              <input
                id="iam-account"
                className="aws-input"
                type="text"
                inputMode="numeric"
                maxLength={64}
                autoComplete="off"
                value={account}
                onChange={(e) => handleAccountChange(e.target.value)}
                placeholder="631432276713"
              />
            </div>
            {showAccountHelp && (
              <div className="aws-help" role="note">
                <Link href="/signup" className="aws-link">
                  Don&apos;t have an account ID? Ask your account owner, or create a new AWS
                  account.
                </Link>
              </div>
            )}

            <div className="aws-remember-row">
              <label className="aws-checkbox-label">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => handleRememberChange(e.target.checked)}
                />
                Remember this account
              </label>
            </div>

            <div className="aws-field">
              <label className="aws-label" htmlFor="iam-username">
                IAM username
              </label>
              <input
                id="iam-username"
                className="aws-input"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="IAM username"
              />
            </div>

            <div className="aws-field">
              <label className="aws-label" htmlFor="iam-password">
                Password
              </label>
              <input
                id="iam-password"
                className="aws-input"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
              />
              <div className="aws-show-row">
                <label className="aws-checkbox-label">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                  />
                  Show Password
                </label>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Button
                variant="link"
                aria-expanded={showTroubleHelp}
                onClick={() => setShowTroubleHelp((v) => !v)}
              >
                Having trouble?
              </Button>
            </div>
            {showTroubleHelp && (
              <div className="aws-help" role="note">
                Use the exact IAM user name for this account. In this emulator, root email sign-in
                is also available.
              </div>
            )}

            {error && (
              <div className="aws-error" role="alert">
                {error}
              </div>
            )}

            <Button formAction="submit" variant="primary" disabled={loading}>
              Sign in
            </Button>

            <div className="aws-nav-links">
              <Button variant="link" onClick={() => router.push("/login")}>
                Sign in using root user email
              </Button>
              <Button variant="link" onClick={() => router.push("/signup")}>
                Create a new AWS account
              </Button>
            </div>
          </form>
        )}
      </main>
    </Box>
  );
}
