"use client";

import { apiFetch } from "@/lib/api-client";
import React, { useEffect, useState, useRef } from "react";
import { ConsoleShell } from "./shell/ConsoleShell";
import shellStyles from "./shell/shell.module.css";
import Flashbar from "@cloudscape-design/components/flashbar";
import { Mode, applyMode } from "@cloudscape-design/global-styles";
import { usePathname, useRouter } from "next/navigation";
import { useSettingsStore } from "@/stores/settings";
import { AWS_REGIONS } from "@/constants/regions";
import {
  ALL_SERVICES as NAVIGATION_SERVICES,
  getAvailableNavigationItems,
} from "@/constants/navigation";
import { getServiceNavigation } from "@/constants/service-navigation";
import {
  AdapterMode,
  AdapterStatus,
  EmulatorHealthStatus,
  findServiceCompatibility,
  getAdapterStatusForMode,
  getServiceAvailability,
  toAdapterMode,
} from "@/constants/service-compatibility";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { useResourceCounts } from "@/hooks/useResourceCounts";
import type { OverlayAnchor } from "@/components/aws-console/AwsConsoleOverlay";
import {
  AwsServicesOverlay,
  type AwsServicesOverlayCategory,
  type AwsServicesOverlayItem,
} from "@/components/aws-console/AwsServicesOverlay";
import { AwsRegionSelector } from "@/components/aws-console/AwsRegionSelector";
import {
  AwsSearchResults,
  type AwsSearchResultItem,
} from "@/components/aws-console/AwsSearchResults";
import { AwsAccountMenu } from "@/components/aws-console/AwsAccountMenu";
import { getServiceDescription } from "@/constants/service-descriptions";
import { getServiceIcon } from "@/constants/service-icons";
import { useAuth } from "@/context/AuthContext";
// The shell's small-screen treatment. The width the script reads and the width
// the stylesheet switches on are the same two numbers; see
// src/components/layouts/shell-responsive.ts.
import "@/components/layouts/shell-responsive.module.css";
import {
  SHELL_COMPACT_MAX_WIDTH,
  SHELL_PHONE_MAX_WIDTH,
  isShellPhoneWidth,
} from "@/components/layouts/shell-responsive";
import type { Terminal } from "xterm";
import type { FitAddon } from "@xterm/addon-fit";

function safeDecodePathSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/**
 * Header utility aria-label prefixes. The region and account panels resolve their
 * trigger through these labels because Cloudscape does not hand the DOM element
 * to utility callbacks.
 */
const REGION_TRIGGER_LABEL = "Change AWS Region";
const ACCOUNT_TRIGGER_LABEL = "Account menu";

/** Display names for the emulator providers the console can talk to. */
const PROVIDER_LABELS: Record<string, string> = {
  localstack: "LocalStack",
  ministack: "MiniStack",
  localemu: "LocalEmu",
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut, isSuperAdmin } = useAuth();
  const {
    region,
    setRegion,
    theme,
    setTheme,
    provider,
    setProvider,
    favorites,
    addFavorite,
    removeFavorite,
  } = useSettingsStore();
  const [healthStatus, setHealthStatus] = useState<EmulatorHealthStatus>("checking");
  const [healthServices, setHealthServices] = useState<Record<string, unknown>>({});
  const activeMode = toAdapterMode(provider);
  // The header search panel owns dropdown + keyboard interaction.
  const { searchValue, setSearchValue, searchResults } = useGlobalSearch(
    activeMode,
    healthStatus,
    healthServices,
    { manageDropdown: false },
  );
  const { counts: resourceCounts } = useResourceCounts();
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(true);
  const [isCompactLayout, setIsCompactLayout] = useState(false);
  // Split out from `isCompactLayout` because the two boundaries are not the same
  // question: the compact band decides whether the rail starts closed, and the
  // phone band decides whether the header's keyboard-shortcut hint is drawn.
  const [isPhoneLayout, setIsPhoneLayout] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      type: "success" | "error" | "warning" | "info";
      header: string;
      content?: string;
      dismissible: boolean;
    }>
  >([]);
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstance = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);

  // AWS-styled header panels. `null` means closed; the anchor is the trigger's
  // geometry captured on click so each panel can be positioned under its trigger.
  type OverlayKey = "services" | "region" | "account" | "search";
  const [openOverlay, setOpenOverlay] = useState<OverlayKey | null>(null);
  const [overlayAnchor, setOverlayAnchor] = useState<OverlayAnchor | null>(null);
  const [searchInputRect, setSearchInputRect] = useState<OverlayAnchor | null>(null);

  const anchorFromElement = (element: HTMLElement | null): OverlayAnchor | null => {
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top,
      left: rect.left,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
    };
  };

  // Cloudscape renders header utilities as anchors whose handlers receive an
  // event stub with no DOM reference, so the trigger is resolved by the
  // aria-label this component sets on it. Only the visible (non-measuring) copy
  // of the header is considered.
  const findUtilityTrigger = (labelPrefix: string): HTMLElement | null => {
    const candidates = document.querySelectorAll<HTMLElement>(
      "#awsui-top-navigation header [aria-label]",
    );
    for (const element of candidates) {
      if (!element.getAttribute("aria-label")?.startsWith(labelPrefix)) continue;
      const rect = element.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0 && rect.x >= 0) return element;
    }
    return null;
  };

  const toggleOverlay = (key: OverlayKey, trigger: HTMLElement | null) => {
    const anchor = anchorFromElement(trigger);
    if (!anchor) return;
    setSearchInputRect(anchor);
    setOverlayAnchor(anchor);
    setOpenOverlay((current) => (current === key ? null : key));
  };

  const toggleOverlayFromEvent = (key: OverlayKey, event: React.SyntheticEvent<HTMLElement>) => {
    toggleOverlay(key, event.currentTarget);
  };

  const toggleUtilityOverlay = (key: OverlayKey, labelPrefix: string) => () => {
    toggleOverlay(key, findUtilityTrigger(labelPrefix));
  };

  /*
   * Anchors an overlay panel to the control that opened it.
   *
   * The previous implementation looked the trigger up by its aria-label prefix
   * (`findUtilityTrigger`). That only works for Cloudscape's own utilities, so
   * it breaks the moment the band renders our own markup -- which it now does.
   * Taking the element straight from the click event is both simpler and immune
   * to whatever text the trigger happens to render.
   */
  const openOverlayAt = (key: OverlayKey) => (event: React.MouseEvent<HTMLElement>) => {
    toggleOverlay(key, event.currentTarget);
  };

  const closeOverlay = () => {
    setOpenOverlay(null);
    setOverlayAnchor(null);
  };

  // Any route change or Escape closes the open header panel.
  useEffect(() => {
    closeOverlay();
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const searchFieldRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = searchFieldRef.current;
    if (!node) return;
    const measure = () => {
      const rect = node.getBoundingClientRect();
      setSearchInputRect((current) => {
        if (
          current &&
          Math.abs(current.left - rect.left) < 1 &&
          Math.abs(current.top - rect.top) < 1
        )
          return current;
        return {
          top: rect.top,
          left: rect.left,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
        };
      });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [isCompactLayout]);

  // Apply theme
  useEffect(() => {
    applyMode(theme as Mode);
  }, [theme]);

  useEffect(() => {
    const updateLayoutMode = () => {
      const compact = window.innerWidth <= SHELL_COMPACT_MAX_WIDTH;
      setIsCompactLayout(compact);
      setIsPhoneLayout(isShellPhoneWidth(window.innerWidth));
      if (compact) {
        setNavigationOpen(false);
      } else if (!localStorage.getItem("aws_console_nav_closed")) {
        setNavigationOpen(true);
      }
    };

    updateLayoutMode();
    window.addEventListener("resize", updateLayoutMode);
    return () => window.removeEventListener("resize", updateLayoutMode);
  }, []);

  // Mount tracking for hydration fix
  useEffect(() => {
    setMounted(true);
    void Promise.resolve(useSettingsStore.persist.rehydrate()).then(() => {
      try {
        const legacy = JSON.parse(localStorage.getItem("aws_favorites") || "[]");
        if (!Array.isArray(legacy)) return;
        for (const href of legacy) {
          if (typeof href !== "string") continue;
          const service = NAVIGATION_SERVICES.find((item) => item.href === href);
          if (service?.text) {
            addFavorite({ serviceId: href, serviceName: service.text, serviceHref: href });
          }
        }
      } catch {
        // Ignore malformed legacy favorites.
      }
    });
  }, [addFavorite]);

  // Health check on mount
  useEffect(() => {
    apiFetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        setHealthStatus(
          data.status === "healthy"
            ? "healthy"
            : data.status === "degraded"
              ? "degraded"
              : data.status === "starting"
                ? "starting"
                : "unreachable",
        );
        setHealthServices(data.services || {});
        if (data.provider) {
          setProvider(data.provider);
        }
      })
      .catch(() => {
        setHealthStatus("unreachable");
        setProvider("unknown");
      });
  }, [setProvider]);

  // Keep the Console Home recently-visited widget useful across service routes.
  useEffect(() => {
    if (!pathname || pathname === "/") return;

    const serviceHref = [...NAVIGATION_SERVICES]
      .map((service) => service.href)
      .filter((href): href is string => Boolean(href))
      .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
      .sort((a, b) => b.length - a.length)[0];

    if (!serviceHref) return;

    try {
      const stored = JSON.parse(localStorage.getItem("aws_recently_visited") || "[]");
      const recent = Array.isArray(stored)
        ? stored
            .map((item) => (typeof item === "string" ? item : item?.href))
            .filter((href): href is string => typeof href === "string")
        : [];
      localStorage.setItem(
        "aws_recently_visited",
        JSON.stringify([serviceHref, ...recent.filter((href) => href !== serviceHref)].slice(0, 5)),
      );
    } catch {
      // Ignore malformed or unavailable browser storage.
    }
  }, [pathname]);

  // Keyboard shortcuts: Option+S opens search, Esc closes the open panels.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === "s") {
        e.preventDefault();
        const searchInputs = [
          ...document.querySelectorAll<HTMLInputElement>('input[aria-label="Search services"]'),
        ];
        const searchInput =
          searchInputs.find((input) => {
            const rect = input.getBoundingClientRect();
            const style = window.getComputedStyle(input);
            return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden";
          }) || searchInputs[0];
        searchInput?.focus();
      }
      if (e.key === "Escape") {
        setNotificationsOpen(false);
        if (terminalOpen) {
          setTerminalOpen(false);
          localStorage.setItem("terminal_open", "false");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [terminalOpen]);

  // Expanded categories are kept open by default for consistent SSR/hydration
  // (localStorage persistence removed to avoid server/client mismatch)

  // Load xterm CSS dynamically
  useEffect(() => {
    if (terminalOpen && typeof window !== "undefined") {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://cdn.jsdelivr.net/npm/xterm@5.3.0/css/xterm.css";
      document.head.appendChild(link);
    }
  }, [terminalOpen]);

  function executeCommand(cmd: string, term: Terminal): void {
    const trimmed = cmd.trim();

    if (trimmed === "help") {
      term.writeln("Available commands:");
      term.writeln("  aws s3 ls             - List S3 buckets");
      term.writeln("  aws ec2 describe-instances - List EC2 instances");
      term.writeln("  clear                 - Clear terminal");
      term.writeln("  help                  - Show this help");
    } else if (trimmed === "clear") {
      term.clear();
    } else if (trimmed.startsWith("aws")) {
      term.writeln(`Executing: ${trimmed}`);
      apiFetch("/api/terminal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: trimmed }),
      })
        .then((r) => r.json())
        .then((data) => term.writeln(data.output || ""))
        .catch(() => term.writeln("Error executing command"));
    } else if (trimmed) {
      term.writeln(`Command not found: ${trimmed}`);
    }
  }

  // Terminal setup. Dynamic imports are cancellable so closing the panel
  // before they resolve cannot create an orphaned xterm instance.
  useEffect(() => {
    let disposed = false;
    let disposeTerminal: (() => void) | undefined;
    let currentTerminal: Terminal | null = null;

    if (!terminalOpen || !terminalRef.current || terminalInstance.current) {
      return () => {
        disposed = true;
        disposeTerminal?.();
      };
    }

    const setupTerminal = async () => {
      const [{ Terminal }, { FitAddon }, { WebLinksAddon }, { SearchAddon }] = await Promise.all([
        import("xterm"),
        import("@xterm/addon-fit"),
        import("@xterm/addon-web-links"),
        import("@xterm/addon-search"),
      ]);
      if (disposed || !terminalRef.current) return;

      const term = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        theme: {
          background: theme === "dark" ? "#000000" : "#ffffff",
          foreground: theme === "dark" ? "#ffffff" : "#000000",
          cursor: theme === "dark" ? "#ffffff" : "#000000",
        },
        allowProposedApi: true,
      });
      currentTerminal = term;
      const fit = new FitAddon();
      fitAddon.current = fit;
      term.loadAddon(fit);
      term.loadAddon(new WebLinksAddon());
      term.loadAddon(new SearchAddon());

      if (disposed || !terminalRef.current) {
        term.dispose();
        return;
      }
      term.open(terminalRef.current);
      fit.fit();
      term.writeln("AWS Console Terminal");
      term.writeln("LocalStack/MiniStack Shell");
      term.writeln("");
      term.write("$ ");

      let currentLine = "";
      term.onData((data) => {
        if (data === "\r") {
          term.write("\r\n");
          executeCommand(currentLine, term);
          currentLine = "";
          term.write("$ ");
        } else if (data === "\u007F") {
          if (currentLine.length > 0) {
            currentLine = currentLine.slice(0, -1);
            term.write("\b \b");
          }
        } else {
          currentLine += data;
          term.write(data);
        }
      });

      terminalInstance.current = term;
      const handleResize = () => fit.fit();
      window.addEventListener("resize", handleResize);
      disposeTerminal = () => {
        window.removeEventListener("resize", handleResize);
        if (terminalInstance.current === term) terminalInstance.current = null;
        if (fitAddon.current === fit) fitAddon.current = null;
        term.dispose();
        if (currentTerminal === term) currentTerminal = null;
      };
    };

    void setupTerminal().catch(() => {
      if (!disposed) {
        terminalInstance.current = null;
        fitAddon.current = null;
      }
    });

    return () => {
      disposed = true;
      disposeTerminal?.();
    };
  }, [terminalOpen, theme]);

  // Load terminal state from localStorage
  useEffect(() => {
    const savedTerminalState = localStorage.getItem("terminal_open");
    if (savedTerminalState === "true") {
      setTerminalOpen(true);
    }
  }, []);

  // Generate breadcrumbs from pathname
  const breadcrumbs = React.useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const items = [{ text: "Home", href: "/" }];
    const serviceLabels: Record<string, string> = {
      ec2: "EC2",
      iam: "IAM",
      s3: "S3",
      vpc: "VPC",
      "api-gateway": "API Gateway",
      cloudwatch: "CloudWatch",
      dynamodb: "DynamoDB",
    };

    let currentPath = "";
    segments.forEach((segment) => {
      currentPath += `/${segment}`;
      const decodedSegment = safeDecodePathSegment(segment);
      const normalizedSegment = decodedSegment.toLowerCase();
      items.push({
        text:
          serviceLabels[normalizedSegment] ||
          decodedSegment.charAt(0).toUpperCase() + decodedSegment.slice(1),
        href: currentPath,
      });
    });

    return items;
  }, [pathname]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  const toggleTerminal = () => {
    const newState = !terminalOpen;
    setTerminalOpen(newState);
    localStorage.setItem("terminal_open", String(newState));
  };

  const handleRegionChange = (selectedOption: any) => {
    setRegion(selectedOption.value);
  };

  const selectedRegion = AWS_REGIONS.find((r) => r.value === region) || AWS_REGIONS[0];
  const navigationItems = getAvailableNavigationItems(activeMode, healthStatus, healthServices);
  const navigationAvailability = new Map(
    navigationItems
      .filter((item) => item.type === "expandable-link-group")
      .flatMap((group) => group.items || [])
      .filter((item) => Boolean(item.href))
      .map((item) => [item.href!, !item.disabled]),
  );
  const enabledNavigationHrefs = new Set(
    [...navigationAvailability.entries()].filter(([, enabled]) => enabled).map(([href]) => href),
  );
  const isNavigationHrefEnabled = (href: string): boolean => {
    const knownAvailability = navigationAvailability.get(href);
    if (knownAvailability !== undefined) return knownAvailability;
    const compatibility = findServiceCompatibility(href);
    return compatibility
      ? getServiceAvailability(compatibility, activeMode, healthStatus, healthServices).enabled
      : false;
  };
  const isContextualNavigationHrefEnabled = (href: string): boolean => {
    if (healthStatus === "unreachable") return false;
    const currentRouteKey = pathname?.split("/").filter(Boolean)[0];
    const currentCompatibility = currentRouteKey
      ? findServiceCompatibility(`/${currentRouteKey}`)
      : undefined;
    if (currentCompatibility) {
      if (getAdapterStatusForMode(currentCompatibility, activeMode) === AdapterStatus.NOT_SUPPORTED)
        return false;
    }
    const compatibility = findServiceCompatibility(href);
    if (!compatibility) return false;
    return getAdapterStatusForMode(compatibility, activeMode) !== AdapterStatus.NOT_SUPPORTED;
  };
  const contextualNavigation = getServiceNavigation(pathname);
  const contextualSidebarItems = contextualNavigation
    ? contextualNavigation.map((group) => ({
        text: group.text,
        href: group.href,
        items: group.items
          .filter((item) => isContextualNavigationHrefEnabled(item.href))
          .map((item) => ({
            text: item.text,
            href: item.href,
            icon: getServiceIcon(item.href, "small"),
          })),
        defaultExpanded: true,
      }))
    : [];
  const hasContextualNavigation = contextualSidebarItems.some((group) => group.items.length > 0);
  const sidebarItems = contextualSidebarItems;
  const contextualHrefs = new Set(
    (contextualNavigation || [])
      .flatMap((group) => group.items)
      .filter((item) => isContextualNavigationHrefEnabled(item.href))
      .map((item) => item.href),
  );
  const allowedSidebarHrefs = hasContextualNavigation ? contextualHrefs : enabledNavigationHrefs;
  // "Additional services" mirrors the cross-service list at the bottom of a real
  // AWS service navigation panel. Only capability-enabled services are listed.
  const additionalSidebarItems = navigationItems
    .filter((item) => item.type === "expandable-link-group")
    .flatMap((group) => group.items || [])
    .filter((item) => item.type === "link" && Boolean(item.href))
    .filter((item) => !contextualHrefs.has(item.href!))
    .filter((item) => isNavigationHrefEnabled(item.href!))
    .map((item) => ({
      text: item.text!,
      href: item.href!,
      icon: getServiceIcon(item.href!, "small") ?? undefined,
    }));
  const serviceLookup = new Map(
    NAVIGATION_SERVICES.filter((service) => Boolean(service.href)).map((service) => [
      service.href!,
      service,
    ]),
  );
  const recentHrefs = (() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = JSON.parse(localStorage.getItem("aws_recently_visited") || "[]");
      return Array.isArray(stored)
        ? stored
            .map((item) => (typeof item === "string" ? item : item?.href))
            .filter((href): href is string => typeof href === "string")
        : [];
    } catch {
      return [];
    }
  })();
  const recentMenuItems = recentHrefs
    .map((href) => serviceLookup.get(href))
    .filter((service): service is (typeof NAVIGATION_SERVICES)[number] => Boolean(service))
    .filter((service) => service.href && isNavigationHrefEnabled(service.href))
    .slice(0, 5)
    .map((service) => ({
      id: service.href!,
      text: service.text || service.href!,
      href: service.href!,
    }));
  const favoriteMenuItems = favorites
    .filter((favorite) => isNavigationHrefEnabled(favorite.serviceHref))
    .map((favorite) => ({
      id: favorite.serviceHref,
      text: favorite.serviceName,
      href: favorite.serviceHref,
    }));
  // AWS console home has no left navigation rail, and a rail is only worth
  // rendering when it actually holds capability-enabled destinations.
  const showSidebar =
    pathname !== "/" &&
    (hasContextualNavigation || recentMenuItems.length > 0 || favoriteMenuItems.length > 0);

  // Escape closes the service rail. Cloudscape moves focus to the rail's close
  // button when it opens, so a keyboard user can already dismiss it with Enter —
  // but Escape is the dismissal every panel in this console is expected to
  // answer, and below Cloudscape's own 688px breakpoint the rail is a
  // full-screen overlay, so without it the only way out is to find the close
  // control inside the panel.
  //
  // This lives in its own effect rather than the shortcut handler above because
  // `showSidebar` is derived from the navigation lists further down the render,
  // and a dependency array cannot read a binding that has not been initialised
  // yet. Nothing else listens for Escape while the rail is open, so this cannot
  // swallow another consumer's: the rail is the outermost thing one Escape does.
  useEffect(() => {
    if (!showSidebar || !navigationOpen) return;
    const closeRailOnEscape = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setNavigationOpen(false);
      localStorage.setItem("aws_console_nav_closed", "true");
    };
    window.addEventListener("keydown", closeRailOnEscape);
    return () => window.removeEventListener("keydown", closeRailOnEscape);
  }, [showSidebar, navigationOpen]);
  // ── Data for the AWS-styled header panels ────────────────────────────────
  // Categories keep their capability state so the Services panel can show every
  // service and mark the ones the active emulator cannot serve.
  const servicesOverlayCategories: AwsServicesOverlayCategory[] = navigationItems
    .filter((item) => item.type === "expandable-link-group")
    .map((group) => ({
      text: group.text || "Services",
      items: (group.items || []).map((item) => ({
        // `getAvailableNavigationItems` marks partial services with a suffix; the
        // overlay shows the plain name and conveys state separately.
        text: (item.text || item.href || "Service").replace(/ \(partial\)$/, ""),
        href: item.href || "#",
        disabled: Boolean(item.disabled),
        disabledReason: item.disabledReason,
      })),
    }))
    .filter((category) => category.items.length > 0);

  const toOverlayItem = (item: { text: string; href: string }): AwsServicesOverlayItem => {
    const match = servicesOverlayCategories
      .flatMap((category) => category.items)
      .find((service) => service.href === item.href);
    return {
      text: item.text,
      href: item.href,
      disabled: match?.disabled ?? false,
      disabledReason: match?.disabledReason,
    };
  };

  const overlayRecentItems = recentMenuItems.map(toOverlayItem);
  const overlayFavoriteItems = favoriteMenuItems.map(toOverlayItem);

  const isFavoriteHref = (href: string) =>
    favorites.some((favorite) => favorite.serviceHref === href);
  const toggleOverlayFavorite = (item: { text: string; href: string }) => {
    if (isFavoriteHref(item.href)) {
      removeFavorite(item.href);
      return;
    }
    addFavorite({ serviceId: item.href, serviceName: item.text, serviceHref: item.href });
  };

  // "See all services" list for the search panel when the field is empty.
  const browseAllServices: AwsSearchResultItem[] = servicesOverlayCategories
    .flatMap((category) => category.items)
    .map((item) => ({
      text: item.text,
      href: item.href,
      description: getServiceDescription(item.text),
      disabled: item.disabled,
      disabledReason: item.disabledReason,
    }));

  const searchResultItems: AwsSearchResultItem[] = searchResults.map((result) => ({
    text: result.text,
    href: result.href,
    description: result.description || getServiceDescription(result.text),
    category: result.category,
  }));

  if (!mounted) {
    return <div className="aws-console-hydration-shell" aria-hidden="true" />;
  }

  return (
    <>
      {/*
        `role="status"` is required, not cosmetic: a bare <div> resolves to the
        generic role, which prohibits an accessible name, so `aria-label` on it
        fails WCAG 2.1.1 (aria-prohibited-attr). `status` is the role that
        carries both the live-region semantics and a permitted name.
      */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-label="Status announcements"
        id="a11y-announcements"
        style={{
          position: "absolute",
          left: "-10000px",
          width: "1px",
          height: "1px",
          overflow: "hidden",
        }}
      />

      {/* AWS-styled header panels. Each opens under its own trigger. */}
      <AwsServicesOverlay
        open={openOverlay === "services"}
        onClose={closeOverlay}
        anchor={overlayAnchor}
        categories={servicesOverlayCategories}
        recentItems={overlayRecentItems}
        favoriteItems={overlayFavoriteItems}
        isFavorite={isFavoriteHref}
        onToggleFavorite={toggleOverlayFavorite}
      />
      <AwsRegionSelector
        open={openOverlay === "region"}
        onClose={closeOverlay}
        anchor={overlayAnchor}
        selectedRegion={region}
        onSelect={handleRegionChange}
      />
      <AwsAccountMenu
        open={openOverlay === "account"}
        onClose={closeOverlay}
        anchor={overlayAnchor}
        username={user?.username || "root"}
        isSuperAdmin={isSuperAdmin}
        providerLabel={PROVIDER_LABELS[provider] ?? "Not connected"}
        onSignOut={() => {
          void signOut().then(() => router.push("/login"));
        }}
      />
      <AwsSearchResults
        open={openOverlay === "search"}
        onClose={() => {
          closeOverlay();
          setSearchValue("");
        }}
        anchor={searchInputRect}
        query={searchValue}
        results={searchResultItems}
        browseAll={browseAllServices}
        isFavorite={isFavoriteHref}
        onToggleFavorite={toggleOverlayFavorite}
        onInputChange={setSearchValue}
        inputId="aws-console-search-input"
      />
      <ConsoleShell
        theme={theme}
        pathname={pathname}
        crumbs={breadcrumbs}
        region={selectedRegion.label}
        accountLabel={user?.username || "root"}
        search={{
          value: searchValue,
          onChange: setSearchValue,
          placeholder: "Search",
        }}
        topLinks={recentMenuItems}
        groups={[
          ...sidebarItems.map((group) => ({
            heading: group.text,
            items: group.items.map((item) => ({
              text: item.text,
              href: item.href,
              icon: item.icon ?? undefined,
            })),
          })),
          ...(additionalSidebarItems.length > 0
            ? [{ heading: "Additional services", items: additionalSidebarItems }]
            : []),
        ]}
        showSidebar={showSidebar}
        onOpenServices={openOverlayAt("services")}
        onOpenRegion={openOverlayAt("region")}
        onOpenAccount={openOverlayAt("account")}
        onOpenNotifications={() => setNotificationsOpen((v) => !v)}
        notificationsBadge={notifications.length > 0}
        onOpenSupport={() => router.push("/support")}
        onToggleTheme={toggleTheme}
        onOpenTerminal={toggleTerminal}
        notifications={
          notificationsOpen && notifications.length > 0 ? (
            <Flashbar
              i18nStrings={{
                ariaLabel: "Console notifications",
                successIconAriaLabel: "Success",
                errorIconAriaLabel: "Error",
                warningIconAriaLabel: "Warning",
                infoIconAriaLabel: "Information",
                inProgressIconAriaLabel: "In progress",
              }}
              items={notifications.map((notification) => ({
                id: notification.id,
                type: notification.type,
                header: notification.header,
                content: notification.content,
                dismissible: notification.dismissible,
                /*
                  Without dismissLabel the close control renders with no
                  accessible name and fails WCAG 2.1.1 (button-name).
                */
                dismissLabel: notification.dismissible ? "Dismiss notification" : undefined,
                statusIconAriaLabel: `${notification.type} notification`,
                ariaRole: notification.type === "error" ? "alert" : "status",
                onDismiss: () =>
                  setNotifications((current: typeof notifications) =>
                    current.filter((item) => item.id !== notification.id),
                  ),
              }))}
            />
          ) : null
        }
        terminal={
          terminalOpen ? <div ref={terminalRef} className={shellStyles.terminalHost} /> : undefined
        }
      >
        {children}
      </ConsoleShell>
    </>
  );
}
