"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import s from "./shell.module.css";

/**
 * Console chrome: the dark top band, the fixed service navigation, the
 * breadcrumb trail, the page header, and the footer.
 *
 * The markup follows the design's own structure rather than a component library
 * so the measurements hold exactly — a 260px side rail, a 36px search field, and
 * 44px minimum tap targets. Page content is passed through untouched.
 */

export type Crumb = { text: string; href?: string };

/**
 * A header trigger. It receives the click so the parent can anchor an overlay
 * panel to the element that opened it; a caller that needs no event can pass a
 * plain `() => void` and still satisfy this type.
 */
export type ShellTrigger = (event: React.MouseEvent<HTMLElement>) => void;

export type ShellNavItem = {
  text: string;
  href?: string;
  /** Optional count rendered after the label. */
  count?: number | string;
  /** Optional service icon src (32px AWS Architecture Service SVG). */
  icon?: string;
};

/**
 * A side-nav entry is either a link or a labelled group. The design's rail is a
 * flat list with group headers ("Images", "Network & Security") rather than
 * nested levels, so groups are first-class here instead of being faked with
 * indentation.
 */
export type ShellNavGroup = {
  /** Group header, e.g. "Images". Omitted for top-level links. */
  heading?: string;
  items: ShellNavItem[];
};

type Props = {
  theme: "light" | "dark";
  /** Path of the current page, used to mark the active side-nav link. */
  pathname: string;
  /** Breadcrumb trail. Omitted renders no trail. */
  crumbs?: Crumb[];
  /**
   * Heading for the page-header row. Left undefined when the page renders its
   * own heading, which is the common case — the shell then omits the row rather
   * than reserving empty space.
   */
  title?: React.ReactNode;
  titleSuffix?: React.ReactNode;
  /** Right-hand button row in the page header. */
  actions?: React.ReactNode;
  /** Service navigation groups. */
  groups: ShellNavGroup[];
  /** Extra links pinned above the groups. */
  topLinks?: ShellNavItem[];
  /** Whether the sidebar rail should be rendered at all. Home has no rail. */
  showSidebar?: boolean;
  /** Search field value/onChange; omitted renders no search box. */
  search?: {
    value: string;
    onChange: (value: string) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    placeholder?: string;
  };
  region: string;
  /** Opens the region picker. Owned by the parent so the panel keeps its data. */
  onOpenRegion?: ShellTrigger;
  accountLabel: string;
  onOpenAccount?: ShellTrigger;
  onToggleTheme?: () => void;
  onOpenTerminal?: ShellTrigger;
  onOpenServices?: ShellTrigger;
  onOpenNotifications?: ShellTrigger;
  notificationsBadge?: boolean;
  onOpenSupport?: ShellTrigger;
  /**
   * Status messages, rendered as a strip between the band and the body. The
   * caller owns the list because each entry carries its own dismiss handler.
   */
  notifications?: React.ReactNode;
  /** Terminal panel. When set, the body reflows into a column beside it. */
  terminal?: React.ReactNode;
  children: React.ReactNode;
};

export function ConsoleShell({
  theme,
  pathname,
  crumbs,
  title,
  titleSuffix,
  actions,
  groups,
  topLinks = [],
  search,
  region,
  onOpenRegion,
  accountLabel,
  onOpenAccount,
  onToggleTheme,
  onOpenTerminal,
  onOpenServices,
  onOpenNotifications,
  notificationsBadge,
  onOpenSupport,
  showSidebar,
  notifications,
  terminal,
  children,
}: Props) {
  const [navOpen, setNavOpen] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);

  /*
   * The rail collapses below the design's 760px container breakpoint. The
   * container here is the shell itself, which spans the viewport, so a
   * media query tracks it faithfully -- but the CSS still owns the breakpoint,
   * and this only decides whether the rail starts collapsed.
   */
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 760px)");
    const sync = () => setIsNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Leaving the narrow breakpoint must not leave the rail stuck open.
  useEffect(() => {
    if (!isNarrow) setNavOpen(false);
  }, [isNarrow]);

  // Pulled out of `search` so render never reads a member off the prop object;
  // the refs lint rule treats that shape as a ref read.
  const searchValue = search?.value;
  const onSearchChange = search?.onChange;
  const onSearchKeyDown = search?.onKeyDown;
  const searchPlaceholder = search?.placeholder;

  const isActive = (href?: string) =>
    href ? pathname === href || pathname.startsWith(`${href}/`) : false;

  const renderLink = (item: ShellNavItem) => {
    const active = isActive(item.href);
    return (
      <Link
        key={`${item.text}-${item.href ?? ""}`}
        href={item.href ?? "#"}
        className={active ? `${s.sideLink} ${s.sideLinkOn}` : s.sideLink}
        aria-current={active ? "page" : undefined}
        onClick={() => setNavOpen(false)}
      >
        <span className={s.sideDot} />
        {item.icon ? (
          <Image
            src={item.icon}
            alt=""
            aria-hidden="true"
            width={20}
            height={20}
            className={s.sideIcon}
            style={{ display: "block" }}
          />
        ) : null}
        {item.text}
        {item.count !== undefined && item.count !== null ? ` (${item.count})` : ""}
      </Link>
    );
  };

  return (
    <div className={`${s.shell}${theme === "dark" ? ` ${s.dark}` : ""}`} data-shell-theme={theme}>
      <a className={s.skipNav} href="#main-content">
        Skip to main content
      </a>

      <header className={s.nav}>
        <Link href="/" className={s.brand}>
          <span className={s.brandMark}>cloud</span>
          <span>console</span>
        </Link>

        {onOpenServices && (
          <button
            type="button"
            className={s.navbtn}
            onClick={onOpenServices}
            aria-label="Open services"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <path
                d="M2 4h12M2 8h12M2 12h12"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
            <span>Services</span>
          </button>
        )}

        {searchValue !== undefined && onSearchChange && (
          <div className={s.search}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
              focusable="false"
            >
              <circle cx="7" cy="7" r="5" stroke="#b6bec9" strokeWidth="1.6" />
              <path d="M11 11l4 4" stroke="#b6bec9" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={searchValue}
              placeholder={searchPlaceholder ?? "Search"}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={onSearchKeyDown}
              aria-label="Search"
            />
            <kbd>[Alt+S]</kbd>
          </div>
        )}

        <div className={s.navRight}>
          <button
            type="button"
            className={s.navbtn}
            aria-label="Open terminal"
            onClick={onOpenTerminal}
            style={{ minWidth: 44, justifyContent: "center" }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              focusable="false"
            >
              <rect
                x="2.5"
                y="4"
                width="19"
                height="16"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M6.5 9.5l3 2.5-3 2.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {onOpenNotifications && (
            <button
              type="button"
              className={s.navbtn}
              aria-label="Notifications"
              onClick={onOpenNotifications}
              style={{ minWidth: 44, justifyContent: "center", position: "relative" }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  d="M12 3a6 6 0 0 0-6 6v4l-1.5 2.5h15L18 13V9a6 6 0 0 0-6-6Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path
                  d="M10 19a2 2 0 0 0 4 0"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
              {notificationsBadge && <span className={s.navBadge} aria-hidden="true" />}
            </button>
          )}

          {onOpenSupport && (
            <button
              type="button"
              className={s.navbtn}
              aria-label="Support"
              onClick={onOpenSupport}
              style={{ minWidth: 44, justifyContent: "center" }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                focusable="false"
              >
                <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
                <path d="M12 3.5v17" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </button>
          )}

          {onToggleTheme && (
            <button
              type="button"
              className={s.navbtn}
              onClick={onToggleTheme}
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              aria-pressed={theme === "dark"}
              style={{ minWidth: 44, justifyContent: "center" }}
            >
              {theme === "dark" ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  focusable="false"
                >
                  <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
                  <path
                    d="M12 3v2.4M12 18.6V21M3 12h2.4M18.6 12H21M5.6 5.6l1.7 1.7M16.7 16.7l1.7 1.7M18.4 5.6l-1.7 1.7M7.3 16.7l-1.7 1.7"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path
                    d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          )}

          <div className={s.navDivider} aria-hidden="true" />

          {onOpenRegion && (
            <button type="button" className={s.navLabel} onClick={onOpenRegion}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                focusable="false"
              >
                <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
                <path
                  d="M3.5 12h17M12 3.5c2.5 2.6 2.5 14.4 0 17M12 3.5c-2.5 2.6-2.5 14.4 0 17"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
              </svg>
              <span>{region}</span>
              <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" focusable="false">
                <path
                  d="M1 3l4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}

          <div className={s.navDivider} aria-hidden="true" />

          {onOpenAccount && (
            <button type="button" className={s.navLabel} onClick={onOpenAccount}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                focusable="false"
              >
                <circle cx="12" cy="8" r="3.6" stroke="currentColor" strokeWidth="1.8" />
                <path
                  d="M4.5 20a7.5 7.5 0 0 1 15 0"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
              <span>{accountLabel}</span>
              <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" focusable="false">
                <path
                  d="M1 3l4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>
      </header>

      {notifications ? <div className={s.notices}>{notifications}</div> : null}

      <div className={s.layout}>
        {showSidebar && (
          <>
            <button
              type="button"
              className={s.sideToggle}
              aria-expanded={navOpen}
              aria-controls="service-navigation"
              onClick={() => setNavOpen((v) => !v)}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                <path
                  d="M2 4h12M2 8h12M2 12h12"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
              Navigation
            </button>

            <nav
              id="service-navigation"
              className={s.side}
              aria-label="Service navigation"
              style={isNarrow && !navOpen ? { display: "none" } : undefined}
            >
              <div className={s.sidehead}>
                <span className={s.sideheadIcon}>☁</span>
                <span>Console</span>
              </div>
              {topLinks.map(renderLink)}
              {topLinks.length > 0 && <hr />}
              {groups.map((group, index) => (
                <div key={group.heading ?? `group-${index}`}>
                  {group.heading && <h3>{group.heading}</h3>}
                  {group.items.map(renderLink)}
                </div>
              ))}
            </nav>
          </>
        )}

        <div className={s.mainRow}>
          <main id="main-content" className={s.content}>
            {crumbs && crumbs.length > 0 && (
              <nav className={s.crumbs} aria-label="Breadcrumb">
                {crumbs.map((crumb, i) => {
                  const last = i === crumbs.length - 1;
                  return (
                    <span key={`${crumb.text}-${i}`} className={last ? s.crumbsCurrent : undefined}>
                      {last || !crumb.href ? (
                        crumb.text
                      ) : (
                        <>
                          <Link href={crumb.href}>{crumb.text}</Link>
                          <span aria-hidden="true">›</span>
                        </>
                      )}
                    </span>
                  );
                })}
              </nav>
            )}

            {(title || actions) && (
              <div className={s.head}>
                {title ? (
                  <h1>
                    {title}
                    {titleSuffix}
                  </h1>
                ) : (
                  <span />
                )}
                {actions ? <div className={s.btns}>{actions}</div> : null}
              </div>
            )}

            {children}
          </main>
          {terminal ? <aside className={s.terminal}>{terminal}</aside> : null}
        </div>
      </div>

      <footer className={s.foot}>
        <Link href="#cloudshell">CloudShell</Link>
        <Link href="#feedback">Feedback</Link>
        <span>&copy; 2026, [Company], Inc. or its affiliates.</span>
        <span className={s.footRight}>
          <Link href="#privacy">Privacy</Link>
          <Link href="#terms">Terms</Link>
          <Link href="#cookies">Cookie preferences</Link>
        </span>
      </footer>
    </div>
  );
}

export default ConsoleShell;
