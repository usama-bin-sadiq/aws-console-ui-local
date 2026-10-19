"use client";

import { useEffect } from "react";

/**
 * Recovers from a stale build by reloading once.
 *
 * A Next.js build writes content-hashed chunks. If a browser is holding a
 * document that was rendered by an older build - an open tab across a redeploy,
 * a cached HTML response, or a server still serving chunks that have since been
 * deleted - the page renders but its JavaScript never arrives:
 *
 *     Uncaught ChunkLoadError: Failed to load chunk /_next/static/chunks/....js
 *
 * The visible result is the worst kind of failure. The server-rendered markup
 * looks complete and interactive, but no handler was ever attached, so every
 * control on the page silently does nothing. A user cannot tell "not ready" from
 * "broken", and the console is unusable until they discover a manual refresh.
 *
 * This listener detects that signature and reloads the document once. The
 * sessionStorage guard is what makes it safe: a genuinely broken deployment
 * would otherwise reload forever, and a reload that does not fix the signature
 * must be a no-op rather than a loop.
 */
const RECOVERY_FLAG = "aws-console:stale-asset-reload";

/** Matches the chunk-loading failures that mean "this document is out of date". */
export function isStaleAssetError(value: unknown): boolean {
  if (value instanceof Error) {
    if (value.name === "ChunkLoadError") return true;
    return /Failed to load chunk|Loading chunk \S+ failed|error loading dynamically imported module/i.test(
      value.message,
    );
  }
  if (typeof value === "string") {
    return /ChunkLoadError|Failed to load chunk|Loading chunk \S+ failed|error loading dynamically imported module/i.test(
      value,
    );
  }
  return false;
}

/** Pulls a usable message out of an error event, which keeps the message nested. */
function messageOf(event: ErrorEvent): unknown {
  return event.error ?? event.message;
}

export function StaleAssetRecovery() {
  useEffect(() => {
    const reload = () => {
      let alreadyTried = false;
      try {
        alreadyTried = window.sessionStorage.getItem(RECOVERY_FLAG) === "1";
      } catch {
        // Private mode or a blocked storage partition: fall through and reload,
        // since one attempt is still better than a permanently inert page.
      }
      if (alreadyTried) return;
      try {
        window.sessionStorage.setItem(RECOVERY_FLAG, "1");
      } catch {
        // Ignore: without storage the guard degrades to "reload at most once per page load".
      }
      window.location.reload();
    };

    const onError = (event: ErrorEvent) => {
      if (isStaleAssetError(messageOf(event))) reload();
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      if (isStaleAssetError(event.reason)) reload();
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}

export default StaleAssetRecovery;
