import { describe, it, expect, vi, afterEach, beforeEach } from "vite-plus/test";
import { render, cleanup } from "@testing-library/react";
import { isStaleAssetError, StaleAssetRecovery } from "./StaleAssetRecovery";

/**
 * Stale build recovery.
 *
 * A document from an older build renders but never receives its JavaScript, so
 * every control looks interactive and silently does nothing. The recovery
 * component reloads once when that happens, guarded so a genuinely broken
 * deployment cannot loop.
 */

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.sessionStorage.clear();
});

describe("isStaleAssetError", () => {
  it("detects a ChunkLoadError by name", () => {
    const error = new Error("boom");
    error.name = "ChunkLoadError";
    expect(isStaleAssetError(error)).toBe(true);
  });

  it("detects the chunk failure message variants", () => {
    expect(isStaleAssetError(new Error("Failed to load chunk /_next/static/chunks/a.js"))).toBe(
      true,
    );
    expect(isStaleAssetError(new Error("Loading chunk app-router failed."))).toBe(true);
    expect(isStaleAssetError(new Error("error loading dynamically imported module"))).toBe(true);
  });

  it("detects a bare string reason from a rejected import", () => {
    expect(isStaleAssetError("ChunkLoadError: Loading chunk 1 failed")).toBe(true);
  });

  it("ignores unrelated errors", () => {
    expect(isStaleAssetError(new Error("Request failed with 502"))).toBe(false);
    expect(isStaleAssetError("something else")).toBe(false);
    expect(isStaleAssetError(undefined)).toBe(false);
    expect(isStaleAssetError(null)).toBe(false);
    expect(isStaleAssetError({ type: "other" })).toBe(false);
  });
});

describe("StaleAssetRecovery", () => {
  let reload: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    reload = vi.fn();
    // location.reload is not implemented in jsdom, so it is replaced.
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, reload },
    });
  });

  it("reloads once when a chunk fails to load", () => {
    render(<StaleAssetRecovery />);
    const error = new Error("Failed to load chunk /_next/static/chunks/stale.js");
    error.name = "ChunkLoadError";
    window.dispatchEvent(new ErrorEvent("error", { error }));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("reloads on an unhandled rejection carrying the same signature", () => {
    render(<StaleAssetRecovery />);
    const event = new Event("unhandledrejection") as Event & { reason?: unknown };
    event.reason = new Error("error loading dynamically imported module");
    window.dispatchEvent(event);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("does not reload twice within a session", () => {
    render(<StaleAssetRecovery />);
    const fire = () =>
      window.dispatchEvent(
        new ErrorEvent("error", {
          error: Object.assign(new Error("Failed to load chunk"), { name: "ChunkLoadError" }),
        }),
      );

    fire();
    expect(reload).toHaveBeenCalledTimes(1);

    // A second component instance in the same session must not reload again.
    cleanup();
    render(<StaleAssetRecovery />);
    fire();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("ignores ordinary application errors", () => {
    render(<StaleAssetRecovery />);
    window.dispatchEvent(new ErrorEvent("error", { error: new Error("adapter returned 502") }));
    expect(reload).not.toHaveBeenCalled();
  });

  it("stops listening once unmounted", () => {
    const { unmount } = render(<StaleAssetRecovery />);
    unmount();
    // jsdom rethrows an ErrorEvent that nothing handles, so claim it here: this
    // test is about the absence of the component's own listener, not about the
    // event reaching the window.
    const swallow = () => {};
    window.addEventListener("error", swallow);
    window.dispatchEvent(
      new ErrorEvent("error", {
        error: Object.assign(new Error("Failed to load chunk"), { name: "ChunkLoadError" }),
      }),
    );
    window.removeEventListener("error", swallow);
    expect(reload).not.toHaveBeenCalled();
  });

  it("renders nothing into the document", () => {
    const { container } = render(<StaleAssetRecovery />);
    expect(container.innerHTML).toBe("");
  });
});
