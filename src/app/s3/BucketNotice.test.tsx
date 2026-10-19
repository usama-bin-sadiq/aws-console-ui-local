import { describe, expect, it, vi } from "vite-plus/test";
import { render, screen } from "@testing-library/react";
import { BucketNotFound, BucketUnreadable } from "./BucketNotice";

/**
 * The two screens that stand in for a bucket's configuration UI.
 *
 * The not-found copy has to name the bucket and say it does not exist, because
 * that is the whole point of routing a bad bucket name away from the form. The
 * unreadable screen must not reuse that copy: it stands for a failed request,
 * which says nothing about whether the bucket exists.
 */

/** Cloudscape's Alert marks its type with data-analytics-alert, not an ARIA role. */
function errorAlert(container: HTMLElement): HTMLElement {
  const alert = container.querySelector('[data-analytics-alert="error"]');
  if (!alert) throw new Error("no error alert rendered");
  return alert as HTMLElement;
}

describe("BucketNotFound", () => {
  it("states that the bucket does not exist", () => {
    const { container } = render(<BucketNotFound bucketName="no-such-bucket-xyz" />);
    const text = errorAlert(container).textContent ?? "";
    expect(text).toContain("Bucket not found");
    expect(text).toContain("no-such-bucket-xyz");
    expect(text).toContain("does not exist");
  });

  it("offers a way back to the bucket list", () => {
    render(<BucketNotFound bucketName="no-such-bucket-xyz" />);
    expect(screen.getByRole("link", { name: "Back to buckets" })).toHaveProperty("pathname", "/s3");
  });

  it("does not blame the emulator for a bucket that is simply absent", () => {
    const { container } = render(<BucketNotFound bucketName="no-such-bucket-xyz" />);
    expect(errorAlert(container).textContent).not.toMatch(/unreachable|not responding/i);
  });
});

describe("BucketUnreadable", () => {
  it("shows the failure instead of claiming the bucket is missing", () => {
    const { container } = render(
      <BucketUnreadable
        message="The localemu adapter endpoint is unreachable."
        onRetry={vi.fn()}
      />,
    );
    const text = errorAlert(container).textContent ?? "";
    expect(text).toContain("Bucket could not be read");
    expect(text).toContain("The localemu adapter endpoint is unreachable.");
    expect(text).not.toContain("does not exist");
  });

  it("offers a retry and a way back", () => {
    const onRetry = vi.fn();
    render(<BucketUnreadable message="boom" onRetry={onRetry} />);
    expect(screen.getByRole("button", { name: "Retry" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Back to buckets" })).toHaveProperty("pathname", "/s3");
  });
});
