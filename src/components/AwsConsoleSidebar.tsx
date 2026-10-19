import React from "react";
import { useRouter } from "next/navigation";
import SideNavigation from "@cloudscape-design/components/side-navigation";
import type { SideNavigationProps } from "@cloudscape-design/components/side-navigation";
import { useSettingsStore } from "@/stores/settings";
import type { ServiceResourceCounts } from "@/hooks/useResourceCounts";

export interface SidebarLink {
  text: string;
  href: string;
}

export interface SidebarGroup {
  text: string;
  href?: string;
  items: SidebarLink[];
  defaultExpanded?: boolean;
}

interface AwsConsoleSidebarProps {
  /**
   * Contextual service navigation groups. Only rendered for the `service`
   * variant, matching how a real AWS service console owns its left panel.
   */
  items: SidebarGroup[];
  /** Recently visited services, shown in the global (Console Home) rail. */
  recentItems?: SidebarLink[];
  /** Cross-service links rendered as a collapsed "Additional services" section. */
  additionalItems?: SidebarLink[];
  activeHref: string;
  resourceCounts: ServiceResourceCounts;
  countsLoading: boolean;
  variant?: "global" | "service";
  headerText?: string;
  includeFavorites?: boolean;
  allowedHrefs?: ReadonlySet<string>;
}

/**
 * Sidebar shapes follow the AWS Management Console:
 *
 * - Console Home ("global"): a flat rail with `Recently visited` and
 *   `Favorites` only. The full, capability-filtered service catalogue lives in
 *   the top navigation Services menu, exactly like the real console's services
 *   overlay. We deliberately do not render per-category accordion groups here.
 * - Service consoles ("service"): the service's own navigation as sections,
 *   followed by a collapsed `Additional services` section.
 */
export const AwsConsoleSidebar: React.FC<AwsConsoleSidebarProps> = ({
  items,
  recentItems = [],
  additionalItems = [],
  activeHref,
  resourceCounts,
  countsLoading,
  variant = "global",
  headerText,
  includeFavorites,
  allowedHrefs,
}) => {
  const router = useRouter();
  const { favorites } = useSettingsStore();
  const showFavorites = includeFavorites ?? variant === "global";
  const isAllowed = (href: string): boolean => !allowedHrefs || allowedHrefs.has(href);
  const visibleFavorites = showFavorites
    ? favorites.filter((favorite) => isAllowed(favorite.serviceHref))
    : [];
  const visibleRecent = showFavorites ? recentItems.filter((link) => isAllowed(link.href)) : [];

  const toLink = (link: SidebarLink): SideNavigationProps.Item => {
    const count = resourceCounts[link.href];
    return {
      type: "link",
      text:
        count !== undefined && count > 0 && !countsLoading ? `${link.text} (${count})` : link.text,
      href: link.href,
    };
  };

  const toSection = (
    text: string,
    links: SidebarLink[],
    defaultExpanded: boolean,
  ): SideNavigationProps.Item => ({
    type: "section",
    text,
    defaultExpanded,
    items: links.map(toLink),
  });

  const contextualItems: SideNavigationProps.Item[] = items
    .filter((group) => group.items.length > 0)
    .map((group) => {
      // Category labels are sections, not duplicate links to their first child.
      // This keeps the active resource link unique, including on detail routes.
      if (!group.href || group.items.some((item) => item.href === group.href)) {
        return toSection(group.text, group.items, group.defaultExpanded ?? true);
      }

      return {
        type: "expandable-link-group" as const,
        text: group.text,
        href: group.href,
        defaultExpanded: group.defaultExpanded ?? true,
        items: group.items.map(toLink),
      };
    });

  const additionalSection: SideNavigationProps.Item[] =
    additionalItems.length > 0 ? [toSection("Additional services", additionalItems, false)] : [];

  const globalItems: SideNavigationProps.Item[] = [
    ...(visibleRecent.length > 0 ? [toSection("Recently visited", visibleRecent, true)] : []),
    ...(visibleFavorites.length > 0
      ? [
          toSection(
            "Favorites",
            visibleFavorites.map((favorite) => ({
              text: favorite.serviceName,
              href: favorite.serviceHref,
            })),
            true,
          ),
        ]
      : []),
  ];

  const navItems = variant === "service" ? [...contextualItems, ...additionalSection] : globalItems;

  // Detail routes such as /ec2/<id> should keep the resource-type link active.
  // Prefer the most specific matching service link when several prefixes match.
  const candidateLinks =
    variant === "service"
      ? [...items.flatMap((group) => group.items), ...additionalItems]
      : [
          ...recentItems,
          ...visibleFavorites.map((favorite) => ({
            text: favorite.serviceName,
            href: favorite.serviceHref,
          })),
        ];
  const resolvedActiveHref =
    candidateLinks
      .filter((link) => activeHref === link.href || activeHref.startsWith(`${link.href}/`))
      .sort((a, b) => b.href.length - a.href.length)[0]?.href || activeHref;

  // The real Console Home rail has no identity header; the top navigation logo
  // is the console home link. Service consoles keep their service name header.
  const header: SideNavigationProps.Header | undefined =
    variant === "service" ? { href: "/", text: headerText || "Service" } : undefined;

  return (
    <SideNavigation
      activeHref={resolvedActiveHref}
      header={header}
      onFollow={(e) => {
        if (e.detail.external) return;
        e.preventDefault();
        if (!isAllowed(e.detail.href)) return;
        router.push(e.detail.href);
      }}
      items={navItems}
    />
  );
};
