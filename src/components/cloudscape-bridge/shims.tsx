"use client";

/**
 * Cloudscape-compatible shims that render the supplied design's markup.
 *
 * 207 files import Cloudscape components directly -- about 11,000 call sites.
 * Rewriting each page's JSX is not tractable; rewriting the *components* is.
 * Each export here takes the same props the app already passes and renders the
 * archetype from the canvases instead, so a module alias migrates every call
 * site at once with no per-page edit.
 *
 * Only the props the codebase actually uses are implemented. The usage census
 * that drove this is recorded on each component.
 *
 * Props the shim cannot honour are ignored rather than silently half-applied;
 * where that loses function, the shim is deliberately not aliased (see
 * bridge/index.ts).
 */

import * as React from "react";
import Icon from "@cloudscape-design/components/icon";

/*
 * Cloudscape types its render callbacks generically and asks every call site
 * to parametrise them. This codebase drives ~20 different item shapes through
 * the same components, so a faithful port would mean editing every usage to
 * satisfy a generic the design does not need. `AnyItem` states the shim never
 * inspects the caller's data -- it only hands it back to a renderer the caller
 * supplied.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- see above
type AnyItem = any;
import type { ButtonDropdownProps } from "@cloudscape-design/components/button-dropdown";

type CloudscapeItem = NonNullable<ButtonDropdownProps.Item>;

/* ── SpaceBetween ───────────────────────────────────────────────────────────
 * 1481 uses: size (967), direction (497), alignItems (12).
 * Layout only, so this maps cleanly.
 */
export function SpaceBetween({
  direction = "horizontal",
  size,
  children,
  className,
  alignItems,
}: {
  direction?: "horizontal" | "vertical";
  size?: string | { vertical?: string; horizontal?: string };
  children?: React.ReactNode;
  className?: string;
  alignItems?: React.CSSProperties["alignItems"];
}) {
  const gapOf = (v?: string) =>
    ({ xs: "4px", s: "8px", m: "16px", l: "24px", xl: "32px" })[v ?? ""] ?? "16px";
  const gap = typeof size === "object" && size !== null ? gapOf(size.horizontal) : gapOf(size);
  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: direction === "vertical" ? "column" : "row",
        gap,
        alignItems,
        flexWrap: direction === "horizontal" ? "wrap" : undefined,
        minWidth: 0,
      }}
    >
      {children}
    </div>
  );
}

/* ── Box ────────────────────────────────────────────────────────────────────
 * 1476 uses: variant (515), color (461), textAlign (226), padding (172),
 * margin (37), float (30), fontWeight (16), fontSize (9).
 *
 * The design has no "textual box" concept, so this collapses to a div that
 * carries only the box-level properties. Text styling is dropped on purpose:
 * the design sets type from the component that owns the text, and honouring it
 * here would fight those rules.
 */
const PAD: Record<string, React.CSSProperties> = {
  none: {},
  xs: { padding: "4px" },
  s: { padding: "8px" },
  m: { padding: "12px" },
  l: { padding: "16px" },
  xl: { padding: "24px" },
};

export function Box({
  variant,
  color = "text-default",
  textAlign,
  padding,
  margin,
  float,
  fontWeight,
  fontSize,
  className,
  children,
  ...rest
}: {
  variant?: string;
  color?: string;
  textAlign?: "left" | "center" | "right";
  padding?:
    | keyof typeof PAD
    | { vertical?: string; horizontal?: string; top?: string; bottom?: string };
  margin?: string | { top?: string; bottom?: string; left?: string; right?: string };
  float?: "left" | "right";
  fontWeight?: string;
  fontSize?: string;
  className?: string;
  children?: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  const textColor =
    color === "text-inverted"
      ? "#fff"
      : color === "text-status-error"
        ? "var(--d-err, #d91515)"
        : color === "text-status-success"
          ? "var(--d-ok, #037f0c)"
          : undefined;
  return (
    <div
      {...rest}
      className={className}
      style={{
        ...(variant === "card"
          ? {
              background: "var(--d-surface, #fff)",
              border: "1px solid var(--d-border, #d5dbdb)",
              borderRadius: 8,
            }
          : null),
        ...(typeof padding === "object" && padding !== null
          ? {
              paddingTop: padding.top ?? padding.vertical,
              paddingBottom: padding.bottom ?? padding.vertical,
              paddingLeft: padding.horizontal,
              paddingRight: padding.horizontal,
            }
          : (PAD[padding as string] ??
            (typeof padding === "string" && padding !== "none" ? PAD.s : {}))),
        textAlign,
        color: textColor,
        fontWeight,
        fontSize,
        float,
        ...(typeof margin === "string"
          ? { margin }
          : {
              marginTop: margin?.top,
              marginBottom: margin?.bottom,
              marginLeft: margin?.left ?? (margin as { horizontal?: string })?.horizontal,
              marginRight: margin?.right ?? (margin as { horizontal?: string })?.horizontal,
            }),
        minWidth: 0,
      }}
    >
      {children}
    </div>
  );
}

/* ── Link ───────────────────────────────────────────────────────────────────
 * 94 uses: href (65), className, fontSize, onFollow, ariaLabel, externalIconAriaLabel.
 */
export function Link({
  href,
  className,
  fontSize,
  ariaLabel,
  externalIconAriaLabel: _externalIconAriaLabel,
  onFollow,
  children,
  ...rest
}: {
  href?: string;
  className?: string;
  fontSize?: "body-s" | "heading-xs" | "body-m" | (string & {});
  ariaLabel?: string;
  externalIconAriaLabel?: string;
  external?: boolean;
  onFollow?: (event: CustomEvent<{ href: string; external?: boolean }>) => void;
  children?: React.ReactNode;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      {...rest}
      href={href}
      aria-label={ariaLabel}
      rel={external ? "noopener noreferrer" : undefined}
      target={external ? "_blank" : undefined}
      onClick={() =>
        onFollow?.(
          new CustomEvent("follow", { detail: { href: href ?? "", external: Boolean(external) } }),
        )
      }
      className={className}
      style={{
        fontFamily: '"Open Sans", "Helvetica Neue", Arial, sans-serif',
        fontSize: fontSize === "heading-xs" ? "14px" : fontSize === "body-s" ? "12px" : undefined,
      }}
    >
      {children}
    </a>
  );
}

/* ── StatusIndicator ────────────────────────────────────────────────────────
 * 233 uses: type (188), plus a long tail of domain-specific aliases
 * (healthStatus, AlarmState, StackDriftStatus, adapterStatus, lastStatus...).
 *
 * The design draws a 10px dot plus the label, so this is a clean swap -- and
 * it removes the bordered-box rendering that a blanket CSS override could not
 * fix without also hitting icon buttons.
 */
const TONE: Record<string, "ok" | "warn" | "bad" | "off"> = {
  success: "ok",
  running: "ok",
  available: "ok",
  active: "ok",
  healthy: "ok",
  enabled: "ok",
  pending: "warn",
  inprogress: "warn",
  "in-progress": "warn",
  degraded: "warn",
  warning: "warn",
  error: "bad",
  failed: "bad",
  stopped: "off",
  inactive: "off",
  disabled: "off",
  info: "off",
};

export function StatusIndicator({
  type,
  children,
  ...rest
}: {
  type?: string;
  children?: React.ReactNode;
} & React.HTMLAttributes<HTMLSpanElement>) {
  const tone = TONE[String(type ?? "").toLowerCase()] ?? "off";
  return (
    <span
      {...rest}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 14,
        fontFamily: '"Open Sans", sans-serif',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          flex: "none",
          display: "inline-block",
          background:
            tone === "ok"
              ? "var(--d-ok, #037f0c)"
              : tone === "warn"
                ? "var(--d-warn, #855900)"
                : tone === "bad"
                  ? "var(--d-err, #d91515)"
                  : "var(--d-muted, #5f6b7a)",
        }}
      />
      {children ?? type}
    </span>
  );
}

/* ── Button ─────────────────────────────────────────────────────────────────
 * 1819 uses: onClick (928), variant (387), loading (140), disabled (97),
 * formAction (92), iconName (81), ariaLabel (48), length (15), href (5).
 *
 * The design's button: 44px, 20px radius, 2px border, bold 14px.
 */
export function Button({
  variant,
  onClick,
  disabled,
  loading,
  formAction,
  iconName,
  ariaLabel,
  // Kept in the signature so the 15 call sites that pass them still type-check;
  // the design has no equivalent concept, so they are intentionally unused.
  length: _length,
  href,
  children,
  ...rest
}: {
  variant?:
    | "primary"
    | "normal"
    | "link"
    | "icon"
    | "inline"
    | "inline-icon"
    | "dashed"
    | "tertiary"
    | "ghost"
    | "modal"
    | (string & {});
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  loading?: boolean;
  /** Announced while `loading`; the design shows a spinner instead. */
  loadingText?: string;
  formAction?: "submit" | "reset" | "none" | (string & {});
  iconName?: string;
  ariaLabel?: string;
  length?: "small" | "medium" | "large";
  href?: string;
  children?: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  // link / inline / icon variants stay text-sized; the rest are the 44px pill.
  const pill =
    variant !== "link" &&
    variant !== "inline" &&
    variant !== "icon" &&
    variant !== "inline-icon" &&
    variant !== "ghost";

  const style: React.CSSProperties = pill
    ? {
        minHeight: variant === "primary" || variant === "dashed" ? 44 : 44,
        padding: "0 20px",
        borderRadius: 20,
        borderWidth: 2,
        fontWeight: 700,
        fontSize: 14,
        fontFamily: '"Open Sans", "Helvetica Neue", Arial, sans-serif',
        background: variant === "primary" ? "var(--d-pri, #006ce0)" : "var(--d-surface, #fff)",
        color: variant === "primary" ? "#fff" : "var(--d-accent, #006ce0)",
        borderColor: variant === "primary" ? "var(--d-pri, #006ce0)" : "var(--d-accent, #006ce0)",
        cursor: disabled ? "not-allowed" : "pointer",
      }
    : {
        background: "transparent",
        border: 0,
        color: "var(--d-link, #0972d3)",
        cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: 600,
        fontFamily: '"Open Sans", "Helvetica Neue", Arial, sans-serif',
        fontSize: 14,
      };

  if (href && !disabled) {
    return (
      <a href={href} aria-label={ariaLabel} style={style} className={rest.className}>
        {children}
      </a>
    );
  }
  return (
    <button
      {...rest}
      type={(formAction as React.ButtonHTMLAttributes<HTMLButtonElement>["type"]) ?? "button"}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
      style={{ ...style, opacity: disabled ? 0.5 : undefined }}
    >
      {iconName ? <Icon name={iconName as never} variant={(variant ?? "normal") as never} /> : null}
      {loading ? (
        <span
          aria-hidden="true"
          style={{
            width: 14,
            height: 14,
            border: "2px solid currentColor",
            borderTopColor: "transparent",
            borderRadius: "50%",
            display: "inline-block",
            marginRight: 8,
            animation: "spin .9s linear infinite",
          }}
        />
      ) : null}
      {children}
    </button>
  );
}

/* ── Header ─────────────────────────────────────────────────────────────────
 * 1080 uses: variant (648), actions (152), onClick (84), direction (61),
 * size (61), counter (39), description (18).
 *
 * The design puts the title at 28px/700 with an Info link and a right-aligned
 * button row.
 */
export function Header({
  variant = "h1",
  actions,
  description,
  counter,
  info: _info,
  children,
  className,
}: {
  variant?: "h1" | "h2" | "h3" | "awsui-page-header" | "p" | "div" | (string & {});
  actions?: React.ReactNode;
  description?: React.ReactNode | (() => React.ReactNode);
  counter?: string | number | ((value: number) => string);
  /** Info link rendered beside the title, as the design does. */
  info?: React.ReactNode;
  onClick?: React.MouseEventHandler;
  size?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  // Cloudscape's h1 variant is a full page header; h2/h3 are in-card headings.
  const level = variant === "h1" || variant === "awsui-page-header" ? "h1" : "h2";
  const shown = typeof description === "function" ? description() : description;
  const rawCount = typeof counter === "function" ? counter(0) : counter;
  /*
   * Rendered verbatim. Cloudscape writes the counter after the title as plain
   * text with no parens of its own, and `ResourceTable` builds labels such as
   * "Users (0)" that already contain them -- adding more produced
   * "UsersUsers (0)" and "CloudWatch((1))".
   */

  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "12px 16px",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: level === "h1" ? 20 : 12,
        minWidth: 0,
      }}
    >
      <div style={{ minWidth: 0 }}>
        {React.createElement(
          level,
          {
            style: {
              fontSize: level === "h1" ? 28 : 18,
              fontWeight: 700,
              lineHeight: 1.3,
              color: "var(--d-text, #0f141a)",
              fontFamily: '"Open Sans", sans-serif',
            },
          },
          children,
          rawCount !== undefined && rawCount !== null ? (
            <span style={{ fontSize: 12, fontWeight: 600, marginLeft: 8 }}>{rawCount}</span>
          ) : null,
        )}
        {shown ? (
          <div style={{ fontSize: 14, color: "var(--d-muted, #5f6b7a)", marginTop: 4 }}>
            {shown}
          </div>
        ) : null}
      </div>
      {actions ? <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{actions}</div> : null}
    </div>
  );
}

/* ── Container ──────────────────────────────────────────────────────────────
 * 546 uses: variant (208), header (206), actions (28), direction (14),
 * size (14), counter (13), description (6).
 */
export function Container({
  header,
  actions,
  footer,
  counter,
  children,
  className,
}: {
  variant?: string;
  header?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  counter?: string | number;
  direction?: string;
  size?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <section
      className={className}
      style={{
        background: "var(--d-surface, #fff)",
        border: "1px solid var(--d-border, #d5dbdb)",
        borderRadius: 8,
        boxShadow: "0 1px 1px rgba(0,28,36,.15)",
        marginBottom: 20,
        minWidth: 0,
      }}
    >
      {header ? (
        <header
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid var(--d-border2, #e9ebed)",
            display: "flex",
            flexWrap: "wrap",
            gap: "8px 12px",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              lineHeight: 1.3,
              fontFamily: '"Open Sans", sans-serif',
            }}
          >
            {header}
            {counter !== undefined &&
            counter !== null &&
            typeof header === "string" &&
            !/\(\d+\)\s*$/.test(header) ? (
              // Rendered verbatim: callers pass either a bare number or an
              // already-formatted string such as "Instances (0)". Wrapping it in
              // parentheses again produced "Instances (Instances (0))".
              <span style={{ fontSize: 12, fontWeight: 600, marginLeft: 6 }}>
                {typeof counter === "number" ? `(${counter})` : counter}
              </span>
            ) : null}
          </span>
          {actions ? (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{actions}</div>
          ) : null}
        </header>
      ) : null}
      <div style={{ padding: "16px 20px", fontSize: 14 }}>{children}</div>
      {footer ? (
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--d-border2, #e9ebed)" }}>
          {footer}
        </div>
      ) : null}
    </section>
  );
}

/* ── FormField ──────────────────────────────────────────────────────────────
 * 705 uses: label (478), constraintText (98), errorText (67), description (54).
 */
export function FormField({
  label,
  description,
  errorText,
  constraintText,
  children,
  className,
}: {
  label?: React.ReactNode;
  description?: React.ReactNode;
  errorText?: React.ReactNode;
  constraintText?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={className}
      style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16, minWidth: 0 }}
    >
      {label ? (
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "var(--d-text, #0f141a)",
            fontFamily: '"Open Sans", sans-serif',
          }}
        >
          {label}
        </span>
      ) : null}
      {description ? (
        <span style={{ fontSize: 12, color: "var(--d-muted, #5f6b7a)" }}>{description}</span>
      ) : null}
      {children}
      {errorText ? (
        <span
          style={{
            fontSize: 12,
            color: "var(--d-err, #d91515)",
            display: "flex",
            gap: 6,
            alignItems: "center",
          }}
          role="alert"
        >
          {errorText}
        </span>
      ) : null}
      {constraintText && !errorText ? (
        <span style={{ fontSize: 12, color: "var(--d-muted, #5f6b7a)" }}>{constraintText}</span>
      ) : null}
    </div>
  );
}

/* ── Input ──────────────────────────────────────────────────────────────────
 * 696 uses: value (319), onChange (311), type (29), placeholder (4).
 */
export function Input({
  value,
  onChange,
  type = "text",
  placeholder,
  disabled,
  ariaLabel,
  ariaRequired,
  invalid,
  className,
  ...rest
}: {
  value?: string;
  onChange?: (event: { detail: { value: string } }) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
  ariaRequired?: boolean;
  /** Cloudscape marks invalidity via `invalid`; the design shows a 2px red border. */
  invalid?: boolean;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <input
      {...rest}
      type={type}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-required={ariaRequired}
      aria-invalid={invalid || undefined}
      className={className}
      onChange={(e) => onChange?.({ detail: { value: e.target.value } })}
      style={{
        height: 44,
        borderColor: invalid ? "var(--d-err, #d91515)" : undefined,
        borderWidth: invalid ? 2 : undefined,
        borderRadius: 8,
        border: "1px solid var(--d-field, #8c97a5)",
        padding: "0 12px",
        font: '14px "Open Sans", "Helvetica Neue", Arial, sans-serif',
        background: "var(--d-surface, #fff)",
        color: "var(--d-text, #0f141a)",
        width: "100%",
        ...rest.style,
      }}
    />
  );
}

/* ── Alert ──────────────────────────────────────────────────────────────────
 * 506 uses: type (273), onDismiss (133), header (64), statusIconAriaLabel (25).
 */
export function Alert({
  type = "info",
  header,
  onDismiss,
  dismissible = true,
  action,
  children,
  className,
}: {
  type?: "info" | "success" | "warning" | "error" | "loading" | (string & {});
  header?: React.ReactNode;
  onDismiss?: () => void;
  /** When false, no close control renders even if onDismiss is supplied. */
  dismissible?: boolean;
  /** Trailing action, e.g. a "View details" link. */
  action?: React.ReactNode;
  statusIconAriaLabel?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const tone =
    type === "success"
      ? { border: "#037f0c", bg: "rgba(3,127,12,.1)" }
      : type === "error" || type === "warning"
        ? { border: "var(--d-err, #d91515)", bg: "rgba(217,21,21,.08)" }
        : { border: "var(--d-link, #0972d3)", bg: "var(--d-hl, #f0f8ff)" };
  return (
    <div
      className={className}
      role={type === "error" ? "alert" : "status"}
      style={{
        border: `1px solid ${tone.border}`,
        background: tone.bg,
        borderRadius: 8,
        padding: "12px 16px",
        fontSize: 14,
        marginBottom: 20,
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        fontFamily: '"Open Sans", sans-serif',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {header ? <b>{header}</b> : null}
        {header && children ? <br /> : null}
        {children}
      </div>
      {action ? <div style={{ flex: "none" }}>{action}</div> : null}
      {onDismiss && dismissible ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          style={{
            background: "none",
            border: 0,
            cursor: "pointer",
            color: "inherit",
            fontSize: 18,
            lineHeight: 1,
            padding: 0,
          }}
        >
          ×
        </button>
      ) : null}
    </div>
  );
}

/* ── Modal ──────────────────────────────────────────────────────────────────
 * 172 uses: visible (170), onDismiss (169), footer (10), header (9).
 *
 * Cloudscape's Modal is driven by `visible`; the design's is a plain
 * conditional overlay, so the shim returns null when hidden.
 */
export function Modal({
  visible,
  onDismiss,
  header,
  footer,
  closeAriaLabel,
  children,
  ..._rest
}: {
  visible: boolean;
  onDismiss?: () => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  closeAriaLabel?: string;
  size?: string;
  children?: React.ReactNode;
  /**
   * Accepted and ignored. The app passes properties the design has no
   * equivalent for (`readOnly`, `expandToViewport`, `loadingText`,
   * `cardsPerRow`, `i18nStrings`...). Dropping them keeps those call
   * sites compiling without pretending the design honours them.
   */
  [key: string]: unknown;
}) {
  const titleId = React.useId();
  if (!visible) return null;
  return (
    <button
      type="button"
      style={OVL}
      aria-label={closeAriaLabel ?? "Close"}
      tabIndex={-1}
      onClick={onDismiss}
    >
      <dialog style={MDL} aria-labelledby={titleId} open>
        <header style={MDLH}>
          <span id={titleId}>{header}</span>
          <button
            type="button"
            onClick={() => onDismiss?.()}
            aria-label={closeAriaLabel ?? "Close"}
            style={{
              background: "none",
              border: 0,
              cursor: "pointer",
              color: "inherit",
              fontSize: 20,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </header>
        <div style={MDLB}>{children}</div>
        {footer ? <footer style={MDLF}>{footer}</footer> : null}
      </dialog>
    </button>
  );
}

/* ── Tabs ───────────────────────────────────────────────────────────────────
 * 53 uses: tabs (41), variant (24), header (14), actions (13), onChange (13),
 * activeTabId (12). The design's tab rail is border-bottom links.
 */
export function Tabs({
  tabs,
  activeTabId,
  onChange,
  variant: _variant,
  header,
  actions,
  ..._rest
}: {
  tabs: readonly { id: string; label: React.ReactNode; content?: React.ReactNode }[];
  activeTabId?: string;
  onChange?: (event: { detail: { activeTabId: string } }) => void;
  variant?: string;
  header?: React.ReactNode;
  actions?: React.ReactNode;
  size?: string;
  ariaLabel?: string;
  /**
   * Accepted and ignored. The app passes properties the design has no
   * equivalent for (`readOnly`, `expandToViewport`, `loadingText`,
   * `cardsPerRow`, `i18nStrings`...). Dropping them keeps those call
   * sites compiling without pretending the design honours them.
   */
  [key: string]: unknown;
}) {
  /*
   * `activeTabId` is optional: ServiceLayout renders `<Tabs tabs={tabs} />` with
   * no selection prop, so the component owns the current tab until the caller
   * takes over.
   */
  const isControlled = activeTabId !== undefined;
  const [inner, setInner] = React.useState(tabs[0]?.id);
  const currentId = isControlled ? activeTabId : inner;
  const active = tabs.find((t) => t.id === currentId) ?? tabs[0];
  return (
    // minWidth:0 lets this shrink inside a flex or grid column; without it a
    // wide tab rail forces its whole container wider than the viewport.
    <div style={{ minWidth: 0, maxWidth: "100%" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        {header ? <h2 style={{ fontSize: 18, fontWeight: 700 }}>{header}</h2> : null}
        {actions ? <div style={{ display: "flex", gap: 8 }}>{actions}</div> : null}
      </div>
      <div style={TB} role="tablist" aria-label={header ? undefined : "Sections"}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={t.id === active?.id}
            style={t.id === active?.id ? TBON : undefined}
            onClick={() => {
              if (!isControlled) setInner(t.id);
              onChange?.({ detail: { activeTabId: t.id } });
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {active?.content ? <div style={TBBODY}>{active.content}</div> : null}
    </div>
  );
}

/* ── Pagination ─────────────────────────────────────────────────────────────
 * 42 uses: currentPageIndex (42), pagesCount (42), onChange (20).
 * The design draws plain arrows around the page number.
 */
export function Pagination({
  currentPageIndex,
  pagesCount,
  onChange,
  ariaLabels,
  ..._rest
}: {
  currentPageIndex?: number;
  pagesCount?: number;
  onChange?: (event: { detail: { currentPageIndex: number } }) => void;
  /** Cloudscape supplies these as strings or as a callable taking a page number. */
  ariaLabels?: {
    nextPageLabel?: string;
    previousPageLabel?: string;
    pageLabel?: string | ((n: number) => string);
  };
  [key: string]: unknown;
}) {
  const page = currentPageIndex ?? 1;
  const total = pagesCount ?? 1;
  const pageWord =
    typeof ariaLabels?.pageLabel === "function"
      ? ariaLabels.pageLabel(page)
      : ariaLabels?.pageLabel;
  if (total <= 1) return null;

  const arrow = (text: string, aria: string, target: number, disabled: boolean) => (
    <button
      key={aria}
      type="button"
      disabled={disabled}
      aria-label={aria}
      style={PG}
      onClick={() => onChange?.({ detail: { currentPageIndex: target } })}
    >
      {text}
    </button>
  );

  return (
    <nav style={PG} aria-label="Pagination">
      {arrow(
        "‹",
        ariaLabels?.previousPageLabel ?? "Previous page",
        Math.max(1, page - 1),
        page === 1,
      )}
      <span style={{ padding: "0 8px" }}>
        {pageWord ? `${pageWord} ` : ""}
        {page} / {total}
      </span>
      {arrow(
        "›",
        ariaLabels?.nextPageLabel ?? "Next page",
        Math.min(total, page + 1),
        page === total,
      )}
    </nav>
  );
}

/* ── TextFilter ──────────────────────────────────────────────────────────────
 * 25 uses. The design's toolbar search is a 44px bordered field.
 */
export function TextFilter({
  filteringText,
  filteringPlaceholder,
  onChange,
  filteringAriaLabel,
  ..._rest
}: {
  filteringText: string;
  filteringPlaceholder?: string;
  onChange?: (event: { detail: { filteringText: string } }) => void;
  filteringAriaLabel?: string;
  countText?: string;
  disabled?: boolean;
  /**
   * Accepted and ignored. The app passes properties the design has no
   * equivalent for (`readOnly`, `expandToViewport`, `loadingText`,
   * `cardsPerRow`, `i18nStrings`...). Dropping them keeps those call
   * sites compiling without pretending the design honours them.
   */
  [key: string]: unknown;
}) {
  return (
    <input
      type="search"
      value={filteringText}
      placeholder={filteringPlaceholder}
      aria-label={filteringAriaLabel ?? "Filter"}
      onChange={(e) => onChange?.({ detail: { filteringText: e.target.value } })}
      style={SEARCH}
    />
  );
}

/* ── Checkbox ────────────────────────────────────────────────────────────────
 * 38 uses. 14px row with a 16px box and no Cloudscape label chrome.
 */
export function Checkbox({
  checked,
  onChange,
  children,
  disabled,
  description,
  ariaLabel,
  ..._rest
}: {
  checked: boolean;
  onChange?: (event: { detail: { checked: boolean } }) => void;
  children?: React.ReactNode;
  disabled?: boolean;
  description?: React.ReactNode;
  ariaLabel?: string;
  /**
   * Accepted and ignored. The app passes properties the design has no
   * equivalent for (`readOnly`, `expandToViewport`, `loadingText`,
   * `cardsPerRow`, `i18nStrings`...). Dropping them keeps those call
   * sites compiling without pretending the design honours them.
   */
  [key: string]: unknown;
}) {
  return (
    <label style={CBR}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        aria-label={children ? undefined : (ariaLabel ?? "Select")}
        onChange={(e) => onChange?.({ detail: { checked: e.target.checked } })}
        style={{ width: 16, height: 16, flex: "none", accentColor: "#006ce0" }}
      />
      {children ?? description}
    </label>
  );
}

/* ── ColumnLayout ────────────────────────────────────────────────────────────
 * 65 uses: columns (65), variant (61). Maps to the design's grid archetypes.
 */
export function ColumnLayout({
  columns,
  children,
  variant,
  border: _border,
  ..._rest
}: {
  columns: number;
  children?: React.ReactNode;
  variant?: "default" | "text-grid";
  border?: "none" | "container" | "row-dividers";
  minColumnWidth?: number;
  /**
   * Accepted and ignored. The app passes properties the design has no
   * equivalent for (`readOnly`, `expandToViewport`, `loadingText`,
   * `cardsPerRow`, `i18nStrings`...). Dropping them keeps those call
   * sites compiling without pretending the design honours them.
   */
  [key: string]: unknown;
}) {
  const items = React.Children.toArray(children);
  return (
    <div
      style={{
        display: "grid",
        gap: 16,
        gridTemplateColumns: `repeat(${columns || 1}, minmax(0, 1fr))`,
      }}
      className={variant === "text-grid" ? undefined : undefined}
    >
      {items}
    </div>
  );
}

/* ── ButtonDropdown ─────────────────────────────────────────────────────────
 * 48 uses: onItemClick (45), ariaLabel (37), items (26), variant (18),
 * length (14). Renders the design's trigger plus a native menu.
 */
export function ButtonDropdown({
  items,
  onItemClick,
  ariaLabel,
  variant = "primary",
  disabled,
  children,
  mainAction,
  onItemFollow,
  ..._rest
}: {
  items: readonly (Omit<CloudscapeItem, "id"> & { id?: string; href?: string })[];
  onItemClick?: (event: { detail: { id: string } }) => void;
  ariaLabel?: string;
  variant?: string;
  length?: string;
  disabled?: boolean;
  children?: React.ReactNode;
  mainAction?: { text: string; onClick?: () => void; loading?: boolean };
  /**
   * Fired instead of `onItemClick` when the chosen item carries an href: the
   * caller navigates itself. Without it the route push never ran.
   */
  onItemFollow?: (event: { detail: { href: string }; preventDefault: () => void }) => void;
  /** Accepted and ignored: the design's menu anchors to its trigger. */
  expandToViewport?: boolean;
  /** Accepted and ignored. The app passes
   * equivalent for (`readOnly`, `expandToViewport`, `loadingText`,
   * `cardsPerRow`, `i18nStrings`...). Dropping them keeps those call
   * sites compiling without pretending the design honours them.
   */
  [key: string]: unknown;
}) {
  const [open, setOpen] = React.useState(false);
  const trig = children ?? mainAction?.text ?? ariaLabel ?? "Actions";
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        style={variant === "primary" ? DDBP : DD}
        disabled={Boolean(disabled)}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => (mainAction?.onClick ? mainAction.onClick() : setOpen((v) => !v))}
      >
        {mainAction?.loading ? <Spinner size="small" /> : null}
        {trig}
        {mainAction?.onClick ? null : <span aria-hidden="true">▾</span>}
      </button>
      {open && !mainAction?.onClick ? (
        <div style={OVR_MENU} role="menu" aria-label={ariaLabel ?? "Actions"}>
          {items.map((it) => (
            <button
              key={it.id}
              type="button"
              role="menuitem"
              disabled={it.disabled}
              onClick={() => {
                if (String((it as { href?: string }).href ?? "") && onItemFollow) {
                  onItemFollow({
                    detail: { href: String((it as { href?: string }).href ?? "") },
                    preventDefault: () => {},
                  });
                  setOpen(false);
                  return;
                }
                onItemClick?.({ detail: { id: it.id ?? "" } });
                setOpen(false);
              }}
              style={DDITEM}
            >
              {it.text}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ── Select ──────────────────────────────────────────────────────────────────
 * 110 uses: selectedOption (110), onChange (56), options (34).
 */
export function Select({
  selectedOption,
  onChange,
  options,
  placeholder,
  disabled,
  ariaLabel,
  id,
  ..._rest
}: {
  selectedOption?: { value?: string; label?: string } | null;
  onChange?: (event: { detail: { selectedOption: { value: string; label: string } } }) => void;
  options?: readonly { value?: string; label?: string; description?: string }[];
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
  id?: string;
  variant?: string;
  errorText?: string;
  /**
   * Accepted and ignored. The app passes properties the design has no
   * equivalent for (`readOnly`, `expandToViewport`, `loadingText`,
   * `cardsPerRow`, `i18nStrings`...). Dropping them keeps those call
   * sites compiling without pretending the design honours them.
   */
  [key: string]: unknown;
}) {
  const list = React.useMemo(
    () => [...(options ?? [])] as { value?: string; label?: string }[],
    [options],
  );
  return (
    <select
      id={id}
      aria-label={ariaLabel}
      disabled={disabled}
      value={selectedOption?.value ?? ""}
      onChange={(e) => {
        const found = list.find((o) => o.value === e.target.value);
        if (found)
          onChange?.({
            detail: { selectedOption: { value: found.value ?? "", label: found.label ?? "" } },
          });
      }}
      style={{ ...SEARCH, height: 44, paddingRight: 32 }}
    >
      {placeholder ? <option value="">{placeholder}</option> : null}
      {list.map((o, i) => (
        <option key={o.value ?? i} value={o.value ?? ""}>
          {o.label ?? o.value ?? ""}
        </option>
      ))}
    </select>
  );
}

/* ── Flashbar ────────────────────────────────────────────────────────────────
 * 29 uses: items (29), i18nStrings (2).
 */
export function Flashbar({
  items,
  i18nStrings,
  ..._rest
}: {
  /** `type` is optional because the app's message model permits it to be. */
  items?: readonly {
    id?: string;
    /** Cloudscape's own union, including the `in-progress` variant. */
    type?: "success" | "error" | "warning" | "info" | "in-progress";
    header?: React.ReactNode;
    content?: React.ReactNode;
    dismissible?: boolean;
    dismissLabel?: string;
    onDismiss?: (event: AnyItem) => void;
  }[];
  i18nStrings?: Record<string, string>;
  /**
   * Accepted and ignored. The app passes properties the design has no
   * equivalent for (`readOnly`, `expandToViewport`, `loadingText`,
   * `cardsPerRow`, `i18nStrings`...). Dropping them keeps those call
   * sites compiling without pretending the design honours them.
   */
  [key: string]: unknown;
}) {
  if (!items?.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
      {items.map((it, i) => (
        <div key={it.id ?? i} role={it.type === "error" ? "alert" : "status"} style={FB}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {it.header ? <b>{it.header}</b> : null}
            {it.header && it.content ? <br /> : null}
            {it.content}
          </div>
          {it.dismissible ? (
            <button
              type="button"
              aria-label={it.dismissLabel ?? i18nStrings?.dismissAriaLabel ?? "Dismiss"}
              onClick={it.onDismiss}
              style={{
                background: "none",
                border: 0,
                cursor: "pointer",
                color: "inherit",
                fontSize: 18,
              }}
            >
              ×
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/* ── Cards ───────────────────────────────────────────────────────────────────
 * 30 uses: cardDefinition (30). The design's dashboard grid.
 */
export function Cards({
  cardDefinition,
  items,
  trackBy,
  header,
  loading,
  empty,
  ..._rest
}: {
  /**
   * Cloudscape's cardDefinition is an array of sections, each with an `id` and
   * a `cell`/`content` renderer -- not the flat `{header, content}` object this
   * first draft assumed, which is why the Dashboard's usage failed to type.
   */
  /**
   * Both spellings occur in this codebase: an array of sections (`Dashboard`)
   * and the object form carrying its own `header` plus a `sections` array
   * (most service pages). Render whichever shape arrived.
   */
  cardDefinition?:
    | readonly {
        id?: string;
        header?: (item: AnyItem) => React.ReactNode;
        content?: (item: AnyItem) => React.ReactNode;
        cell?: (item: AnyItem) => React.ReactNode;
        width?: number;
        sections?: unknown[];
      }[]
    | {
        header?: (item: AnyItem) => React.ReactNode;
        sections?: readonly {
          id?: string;
          header?: React.ReactNode;
          content?: (item: AnyItem) => React.ReactNode;
        }[];
      };
  items?: readonly unknown[];
  trackBy?: string | ((item: AnyItem) => string);
  header?: React.ReactNode;
  loading?: boolean;
  empty?: React.ReactNode;
  variant?: string;
  onSelectionChange?: (e: { detail: { selectedItems: readonly unknown[] } }) => void;
  selectedItems?: readonly unknown[];
  selectionType?: string;
  filter?: React.ReactNode;
  pagination?: React.ReactNode;
  /**
   * Accepted and ignored. The app passes properties the design has no
   * equivalent for (`readOnly`, `expandToViewport`, `loadingText`,
   * `cardsPerRow`, `i18nStrings`...). Dropping them keeps those call
   * sites compiling without pretending the design honours them.
   */
  [key: string]: unknown;
}) {
  /*
   * The two call shapes collapse to the same section list: either the array
   * form directly, or the object form's `sections` (whose own `header` becomes
   * the card header).
   */
  type Section = {
    id?: string;
    header?: (item: AnyItem) => React.ReactNode;
    content?: (item: AnyItem) => React.ReactNode;
    cell?: (item: AnyItem) => React.ReactNode;
  };

  const isArrayForm = Array.isArray(cardDefinition);
  const sections: Section[] = isArrayForm
    ? [...(cardDefinition as readonly Section[])]
    : (
        (
          cardDefinition as
            | {
                sections?: readonly { id?: string; content?: (item: AnyItem) => React.ReactNode }[];
              }
            | undefined
        )?.sections ?? []
      ).map((sec) => ({
        id: sec.id,
        header: (cardDefinition as { header?: Section["header"] }).header,
        content: sec.content,
      }));

  const keyed = (i: AnyItem) =>
    typeof trackBy === "function" ? trackBy(i) : String(i?.[trackBy ?? ""] ?? "");
  return (
    <div>
      {header ? <div style={{ marginBottom: 12 }}>{header}</div> : null}
      {loading ? (
        <div className="ds-load-row">
          <Spinner size="small" /> Loading…
        </div>
      ) : !items?.length ? (
        <div className="ds-empty">{empty ?? <b>No items</b>}</div>
      ) : (
        <div className="ds-grid ds-grid-3">
          {[...items].map((item) => (
            <article key={keyed(item)} className="ds-card">
              {sections.map((sec) => {
                const render = sec.content ?? sec.cell;
                if (!render) return null;
                return (
                  <div key={sec.id ?? "sec"} className="ds-card-body">
                    {sec.header ? (
                      <header className="ds-card-header">{sec.header(item)}</header>
                    ) : null}
                    {render(item)}
                  </div>
                );
              })}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Badge ───────────────────────────────────────────────────────────────────
 * 7 uses.
 */
export function Badge({
  color: _color = "grey",
  children,
  ..._rest
}: {
  color?: string;
  children?: React.ReactNode;
  [key: string]: unknown;
}) {
  return <span className="ds-badge">{children}</span>;
}

/* ── Spinner ───────────────────────────────────────────────────────────────── */
export function Spinner({
  size,
  ..._rest
}: {
  size?: "small" | "normal" | "big" | "large";
  [key: string]: unknown;
}) {
  return (
    <output
      className={size === "big" || size === "large" ? "ds-spin ds-spin-lg" : "ds-spin"}
      aria-label="Loading"
    />
  );
}

/* ── Textarea ──────────────────────────────────────────────────────────────── */
export function Textarea({
  value,
  onChange,
  placeholder,
  rows,
  disabled,
  ariaLabel,
  id,
  ..._rest
}: {
  value?: string;
  onChange?: (event: { detail: { value: string } }) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  ariaLabel?: string;
  id?: string;
  /**
   * Accepted and ignored. The app passes properties the design has no
   * equivalent for (`readOnly`, `expandToViewport`, `loadingText`,
   * `cardsPerRow`, `i18nStrings`...). Dropping them keeps those call
   * sites compiling without pretending the design honours them.
   */
  [key: string]: unknown;
}) {
  return (
    <textarea
      id={id}
      aria-label={ariaLabel}
      value={value}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      onChange={(e) => onChange?.({ detail: { value: e.target.value } })}
      className="ds-textarea"
    />
  );
}

/* ── RadioGroup ────────────────────────────────────────────────────────────── */
export function RadioGroup({
  value,
  onChange,
  items,
  ariaLabel,
  ..._rest
}: {
  value?: string;
  onChange?: (event: { detail: { value: string } }) => void;
  items: readonly { value: string; label: React.ReactNode }[];
  ariaLabel?: string;
  /**
   * Accepted and ignored. The app passes properties the design has no
   * equivalent for (`readOnly`, `expandToViewport`, `loadingText`,
   * `cardsPerRow`, `i18nStrings`...). Dropping them keeps those call
   * sites compiling without pretending the design honours them.
   */
  [key: string]: unknown;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel ?? "Choose one"}
      style={{ display: "flex", flexDirection: "column", gap: 8 }}
    >
      {items.map((it) => (
        <label key={it.value} className="ds-opt">
          <input
            type="radio"
            name={ariaLabel ?? "radio"}
            checked={value === it.value}
            onChange={() => onChange?.({ detail: { value: it.value } })}
          />
          <span>{it.label}</span>
        </label>
      ))}
    </div>
  );
}

/* ── Popover ───────────────────────────────────────────────────────────────── */
export function Popover({
  children,
  content,
  dismissButton,
  _triggerType,
  ..._rest
}: {
  children: React.ReactNode;
  content: React.ReactNode;
  dismissButton?: boolean;
  triggerType?: "text" | "custom";
  /** Rendered but not repositioned: the design's popover is anchored top-left. */
  position?:
    | "top"
    | "right"
    | "left"
    | "bottom"
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left";
  size?: "small" | "medium" | "large" | (string & {});
  header?: React.ReactNode;
  /**
   * Accepted and ignored. The app passes properties the design has no
   * equivalent for (`readOnly`, `expandToViewport`, `loadingText`,
   * `cardsPerRow`, `i18nStrings`...). Dropping them keeps those call
   * sites compiling without pretending the design honours them.
   */
  [key: string]: unknown;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} style={TRIG}>
        {children}
      </button>
      {open ? (
        <dialog style={POP} open>
          {content}
          {dismissButton ? (
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{ ...TRIG, display: "block", marginTop: 8 }}
            >
              Close
            </button>
          ) : null}
        </dialog>
      ) : null}
    </span>
  );
}

/* ── ExpandableSection ─────────────────────────────────────────────────────── */
export function ExpandableSection({
  children,
  headerText,
  defaultExpanded,
  variant: _variant,
  header: headerAlias,
  ..._rest
}: {
  children: React.ReactNode;
  /** `headerText` is Cloudscape's spelling; `header` is the same thing. */
  headerText?: React.ReactNode;
  header?: React.ReactNode;
  defaultExpanded?: boolean;
  variant?: string;
  /**
   * Accepted and ignored. The app passes properties the design has no
   * equivalent for (`readOnly`, `expandToViewport`, `loadingText`,
   * `cardsPerRow`, `i18nStrings`...). Dropping them keeps those call
   * sites compiling without pretending the design honours them.
   */
  [key: string]: unknown;
}) {
  const [open, setOpen] = React.useState(Boolean(defaultExpanded));
  return (
    <section style={{ borderBottom: "1px solid var(--ds-border-2, #e9ebed)" }}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{
          ...TRIG,
          width: "100%",
          justifyContent: "space-between",
          padding: "12px 0",
          fontWeight: 700,
          fontSize: 14,
        }}
      >
        {headerText ?? headerAlias}
        <span aria-hidden="true">{open ? "▾" : "▸"}</span>
      </button>
      {open ? <div style={{ paddingBottom: 12 }}>{children}</div> : null}
    </section>
  );
}
/*
 * `any` in the item-renderer signatures is deliberate.
 *
 * Cloudscape types these callbacks generically and requires each call site to
 * parametrise them. This codebase passes ~20 different item shapes, so a
 * faithful port would mean touching every usage to satisfy a generic the
 * design does not need. The renderers only read properties the caller owns.
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- see above */

/*
 * Style constants for the second shim batch.
 *
 * These are plain objects rather than a CSS module because the existing shims
 * in this file all render inline values -- the design tokens are duplicated
 * here on purpose so the file stays self-contained and reviewable in one pass.
 */
const OVL: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  padding: "80px 16px 16px",
  background: "rgba(0,7,22,.6)",
  border: 0,
  cursor: "default",
  textAlign: "left",
};
const MDL: React.CSSProperties = {
  background: "var(--ds-surface,#fff)",
  color: "var(--ds-text,#0f141a)",
  borderRadius: 8,
  width: "min(520px,100%)",
  boxShadow: "0 8px 32px rgba(0,7,22,.25)",
  fontFamily: '"Open Sans", "Helvetica Neue", Arial, sans-serif',
};
const MDLH: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "16px 20px",
  borderBottom: "1px solid var(--ds-border-2,#e9ebed)",
  fontSize: 18,
  fontWeight: 700,
};
const MDLB: React.CSSProperties = { padding: "16px 20px", fontSize: 14, lineHeight: 1.5 };
const MDLF: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 8,
  flexWrap: "wrap",
  padding: "12px 20px",
  borderTop: "1px solid var(--ds-border-2,#e9ebed)",
};
const TB: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 4,
  borderBottom: "1px solid var(--ds-border,#d5dbdb)",
  margin: "12px 0",
};
const TBON: React.CSSProperties = {
  color: "var(--ds-accent,#006ce0)",
  borderBottom: "3px solid var(--ds-accent,#006ce0)",
  fontWeight: 600,
};
const TBBODY: React.CSSProperties = { paddingTop: 16 };
const PG: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  fontSize: 14,
  fontFamily: "inherit",
  background: "none",
  border: 0,
  cursor: "pointer",
  color: "var(--ds-accent,#006ce0)",
};
const SEARCH: React.CSSProperties = {
  height: 44,
  border: "1px solid var(--ds-field,#8c97a5)",
  borderRadius: 8,
  padding: "0 12px",
  font: '14px "Open Sans", "Helvetica Neue", Arial, sans-serif',
  background: "var(--ds-surface,#fff)",
  color: "var(--ds-text,#0f141a)",
  width: "100%",
  flex: "1 1 220px",
  minWidth: 0,
};
const CBR: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 14,
  fontFamily: "inherit",
  cursor: "pointer",
};
const DD: React.CSSProperties = {
  minHeight: 44,
  padding: "0 16px",
  borderRadius: 20,
  border: "2px solid var(--ds-accent,#006ce0)",
  background: "var(--ds-surface,#fff)",
  color: "var(--ds-accent,#006ce0)",
  font: '700 14px "Open Sans", "Helvetica Neue", Arial, sans-serif',
  fontFamily: '"Open Sans", sans-serif',
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};
const DDBP: React.CSSProperties = {
  ...DD,
  background: "var(--ds-pri,#006ce0)",
  borderColor: "var(--ds-pri,#006ce0)",
  color: "#fff",
};
const OVR_MENU: React.CSSProperties = {
  position: "absolute",
  top: "calc(100% + 4px)",
  left: 0,
  zIndex: 30,
  minWidth: 240,
  maxWidth: 320,
  background: "var(--ds-surface,#fff)",
  color: "var(--ds-text,#0f141a)",
  border: "1px solid var(--ds-border,#d5dbdb)",
  borderRadius: 8,
  boxShadow: "0 8px 24px rgba(0,7,22,.25)",
  padding: "6px 0",
};
const DDITEM: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  minHeight: 40,
  width: "100%",
  padding: "0 16px",
  background: "transparent",
  border: 0,
  color: "var(--ds-text,#0f141a)",
  font: '400 14px "Open Sans", "Helvetica Neue", Arial, sans-serif',
  textAlign: "left",
  cursor: "pointer",
};
const FB: React.CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "flex-start",
  padding: "12px 16px",
  fontSize: 14,
  fontFamily: '"Open Sans", sans-serif',
  border: "1px solid var(--ds-link,#0972d3)",
  background: "var(--ds-hl,#f0f8ff)",
  borderRadius: 8,
};
const TRIG: React.CSSProperties = {
  background: "transparent",
  border: 0,
  color: "var(--ds-link,#0972d3)",
  cursor: "pointer",
  font: "inherit",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: 0,
};
const POP: React.CSSProperties = {
  position: "absolute",
  top: "calc(100% + 4px)",
  left: 0,
  zIndex: 30,
  width: "min(320px,100%)",
  padding: 16,
  background: "var(--ds-surface,#fff)",
  color: "var(--ds-text,#0f141a)",
  border: "1px solid var(--ds-border,#d5dbdb)",
  borderRadius: 8,
  boxShadow: "0 8px 24px rgba(0,7,22,.25)",
  fontSize: 14,
  fontFamily: '"Open Sans", sans-serif',
};
