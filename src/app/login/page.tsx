"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import AuthShell, { Alert, Divider } from "./AuthShell";
import s from "./auth.module.css";

type UserType = "root" | "iam";

/**
 * Sign in — the first step of the design's Signin frame.
 *
 * The design splits sign-in into two screens: identity first, then password.
 * That split is kept here, so step two matches the Signin-Error frame exactly.
 * There is no SMS or voice verification anywhere in this flow; the only second
 * factor the backend supports is an authenticator app code.
 */
export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [userType, setUserType] = useState<UserType>("root");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"identity" | "password">("identity");

  const submitIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (userType === "iam") {
      router.push("/login/iam");
      return;
    }
    if (!identifier.trim()) {
      setError("Enter your email address.");
      return;
    }
    setStep("password");
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!password) {
      setError("Enter your password.");
      return;
    }
    setLoading(true);
    try {
      const value = identifier.trim();
      // An address means root sign-in; a bare name means the local root account.
      if (value.includes("@")) {
        await signIn(value, password, { email: value });
      } else {
        await signIn(value, password);
      }
      router.push("/");
    } catch (err) {
      setError((err as Error).message || "Your authentication information is incorrect.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "identity") {
    return (
      <AuthShell
        heroTitle="Sign in to the console"
        heroBody={<p>Manage compute, storage, databases and networking from one place.</p>}
        heroAside={
          <p className={s.heroAside}>
            New here? <Link href="/signup">Create an account</Link>
          </p>
        }
        cardTitle="Sign in"
      >
        <form onSubmit={submitIdentity} noValidate>
          <div className={s.optGroup} role="radiogroup" aria-label="User type">
            <label className={s.opt}>
              <input
                type="radio"
                name="userType"
                value="root"
                checked={userType === "root"}
                onChange={() => setUserType("root")}
              />
              <span>
                <b>Root user</b>
                <span className={s.optDescription}>
                  Account owner that performs tasks requiring unrestricted access.
                </span>
              </span>
            </label>
            <label className={s.opt}>
              <input
                type="radio"
                name="userType"
                value="iam"
                checked={userType === "iam"}
                onChange={() => setUserType("iam")}
              />
              <span>
                <b>IAM user</b>
                <span className={s.optDescription}>
                  User within an account that performs daily tasks.
                </span>
              </span>
            </label>
          </div>

          {userType === "root" ? (
            <div className={s.field}>
              <label htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                className={s.input}
                type="email"
                autoComplete="email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="[name@example.com]"
              />
            </div>
          ) : (
            <div className={s.field}>
              <label htmlFor="login-alias">Account ID or alias</label>
              <input
                id="login-alias"
                className={s.input}
                type="text"
                autoComplete="off"
                placeholder="[account-id-or-alias]"
              />
              <span className={s.hint}>IAM users sign in with an account ID or alias.</span>
            </div>
          )}

          {error && <Alert tone="error">{error}</Alert>}

          <button
            type="submit"
            className={`${s.btn} ${s.btnOrange} ${s.btnFull}`}
            style={{ marginTop: 4 }}
          >
            Next
          </button>
        </form>

        <Divider>or</Divider>

        <Link href="/signup" className={`${s.btn} ${s.btnFull}`}>
          Create a new account
        </Link>

        <p className={s.legal}>
          By continuing, you agree to the <Link href="#customer-agreement">Customer Agreement</Link>{" "}
          and <Link href="#privacy-notice">Privacy Notice</Link>.
        </p>
      </AuthShell>
    );
  }

  // Second step. Laid out as the design's Signin-Error frame, minus the alert
  // until something actually goes wrong.
  return (
    <AuthShell
      heroTitle="Sign in to the console"
      heroBody={<p>Enter the password for your account.</p>}
      cardTitle="Root user sign in"
    >
      <form onSubmit={submitPassword} noValidate>
        {error && <Alert tone="error">{error}</Alert>}

        <div className={`${s.field}${error ? ` ${s.fieldInvalid}` : ""}`}>
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            className={s.input}
            type="password"
            autoComplete="current-password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {/* No placeholder: the design leaves this one empty, and a masked
              field already carries a visible label saying "Password". */}
          {/* The message itself lives in the alert above; repeating it here
              would read the same sentence twice on one screen. */}
        </div>

        <button type="submit" className={`${s.btn} ${s.btnOrange} ${s.btnFull}`} disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <div style={{ marginTop: 16 }}>
          <Link href="/forgot-password" className={s.btnLink}>
            Forgot password?
          </Link>
        </div>

        <div style={{ marginTop: 12 }}>
          <button
            type="button"
            className={s.btnLink}
            onClick={() => {
              setPassword("");
              setError("");
              setStep("identity");
            }}
          >
            Switch account
          </button>
        </div>
      </form>
    </AuthShell>
  );
}
