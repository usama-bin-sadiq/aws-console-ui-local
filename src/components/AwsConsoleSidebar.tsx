import React from "react";
import { useRouter } from "next/navigation";
import SideNavigation from "@cloudscape-design/components/side-navigation";
import type { SideNavigationProps } from "@cloudscape-design/components/side-navigation";
import { useSettingsStore } from "@/stores/settings";
import type { ServiceResourceCounts } from "@/hooks/useResourceCounts";

interface SidebarLink {
  text: string;
  href: string;
  disabled?: boolean;
}

interface SidebarGroup {
  text: string;
  items: SidebarLink[];
  defaultExpanded?: boolean;
}

interface AwsConsoleSidebarProps {
  items: SidebarGroup[];
  activeHref: string;
  resourceCounts: ServiceResourceCounts;
  countsLoading: boolean;
}

export const AwsConsoleSidebar: React.FC<AwsConsoleSidebarProps> = ({
  items,
  activeHref,
  resourceCounts,
  countsLoading,
}) => {
  const router = useRouter();
  const { favorites } = useSettingsStore();

  const navItems: SideNavigationProps.Item[] = items.map((group) => ({
    type: "expandable-link-group",
    text: group.text,
    href: group.items[0]?.href || "/",
    defaultExpanded: group.defaultExpanded,
    items: group.items.map((link) => {
      const count = resourceCounts[link.href];
      return {
        type: "link",
        text: count !== undefined && count > 0 && !countsLoading
          ? `${link.text} (${count})`
          : link.text,
        href: link.href,
      };
    }),
  }));

  const favoriteItems: SideNavigationProps.Item[] = favorites.length > 0
    ? [{
        type: "expandable-link-group",
        text: "Favorites",
        href: favorites[0]?.serviceHref || "/",
        defaultExpanded: true,
        items: favorites.map((fav) => {
          const count = resourceCounts[fav.serviceHref];
          return {
            type: "link",
            text: count !== undefined && count > 0 && !countsLoading
              ? `${fav.serviceName} (${count})`
              : fav.serviceName,
            href: fav.serviceHref,
          };
        }),
      }]
    : [];

  return (
    <SideNavigation
      activeHref={activeHref}
      header={{
        href: "/",
        text: "AWS",
        logo: { src: "/icons/Architecture-Group/AWS-Cloud-logo_32.svg", alt: "AWS" },
      }}
      onFollow={(e) => {
        e.preventDefault();
        router.push(e.detail.href);
      }}
      items={[...favoriteItems, ...navItems]}
    />
  );
};
