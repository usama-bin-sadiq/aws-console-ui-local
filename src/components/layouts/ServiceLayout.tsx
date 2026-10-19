"use client";

import { cloneElement, isValidElement, useCallback, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ServiceHeader } from "@/components/ui/ServiceHeader";
import { SpaceBetween } from "@/components/ui/SpaceBetween";
import type { TabsProps } from "@cloudscape-design/components/tabs";
import Tabs from "@cloudscape-design/components/tabs";
// Imported for its side effect only. The phone treatment is entirely CSS, and a
// stylesheet that nothing imports is a stylesheet that never reaches the browser.
import "@/components/layouts/shell-responsive.module.css";
import { SHELL_MAX_TAB_STRIP_PX } from "@/components/layouts/shell-responsive";

/**
 * A service tab is navigation, not local state.
 *
 * The AWS service consoles render their tab bar as links: choosing "Functions"
 * or "Monitoring" loads a different page of the same service, and the bar
 * reflects the page you are on. A tab that is only a label cannot work, because
 * Cloudscape renders `tab.content` for the selected tab and there is no second
 * pane of content behind a service layout.
 *
 * `href` is therefore required rather than optional, so a tab without a real
 * destination is a compile error instead of a control that silently does
 * nothing. `src/components/layouts/ServiceLayout.tabs.test.ts` additionally
 * asserts that every href in every layout resolves to a real route.
 */
export type ServiceTab = {
  readonly label: string;
  readonly href: string;
  readonly id?: string;
};

/**
 * Resolve which tab the current URL belongs to.
 *
 * An exact href wins, otherwise the longest segment-aligned prefix does, so a
 * detail route such as `/lambda/functions/my-fn` keeps the "Functions" tab
 * selected instead of falling back to "Overview". When nothing matches — a
 * create page, for instance — the first tab stays selected.
 *
 * Exported so the routing rule is unit-testable without a browser.
 */
export function resolveActiveTabId(
  tabs: ReadonlyArray<{ id: string; href: string }>,
  pathname: string,
): string | undefined {
  let bestId: string | undefined;
  let bestLength = -1;
  for (const tab of tabs) {
    const isMatch =
      tab.href === pathname || pathname === `${tab.href}/` || pathname.startsWith(`${tab.href}/`);
    if (isMatch && tab.href.length > bestLength) {
      bestId = tab.id;
      bestLength = tab.href.length;
    }
  }
  return bestId ?? tabs[0]?.id;
}

/**
 * Service content layout.
 *
 * AppShell owns the single Cloudscape AppLayout and switches its navigation
 * between the global service catalog and the current service's information
 * architecture. Keeping this component content-only avoids nested AppLayout
 * landmarks, duplicate sidebars, and competing mobile drawers.
 */
export function ServiceLayout({
  serviceName,
  tabs,
  children,
  actions,
  showServiceHeader = true,
  showTabs = true,
}: {
  serviceName: string;
  breadcrumbs?: { text: string; href?: string }[];
  tabs?: readonly ServiceTab[];
  children: React.ReactNode;
  actions?: React.ReactNode;
  navItems?: { text: string; href?: string; items?: { text: string; href?: string }[] }[];
  splitPanel?: React.ReactNode;
  showServiceHeader?: boolean;
  showTabs?: boolean;
}) {
  const content = isValidElement(children) ? cloneElement(children, { key: "content" }) : children;
  const router = useRouter();
  const pathname = usePathname() ?? "";

  const tabEntries = useMemo(
    () =>
      (tabs ?? []).map((tab, index) => ({
        ...tab,
        id: tab.id ?? `${slugify(tab.label)}-${index}`,
      })),
    [tabs],
  );

  /**
   * Resolve which tab the current URL belongs to. An exact href wins, otherwise
   * the longest segment-aligned prefix does, so a detail route such as
   * `/lambda/functions/my-fn` keeps the "Functions" tab selected instead of
   * falling back to "Overview".
   */
  const activeTabId = useMemo(
    () => resolveActiveTabId(tabEntries, pathname),
    [pathname, tabEntries],
  );

  /**
   * Cloudscape renders each tab as a real anchor and then calls
   * `event.preventDefault()` on every normal click, delegating the navigation to
   * its `onChange` prop. Routing therefore belongs in `onChange`, which is the
   * documented way to drive these tabs.
   *
   * A modified click (ctrl/cmd/shift/alt) returns before that cancel, so the
   * native "open in a new tab" behaviour is left intact and is deliberately not
   * intercepted here.
   */
  const handleTabChange = useCallback(
    ({ detail }: { detail: TabsProps.ChangeDetail }) => {
      const href =
        detail.activeTabHref ?? tabEntries.find((tab) => tab.id === detail.activeTabId)?.href;
      if (!href || href === pathname) return;
      router.push(href);
    },
    [pathname, router, tabEntries],
  );

  // data-active-tab and data-pathname on the wrapper below expose the resolved
  // state, so an end-to-end check driving a real browser can assert which tab
  // this bar considers active instead of only reading Cloudscape's aria output.
  //
  // The bar is deliberately not gated on hydration. Gating it was tried and
  // measured to be worse: the flag flips in an effect, and on routes whose
  // subtree suspends or hits an error boundary that effect can be deferred,
  // which withheld the tab bar indefinitely rather than only briefly.
  return (
    <SpaceBetween direction="vertical" size="l">
      {showServiceHeader ? (
        <ServiceHeader key="service-header" serviceName={serviceName} actions={actions} />
      ) : null}
      {showTabs && tabEntries.length > 0 ? (
        <div
          key="service-tabs"
          data-testid="service-tabs"
          data-active-tab={activeTabId}
          data-pathname={pathname}
          // The bar's height budget, published so a measurement or a test can
          // read the contract off the DOM instead of re-deriving the number from
          // whichever stylesheet happens to be loaded.
          data-tab-strip-max={SHELL_MAX_TAB_STRIP_PX}
        >
          <Tabs
            tabs={tabEntries as ReadonlyArray<TabsProps.Tab>}
            activeTabId={activeTabId}
            onChange={handleTabChange}
            ariaLabel={`${serviceName} sections`}
          />
        </div>
      ) : null}
      {content}
    </SpaceBetween>
  );
}

/** Tab ids must stay unique and stable even when two labels collide. */
function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default ServiceLayout;
