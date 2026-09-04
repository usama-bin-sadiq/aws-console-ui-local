/**
 * Accessibility announcement hook — writes to the aria-live region
 * in AppShell (#a11y-announcements) so screen readers announce
 * dynamic updates (table refresh, wizard submit, etc.).
 */
export function announce(message: string) {
  if (typeof document === "undefined") return;
  const region = document.getElementById("a11y-announcements");
  if (!region) return;
  // Clear first, then set new message (required for some screen readers)
  region.textContent = "";
  // Small delay ensures the change is registered
  requestAnimationFrame(() => {
    region.textContent = message;
  });
  // Auto-clear after 3 seconds
  setTimeout(() => {
    if (region.textContent === message) {
      region.textContent = "";
    }
  }, 3000);
}
