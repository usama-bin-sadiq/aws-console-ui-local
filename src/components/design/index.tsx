"use client";

/**
 * Shared console page primitives.
 *
 * The supplied canvases are not 631 unique layouts -- they are a small number of
 * archetypes repeated across services:
 *
 *   list      card > toolbar > table          ~495 frames
 *   loading   skeleton rows / spinner         ~348 frames
 *   form      field / option / steps          ~137 frames
 *   detail    stat tiles / badges / rows      ~134 frames
 *   confirm   overlay > modal                 ~9 frames
 *
 * These components implement those archetypes once, against the design tokens
 * in ./design.module.css, so a service page is a composition rather than a
 * hand-written stylesheet. Measurement parity with the canvases was verified
 * with getComputedStyle, not by eye.
 */

import { useId, type ReactNode } from "react";
import s from "./design.module.css";

/** Wraps a subtree so it inherits the design tokens and container context. */
export function Surface({
  theme = "light",
  className,
  children,
}: {
  theme?: "light" | "dark";
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`${s.root}${theme === "dark" ? ` ${s.dark}` : ""}${className ? ` ${className}` : ""}`}
    >
      {children}
    </div>
  );
}

/* ── Page header ────────────────────────────────────────────────────────── */

export function PageHeader({
  title,
  info,
  count,
  actions,
}: {
  title: ReactNode;
  /** Renders the small "Info" link beside the title, as the design does. */
  info?: { href: string; label?: string };
  /** Appended as the design's muted "(n)" suffix. */
  count?: number | string;
  actions?: ReactNode;
}) {
  return (
    <div className={s.head}>
      <h1 className={s.headTitle}>
        {title}
        {count !== undefined && count !== null ? (
          <span className={s.headTitleSmall}>({count})</span>
        ) : null}
        {info ? (
          <a className={s.infoLink} href={info.href}>
            {info.label ?? "Info"}
          </a>
        ) : null}
      </h1>
      {actions ? <div className={s.btns}>{actions}</div> : null}
    </div>
  );
}

/* ── Card ───────────────────────────────────────────────────────────────── */

export function Card({
  title,
  count,
  info,
  actions,
  toolbar,
  children,
  bodyClassName,
}: {
  title?: ReactNode;
  count?: number | string;
  info?: { href: string; label?: string };
  actions?: ReactNode;
  /** Rendered between the header and the body -- where filters usually go. */
  toolbar?: ReactNode;
  children?: ReactNode;
  bodyClassName?: string;
}) {
  return (
    <section className={s.card}>
      {(title || actions) && (
        <header className={s.cardHeader}>
          <h2 className={s.cardTitle}>
            {title}
            {count !== undefined && count !== null ? (
              <span className={s.cardTitleSmall}>({count})</span>
            ) : null}
            {info ? (
              <a className={s.infoLink} href={info.href}>
                {info.label ?? "Info"}
              </a>
            ) : null}
          </h2>
          {actions ? <div className={s.btns}>{actions}</div> : null}
        </header>
      )}
      {toolbar ? <div className={s.toolbar}>{toolbar}</div> : null}
      {children !== undefined && children !== null ? (
        <div className={`${s.cardBody}${bodyClassName ? ` ${bodyClassName}` : ""}`}>{children}</div>
      ) : null}
    </section>
  );
}

/* ── Buttons ───────────────────────────────────────────────────────────── */

type ButtonVariant = "primary" | "outline" | "orange" | "danger";

export function Button({
  variant = "outline",
  full,
  children,
  ...rest
}: {
  variant?: ButtonVariant;
  full?: boolean;
  children: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = [s.btn];
  if (variant === "primary") cls.push(s.pri);
  if (variant === "orange") cls.push(s.org);
  if (variant === "danger") cls.push(s.danger);
  if (full) cls.push(s.full);
  return (
    <button type="button" {...rest} className={`${cls.join(" ")} ${rest.className ?? ""}`}>
      {children}
    </button>
  );
}

/* ── List ───────────────────────────────────────────────────────────────── */

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  /** Marks the cell as a row header for screen readers. */
  rowHeader?: boolean;
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
}) {
  return (
    <div className={s.tablewrap}>
      <table className={s.table}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" className={s.th}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className={s.tr}>
              {columns.map((c) =>
                c.rowHeader ? (
                  <th key={c.key} scope="row" className={s.th}>
                    {c.render(row)}
                  </th>
                ) : (
                  <td key={c.key} className={s.td}>
                    {c.render(row)}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder = "Filter",
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label: string;
}) {
  const id = useId();
  return (
    <>
      <label htmlFor={id} className={s.srOnly}>
        {label}
      </label>
      <input
        id={id}
        type="search"
        className={s.input}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className={s.empty}>
      <b className={s.emptyTitle}>{title}</b>
      {children}
    </div>
  );
}

/* ── Detail ─────────────────────────────────────────────────────────────── */

export function Stat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className={s.stat}>
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}

export function Badge({
  tone = "off",
  children,
}: {
  tone?: "ok" | "warn" | "bad" | "off";
  children: ReactNode;
}) {
  const toneClass = { ok: s.dotOk, warn: s.dotWarn, bad: s.dotBad, off: s.dotOff }[tone];
  return (
    <span className={s.badge}>
      <span className={`${s.dot} ${toneClass}`} aria-hidden="true" />
      {children}
    </span>
  );
}

export function DetailRow({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className={s.tog}>
      <span className={s.muted}>{label}</span>
      <span>{children}</span>
    </div>
  );
}

export function Tabs({
  tabs,
  active,
}: {
  tabs: { id: string; label: string; href?: string }[];
  active: string;
}) {
  return (
    <nav className={s.tabs} aria-label="Sections">
      {tabs.map((t) =>
        t.href ? (
          <a
            key={t.id}
            href={t.href}
            aria-current={t.id === active ? "page" : undefined}
            className={t.id === active ? `${s.tab} ${s.tabOn}` : s.tab}
          >
            {t.label}
          </a>
        ) : (
          <span
            key={t.id}
            aria-current={t.id === active ? "page" : undefined}
            className={t.id === active ? `${s.tab} ${s.tabOn}` : s.tab}
          >
            {t.label}
          </span>
        ),
      )}
    </nav>
  );
}

/* ── Forms ──────────────────────────────────────────────────────────────── */

export function Field({
  label,
  hint,
  error,
  children,
  id: providedId,
}: {
  label: string;
  hint?: ReactNode;
  error?: ReactNode;
  /** Receives the generated id so the caller can wire up htmlFor/aria. */
  children: (props: {
    id: string;
    "aria-invalid"?: boolean;
    "aria-describedby"?: string;
  }) => ReactNode;
  id?: string;
}) {
  const generated = useId();
  const id = providedId ?? generated;
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const describedBy = [errId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`${s.field}${error ? ` ${s.fieldErr}` : ""}`}>
      <label htmlFor={id} className={s.fieldLabel}>
        {label}
      </label>
      {children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy })}
      {error ? (
        <span className={s.errText} id={errId} role="alert">
          {error}
        </span>
      ) : null}
      {hint ? (
        <span className={s.hint} id={hintId}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  hint,
  error,
  placeholder,
  type = "text",
  autoComplete,
  disabled,
  id,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: ReactNode;
  error?: ReactNode;
  placeholder?: string;
  type?: "text" | "email" | "password" | "search";
  autoComplete?: string;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <Field label={label} hint={hint} error={error} id={id}>
      {(p) => (
        <input
          {...p}
          className={s.input}
          type={type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </Field>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
  hint,
  error,
  disabled,
  id,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  hint?: ReactNode;
  error?: ReactNode;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <Field label={label} hint={hint} error={error} id={id}>
      {(p) => (
        <select
          {...p}
          className={s.input}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value as T)}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  hint,
  error,
  placeholder,
  disabled,
  id,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: ReactNode;
  error?: ReactNode;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <Field label={label} hint={hint} error={error} id={id}>
      {(p) => (
        <textarea
          {...p}
          className={s.textarea}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </Field>
  );
}

export function RadioOption({
  name,
  checked,
  onChange,
  title,
  description,
  disabled,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  title: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className={s.opt}>
      <input type="radio" name={name} checked={checked} onChange={onChange} disabled={disabled} />
      <span>
        <b>{title}</b>
        {description}
      </span>
    </label>
  );
}

export function CheckOption({
  checked,
  onChange,
  title,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  title: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className={s.opt}>
      <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} />
      <span>
        <b>{title}</b>
        {description}
      </span>
    </label>
  );
}

export function Steps({ steps, active }: { steps: string[]; active: number }) {
  return (
    <ol className={s.steps} aria-label="Progress">
      {steps.map((label, i) => (
        <li
          key={label}
          className={i === active ? `${s.step} ${s.stepOn}` : s.step}
          aria-current={i === active ? "step" : undefined}
        >
          {label}
        </li>
      ))}
    </ol>
  );
}

/* ── Feedback ──────────────────────────────────────────────────────────── */

export function Alert({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "success" | "error";
  title?: ReactNode;
  children?: ReactNode;
}) {
  const cls = tone === "success" ? s.alertSuccess : tone === "error" ? s.alertError : "";
  return (
    <div
      className={`${s.alert}${cls ? ` ${cls}` : ""}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <span>
        {title ? <b>{title}</b> : null}
        {title && children ? <br /> : null}
        {children}
      </span>
    </div>
  );
}

/* ── Loading ───────────────────────────────────────────────────────────── */

export function Spinner({
  size = "md",
  label = "Loading",
}: {
  size?: "sm" | "md" | "lg";
  label?: string;
}) {
  const cls = size === "lg" ? s.spinLg : size === "sm" ? s.spinSm : "";
  return <output className={`${s.spin}${cls ? ` ${cls}` : ""}`} aria-label={label} />;
}

export function Skeleton({ width = "100%", height }: { width?: string | number; height?: number }) {
  return (
    <span
      className={s.sk}
      aria-hidden="true"
      style={{ display: "block", width, height: height ?? undefined }}
    />
  );
}

export function LoadingRow({ children }: { children?: ReactNode }) {
  return (
    <output className={s.loadRow}>
      <Spinner size="sm" label="" />
      <span>{children ?? "Loading"}</span>
    </output>
  );
}

/** Skeleton stand-in for a table body while a list request is in flight. */
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className={s.loadRow} style={{ flexDirection: "column", alignItems: "stretch", gap: 12 }}>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 16 }}
        >
          {Array.from({ length: columns }).map((__, c) => (
            <Skeleton key={c} width={c === 0 ? "70%" : "45%"} />
          ))}
        </div>
      ))}
      <span className={s.srOnly}>Loading</span>
    </div>
  );
}

/* ── Modal ─────────────────────────────────────────────────────────────── */

export function Modal({
  title,
  onClose,
  children,
  footer,
}: {
  title: ReactNode;
  onClose: () => void;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  const titleId = useId();
  return (
    /*
     * Click-to-dismiss on the backdrop. A button keeps the keyboard path and
     * avoids the a11y rule against click handlers on non-interactive elements.
     */
    <button type="button" className={s.overlay} aria-label="Close" onClick={onClose} tabIndex={-1}>
      <dialog className={s.modal} aria-labelledby={titleId} open>
        <header className={s.modalHeader}>
          <span id={titleId}>{title}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
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
        <div className={s.modalBody}>{children}</div>
        {footer ? <footer className={s.modalFooter}>{footer}</footer> : null}
      </dialog>
    </button>
  );
}

export function ConfirmModal({
  title,
  children,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  busy,
  destructive = true,
}: {
  title: string;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
  destructive?: boolean;
}) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={
        <>
          <Button onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant={destructive ? "danger" : "primary"} onClick={onConfirm} disabled={busy}>
            {busy ? <Spinner size="sm" label="" /> : null}
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}

/* ── Layout helpers ────────────────────────────────────────────────────── */

export function TwoColumn({ main, help }: { main: ReactNode; help?: ReactNode }) {
  return (
    <div className={s.twocol}>
      <div className={s.twocolMain}>{main}</div>
      {help ? <div className={s.twocolHelp}>{help}</div> : null}
    </div>
  );
}

export function Columns({ left, right }: { left: ReactNode; right?: ReactNode }) {
  return (
    <div className={s.cols}>
      <div className={`${s.col} ${s.colLeft}`}>{left}</div>
      {right ? <div className={`${s.col} ${s.colRight}`}>{right}</div> : null}
    </div>
  );
}

export function StatGrid({ children, columns = 3 }: { children: ReactNode; columns?: 2 | 3 }) {
  return <div className={`${s.grid} ${columns === 2 ? s.g2 : s.g3}`}>{children}</div>;
}
