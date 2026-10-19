"use client";

import Link from "next/link";
import { useState } from "react";
import AuthShell, { Alert } from "../login/AuthShell";
import s from "../login/auth.module.css";

/**
 * Password recovery — the design's Forgot-Password frame.
 *
 * The emulator has no outbound mail, so the form confirms the request rather
 * than pretending a message was delivered. The character challenge is present
 * to match the design and to keep the field layout honest; it is not a security
 * control here, and the note says so.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Enter the email address for your account.");
      return;
    }
    if (!captcha.trim()) {
      setError("Type the characters shown.");
      return;
    }
    setSent(true);
  };

  return (
    <AuthShell
      heroTitle="Reset your password"
      heroBody={
        <p>Enter the email address for your account and we will send instructions to reset it.</p>
      }
      cardTitle="Password recovery"
    >
      {sent ? (
        <>
          <Alert tone="success">
            If an account exists for {email}, reset instructions would be sent there. This emulator
            does not send mail.
          </Alert>
          <Link href="/login" className={`${s.btn} ${s.btnPrimary} ${s.btnFull}`}>
            Back to sign in
          </Link>
        </>
      ) : (
        <form onSubmit={submit} noValidate>
          {error && <Alert tone="error">{error}</Alert>}

          <div className={`${s.field}${error && !email.trim() ? ` ${s.fieldInvalid}` : ""}`}>
            <label htmlFor="recover-email">Email address</label>
            <input
              id="recover-email"
              className={s.input}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="[name@example.com]"
            />
          </div>

          <div className={s.field}>
            <label htmlFor="recover-captcha">Type the characters shown</label>
            <input
              id="recover-captcha"
              className={s.input}
              type="text"
              autoComplete="off"
              value={captcha}
              onChange={(e) => setCaptcha(e.target.value)}
              placeholder="[captcha]"
            />
            <span className={s.hint}>
              The emulator does not issue mail, so this challenge is a layout element rather than a
              security control.
            </span>
          </div>

          <button type="submit" className={`${s.btn} ${s.btnPrimary} ${s.btnFull}`}>
            Send email
          </button>

          <div style={{ marginTop: 16 }}>
            <Link href="/login" className={s.btnLink}>
              Back to sign in
            </Link>
          </div>
        </form>
      )}
    </AuthShell>
  );
}
