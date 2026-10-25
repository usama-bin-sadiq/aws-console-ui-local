"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface OverlayAnchor {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface AwsConsoleOverlayProps {
  /** Rendered only when true. Keeps the panel unmounted (and unfocusable) when closed. */
  open: boolean;
  onClose: () => void;
  /** Trigger geometry, usually captured from the trigger's bounding rect. */
  anchor: OverlayAnchor | null;
  /** Matches `aria-controls` on the trigger. */
  id: string;
  labelledBy?: string;
  /** Panel width. The services/search panels are wide; menus are narrow. */
  width?: number;
  align?: "start" | "end";
  className?: string;
  children: React.ReactNode;
}

const FOCUSABLE_ITEM_SELECTOR = '[data-overlay-item]:not([aria-disabled="true"])';

/**
 * AwsConsoleOverlay — the dark, portalled panel used by every AWS console header
 * menu (Services, Region, Account, Search results).
 *
 * The real console renders these as full dark panels anchored under the header
 * rather than small bordered dropdowns, so this is a portal + fixed positioning
 * instead of a Cloudscape dropdown. Keyboard behaviour is implemented here so
 * the individual panels only have to provide focusable `[data-overlay-item]`
 * elements:
 *
 * - Escape closes and returns focus to the trigger.
 * - ArrowDown / ArrowUp / Home / End move focus between items.
 * - Tab is intentionally left enabled so the browser handles panel traversal.
 */
export function AwsConsoleOverlay({
  open,
  onClose,
  anchor,
  id,
  labelledBy,
  width = 320,
  align = "start",
  className,
  children,
}: AwsConsoleOverlayProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  // Remember the trigger so focus can be restored on close.
  useEffect(() => {
    if (open) {
      previouslyFocused.current = (document.activeElement as HTMLElement) ?? null;
    }
  }, [open]);

  const position = useCallback((): React.CSSProperties | null => {
    if (!anchor) return null;
    const panelWidth = Math.min(width, Math.max(0, window.innerWidth - 16));
    const viewportLeft = align === "end" ? anchor.right - panelWidth : anchor.left;
    const left = Math.min(
      Math.max(8, viewportLeft),
      Math.max(8, window.innerWidth - panelWidth - 8),
    );
    const spaceBelow = window.innerHeight - anchor.bottom - 8;
    const openUpwards = spaceBelow < 240 && anchor.top > spaceBelow;
    return {
      position: "fixed",
      width: panelWidth,
      left,
      ...(openUpwards
        ? { bottom: window.innerHeight - anchor.top + 4 }
        : { top: anchor.bottom + 4 }),
    };
  }, [anchor, align, width]);

  // Keep the panel glued to its trigger while the page scrolls or resizes.
  useEffect(() => {
    if (!open) return;
    const reposition = () => {
      const panel = panelRef.current;
      if (!panel) return;
      const next = position();
      if (next) Object.assign(panel.style, next);
    };
    reposition();
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, position]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      // Clicks inside the panel are handled by the panel.
      if (target.closest(".aws-console-overlay-panel")) return;
      // Header controls own their own toggling, so a press on the header must not
      // race the trigger's click handler.
      if (target.closest("[data-aws-overlay-trigger]") || target.closest("#awsui-top-navigation"))
        return;
      onClose();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        previouslyFocused.current?.focus?.();
        return;
      }
      if (
        event.key !== "ArrowDown" &&
        event.key !== "ArrowUp" &&
        event.key !== "Home" &&
        event.key !== "End"
      ) {
        return;
      }
      const panel = panelRef.current;
      if (!panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_ITEM_SELECTOR));
      if (items.length === 0) return;
      event.preventDefault();
      const currentIndex = items.indexOf(document.activeElement as HTMLElement);
      const nextIndex =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? items.length - 1
            : event.key === "ArrowDown"
              ? (currentIndex + 1 + items.length) % items.length
              : (currentIndex - 1 + items.length) % items.length;
      items[nextIndex]?.focus();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [open, onClose]);

  // Move focus into the panel when it opens, so keyboard users land inside it.
  useLayoutEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;
    const first = panel.querySelector<HTMLElement>(FOCUSABLE_ITEM_SELECTOR);
    (first ?? panel).focus();
  }, [open]);

  if (!mounted || !open || !anchor) return null;

  return createPortal(
    <div
      ref={panelRef}
      id={id}
      role="dialog"
      aria-modal="false"
      aria-labelledby={labelledBy}
      tabIndex={-1}
      className={["aws-console-overlay-panel", className].filter(Boolean).join(" ")}
      style={position() ?? undefined}
    >
      {children}
    </div>,
    document.body,
  );
}
