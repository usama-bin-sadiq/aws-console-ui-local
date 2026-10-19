"use client";

import Link from "next/link";
import { useSettingsStore } from "@/stores/settings";
import s from "./auth.module.css";

/**
 * The frame every auth screen shares: brand bar, two-column body, footer.
 *
 * The design file puts the brand in the bar and the copy in a hero beside the
 * card, so each screen passes only its own hero and card content.
 */
export default function AuthShell({
  heroTitle,
  heroBody,
  heroAside,
  cardTitle,
  children,
}: {
  heroTitle: string;
  /** Paragraphs under the hero heading. */
  heroBody?: React.ReactNode;
  /** Optional second paragraph, e.g. a "New here?" link. */
  heroAside?: React.ReactNode;
  cardTitle: string;
  children: React.ReactNode;
}) {
  const theme = useSettingsStore((st) => st.theme);

  return (
    <div className={`${s.auth}${theme === "dark" ? ` ${s.dark}` : ""}`} data-auth-theme={theme}>
      <header className={s.bar}>
        <Link href="/" className={s.brand}>
          <span className={s.brandMark}>cloud</span>
          <span>console</span>
        </Link>
      </header>

      <main className={s.main}>
        <div className={s.hero}>
          <h1>{heroTitle}</h1>
          {heroBody}
          {heroAside}
        </div>

        <section className={s.card}>
          <h1>{cardTitle}</h1>
          {children}
        </section>
      </main>

      <footer className={s.foot}>
        <a href="#cloudshell">CloudShell</a>
        <a href="#feedback">Feedback</a>
        <span>&copy; 2026, [Company], Inc. or its affiliates.</span>
        <span className={s.footRight}>
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
          <a href="#cookies">Cookie preferences</a>
        </span>
      </footer>
    </div>
  );
}

export function Alert({
  tone,
  children,
}: {
  tone: "error" | "success" | "info";
  children: React.ReactNode;
}) {
  const cls = tone === "error" ? s.alertError : tone === "success" ? s.alertSuccess : "";
  const iconColor = tone === "error" ? "currentColor" : "currentColor";
  return (
    <div className={`${s.alert} ${cls}`} role={tone === "error" ? "alert" : "status"}>
      <span className={s.alertIcon} style={{ color: iconColor }} aria-hidden="true">
        {tone === "error" ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
            <path d="M12 7v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="16.5" r="1.1" fill="currentColor" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
            <path
              d="M8 12.5l2.5 2.5L16 9.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span>{children}</span>
    </div>
  );
}

export function Divider({ children }: { children: React.ReactNode }) {
  return (
    <div className={s.divider} role="separator">
      {children}
    </div>
  );
}
