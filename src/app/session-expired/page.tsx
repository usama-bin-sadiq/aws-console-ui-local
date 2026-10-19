"use client";

import Link from "next/link";
import AuthShell from "../login/AuthShell";
import s from "../login/auth.module.css";

/** Session-ended notice — the design's SessionExpired frame. */
export default function SessionExpiredPage() {
  return (
    <AuthShell
      heroTitle="Your session has expired"
      heroBody={<p>For your security, you were signed out after a period of inactivity.</p>}
      cardTitle="Sign in again"
    >
      <Link href="/login" className={`${s.btn} ${s.btnPrimary} ${s.btnFull}`}>
        Sign in
      </Link>
    </AuthShell>
  );
}
