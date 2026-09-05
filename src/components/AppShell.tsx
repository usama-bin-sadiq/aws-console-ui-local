"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import AppLayout from "@cloudscape-design/components/app-layout";
import SideNavigation from "@cloudscape-design/components/side-navigation";
import TopNavigation from "@cloudscape-design/components/top-navigation";
import BreadcrumbGroup from "@cloudscape-design/components/breadcrumb-group";
import Autosuggest from "@cloudscape-design/components/autosuggest";
import SplitPanel from "@cloudscape-design/components/split-panel";
import Flashbar from "@cloudscape-design/components/flashbar";
import { Mode, applyMode } from "@cloudscape-design/global-styles";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useSettingsStore } from "@/stores/settings";
import { AWS_REGIONS } from "@/constants/regions";
import { getAvailableNavigationItems } from "@/constants/navigation";
import { AdapterMode, EmulatorHealthStatus } from "@/constants/service-compatibility";
import { getRecentlyVisited } from "@/lib/sqlite-adapter";
import { useGlobalSearch, groupByCategory } from "@/hooks/useGlobalSearch";
import type { Terminal } from "xterm";
import type { FitAddon } from "@xterm/addon-fit";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { region, setRegion, theme, setTheme, provider, setProvider, favorites } = useSettingsStore();
  const [healthStatus, setHealthStatus] = useState<EmulatorHealthStatus>("checking");
  const [healthServices, setHealthServices] = useState<Record<string, unknown>>({});
  const activeMode = provider === "ministack" ? AdapterMode.MINSTACK : AdapterMode.LOCALSTACK;
  const { searchValue, setSearchValue, searchResults } = useGlobalSearch(activeMode, healthStatus, healthServices);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(true);
  const [isCompactLayout, setIsCompactLayout] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: "success" | "error" | "warning" | "info";
    header: string;
    content?: string;
    dismissible: boolean;
  }>>([]);
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstance = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);

  // Apply theme
  useEffect(() => {
    applyMode(theme as Mode);
  }, [theme]);

  useEffect(() => {
    const updateLayoutMode = () => {
      const compact = window.innerWidth < 960;
      setIsCompactLayout(compact);
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
    void useSettingsStore.persist.rehydrate();
  }, []);

  // Health check on mount
  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        setHealthStatus(data.status === "healthy" ? "healthy" : data.status === "degraded" ? "degraded" : "unreachable");
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

  // Keyboard shortcuts: Ctrl+K opens search, Esc closes dropdown
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.querySelector('input[aria-label="Search services"]') as HTMLInputElement | null;
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
      fetch("/api/terminal", {
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

  // Terminal setup
  useEffect(() => {
    if (terminalOpen && terminalRef.current && !terminalInstance.current) {
      // Import xterm dynamically to avoid SSR issues
      import("xterm").then(({ Terminal }) => {
        import("@xterm/addon-fit").then(({ FitAddon }) => {
          const term = new Terminal({
            cursorBlink: true,
            fontSize: 14,
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            theme: {
              background: theme === "dark" ? "#000000" : "#ffffff",
              foreground: theme === "dark" ? "#ffffff" : "#000000",
              cursor: theme === "dark" ? "#ffffff" : "#000000",
              // selection: "rgba(255, 255, 255, 0.3)",
            },
          });

          const fit = new FitAddon();
          fitAddon.current = fit;
          term.loadAddon(fit);
          term.open(terminalRef.current!);
          fit.fit();

          term.writeln("AWS Console Terminal");
          term.writeln("LocalStack/MiniStack Shell");
          term.writeln("");
          term.write("$ ");

          // Handle input
          let currentLine = "";
          term.onData((data) => {
            if (data === "\r") {
              // Enter key
              term.write("\r\n");
              executeCommand(currentLine, term);
              currentLine = "";
              term.write("$ ");
            } else if (data === "\u007F") {
              // Backspace
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

          // Handle resize
          const handleResize = () => {
            if (fitAddon.current) {
              fitAddon.current.fit();
            }
          };
          window.addEventListener("resize", handleResize);

          return () => {
            window.removeEventListener("resize", handleResize);
            term.dispose();
            terminalInstance.current = null;
          };
        });
      });
    }
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

    let currentPath = "";
    segments.forEach((segment) => {
      currentPath += `/${segment}`;
      const decodedSegment = decodeURIComponent(segment);
      items.push({
        text: decodedSegment.charAt(0).toUpperCase() + decodedSegment.slice(1),
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
  const groupedSearchResults = groupByCategory(searchResults);
  const searchOptions = Object.entries(groupedSearchResults).map(([category, services]) => ({
    label: category,
    options: services.map((service) => ({
      label: service.text,
      value: service.href,
      description: service.description,
      iconName: "search" as const,
    })),
  }));
  const navigationItems = getAvailableNavigationItems(activeMode, healthStatus, healthServices);
  const topNavSearchWidth = isCompactLayout ? 220 : 420;

  if (!mounted) {
    return <div className="aws-console-hydration-shell" aria-hidden="true" />;
  }

  return (
    <>
      <a
        href="#main-content"
        className="skip-nav-link"
        aria-label="Skip to main content"
        style={{
          position: "absolute",
          top: "-40px",
          left: 0,
          zIndex: 10000,
          padding: "8px 16px",
          background: "#005ea2",
          color: "#fff",
          textDecoration: "none",
          fontWeight: 600,
          borderBottomRightRadius: "4px",
          transition: "top 0.2s ease",
        }}
        onFocus={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.top = "0";
        }}
        onBlur={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.top = "-40px";
        }}
      >
        Skip to main content
      </a>
      <div
        aria-live="polite"
        aria-atomic="true"
        aria-label="Status announcements"
        id="a11y-announcements"
        style={{ position: "absolute", left: "-10000px", width: "1px", height: "1px", overflow: "hidden" }}
      />
      <div style={{ position: "sticky", top: 0, zIndex: 1001 }}>
        <TopNavigation
          identity={{
            href: "/",
            title: "AWS Management Console",
            logo: { src: "/aws-logo.svg", alt: "AWS" },
          }}
          i18nStrings={{
            searchIconAriaLabel: "Open global search",
            searchDismissIconAriaLabel: "Close global search",
            overflowMenuTriggerText: "Open console utilities",
            overflowMenuTitleText: "Console utilities",
            overflowMenuDismissIconAriaLabel: "Close console utilities",
            overflowMenuBackIconAriaLabel: "Back to console utilities",
          }}
          visualContext="top-navigation"
          search={
            <div className="aws-console-search-wrapper" style={{ position: "relative", zIndex: 1002, width: "100%", maxWidth: topNavSearchWidth }}>
              <Autosuggest
                value={searchValue}
                options={searchOptions}
                filteringType="manual"
                enteredTextLabel={(value) => `Search for ${value}`}
                empty="No matching AWS services"
                selectedAriaLabel="Selected service"
                filteringResultsText={(matchCount) => `${matchCount} service${matchCount === 1 ? "" : "s"} found`}
                placeholder="Search AWS services (e.g., S3, EC2, Lambda)"
                onChange={(e) => setSearchValue(e.detail.value)}
                onSelect={(e) => {
                  const href = e.detail.selectedOption?.value ?? e.detail.value;
                  if (href) {
                    router.push(href);
                    setSearchValue("");
                  }
                }}
                ariaLabel="Search services"
              />
            </div>
          }
          utilities={[
            {
              type: "button",
              text: "Docs",
              iconName: "file",
              href: "https://docs.aws.amazon.com/",
              external: true,
              ariaLabel: "AWS Documentation",
            },
            {
              type: "button",
              text: "Support",
              iconName: "support",
              href: "/support",
              ariaLabel: "AWS Support Center",
            },
            {
              type: "button",
              text: "Terminal",
              ariaLabel: "Open terminal",
              onClick: toggleTerminal,
            },
            {
              type: "menu-dropdown",
              text: selectedRegion.label,
              iconName: "globe",
              items: AWS_REGIONS.map((r) => ({
                id: r.value,
                text: r.label,
              })),
              onItemClick: (e) => {
                const selected = AWS_REGIONS.find((r) => r.value === e.detail.id);
                if (selected) {
                  handleRegionChange(selected);
                }
              },
            },
            {
              type: "button",
              text: provider.toUpperCase(),
              iconName: "status-info",
              ariaLabel: `Provider: ${provider}`,
            },
            {
              type: "button",
              text: "Theme",
              iconName: "settings",
              ariaLabel: `Switch to ${theme === "dark" ? "light" : "dark"} mode`,
              onClick: toggleTheme,
            },
            {
              type: "menu-dropdown",
              text: "Recently Visited",
              iconName: "history",
              items: getRecentlyVisited().map((s) => ({
                id: s.route,
                text: s.service,
                href: s.route,
              })),
              onItemFollow: (e) => {
                if (e.detail.href) {
                  e.preventDefault();
                  router.push(e.detail.href);
                }
              },
            },
            {
              type: "menu-dropdown",
              text: "Notifications",
              iconName: "notification",
              items: notifications.map((n) => ({
                id: n.id,
                text: n.header,
                description: n.content,
              })),
              onItemClick: () => setNotificationsOpen(!notificationsOpen),
            },
            {
              type: "menu-dropdown",
              text: "Console",
              iconName: "settings",
              items: [
                { id: "home", text: "Console home", href: "/" },
                { id: "settings", text: "Provider settings", href: "/settings" },
                { id: "health", text: "Emulator health", href: "/health" },
              ],
              onItemFollow: (e) => {
                if (e.detail.href) {
                  e.preventDefault();
                  router.push(e.detail.href);
                }
              },
            },
          ]}
        />
      </div>
      <AppLayout
        headerSelector="#awsui-top-navigation"
        ariaLabels={{
          navigation: "Service navigation",
          navigationToggle: "Open service navigation",
          navigationClose: "Close service navigation",
        }}
        navigationWidth={isCompactLayout ? 220 : 280}
        navigationCollapsedWidth={54}
        navigationOpen={navigationOpen}
        navigationCloseBehavior="collapse"
        onNavigationChange={({ detail }) => {
          setNavigationOpen(detail.open);
          localStorage.setItem("aws_console_nav_closed", String(!detail.open));
        }}
        breadcrumbs={<BreadcrumbGroup items={breadcrumbs} />}
        notifications={notificationsOpen ? (
          <Flashbar
            items={notifications.map((notification) => ({
              id: notification.id,
              type: notification.type,
              header: notification.header,
              content: notification.content,
              dismissible: notification.dismissible,
              onDismiss: () => setNotifications((current) => current.filter((item) => item.id !== notification.id)),
            }))}
          />
        ) : null}
        navigation={
          <div style={{
            backgroundColor: theme === "dark" ? "#232f3e" : "#f2f3f3",
            height: "100vh",
            borderRight: theme === "dark" ? "1px solid #34495e" : "1px solid #d5dbdb",
            display: "flex",
            flexDirection: "column",
          }}>
            {/* Sticky header */}
            <div style={{
              position: "sticky",
              top: 0,
              zIndex: 10,
              backgroundColor: theme === "dark" ? "#232f3e" : "#f2f3f3",
              padding: "8px 16px",
              borderBottom: theme === "dark" ? "1px solid #34495e" : "1px solid #d5dbdb",
              flexShrink: 0,
            }}>
              <Link
                href="/"
                style={{
                  color: theme === "dark" ? "#d5dbdb" : "#232f3e",
                  textDecoration: "none",
                  fontWeight: 700,
                  fontSize: "22px",
                  letterSpacing: "0.5px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
                aria-label="AWS Services Home"
              >
                <Image
                  src={theme === "dark" ? "/icons/Architecture-Group/AWS-Cloud-logo_32_Dark.svg" : "/icons/Architecture-Group/AWS-Cloud-logo_32.svg"}
                  alt="AWS"
                  width={28}
                  height={28}
                />
                <span>AWS Services</span>
              </Link>
            </div>

            {/* Scrollable services */}
            <div style={{
              overflowY: "auto",
              overflowX: "hidden",
              flex: 1,
              padding: "8px 4px",
            }}>
              <SideNavigation
                activeHref={pathname}
                collapsed={!navigationOpen}
                header={undefined}
                items={[
                  // Favorites section (persisted via Zustand store)
                  ...(mounted && favorites.length > 0 ? [
                    {
                      type: "expandable-link-group" as const,
                      text: "Favorites",
                      defaultExpanded: true,
                      items: favorites.map((fav) => ({
                        type: "link" as const,
                        text: fav.serviceName,
                        href: fav.serviceHref,
                      })),
                    } as any,
                  ] : []),
                  ...navigationItems.map((item: any) => {
                    if (item.type === "divider") return { type: "divider" };
                    if (item.type === "expandable-link-group") {
                      return {
                        type: "expandable-link-group" as const,
                        text: item.text,
                        defaultExpanded: expandedCategories[item.text] !== false,
                        items: item.items,
                      };
                    }
                    return item;
                  }),
                ]}
                onFollow={(event) => {
                  if (!event.detail.external) {
                    event.preventDefault();
                    router.push(event.detail.href);
                  }
                }}
                onChange={({ detail }) => {
                  const item = detail.item as { text?: string };
                  if (item.text) {
                    setExpandedCategories((current) => ({ ...current, [item.text!]: detail.expanded }));
                  }
                }}
              />
            </div>
          </div>
        }
        content={
          <div className="aws-console-main-shell" style={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 60px)", paddingTop: isCompactLayout ? 16 : 64 }}>
            <div id="main-content" className="aws-console-main-content" aria-label="Main content" role="main" tabIndex={-1} style={{ outline: "none", flex: 1, width: "100%", overflowX: "hidden" }}>{children}</div>
          </div>
        }
        splitPanel={terminalOpen ? (
          <SplitPanel header="Terminal">
            <div
              ref={terminalRef}
              style={{ height: "100%", padding: 10 }}
            />
          </SplitPanel>
        ) : undefined}
        splitPanelOpen={terminalOpen || false}
        onSplitPanelToggle={(event: any) => {
          if (event && event.detail) {
            setTerminalOpen(event.detail.open);
            localStorage.setItem("terminal_open", String(event.detail.open));
          }
        }}
        toolsHide={true}
      />

      {/* Global Footer */}
      <footer
        className="aws-console-shell-footer"
        style={{
          padding: isCompactLayout ? "12px 16px" : "16px 24px",
          backgroundColor: "var(--awsui-color-background-container-header)",
          borderTop: "1px solid var(--awsui-color-border-divider-default)",
          fontSize: "12px",
          color: "var(--awsui-color-text-body-secondary)",
          display: "flex",
          alignItems: isCompactLayout ? "flex-start" : "center",
          justifyContent: "space-between",
          flexDirection: isCompactLayout ? "column" : "row",
          gap: isCompactLayout ? "8px" : 0,
        }}
        aria-label="Footer"
      >
        <div style={{ lineHeight: 1.5 }}>
          © 2008-2026 Amazon Web Services, Inc. or its affiliates. All rights reserved.
          <span style={{ marginLeft: 16 }}>|</span>
          <a href="/privacy" style={{ marginLeft: 16, color: "var(--awsui-color-text-link-default)", textDecoration: "none" }}>Privacy</a>
          <a href="/legal" style={{ marginLeft: 8, color: "var(--awsui-color-text-link-default)", textDecoration: "none" }}>Legal</a>
          <a href="/communications" style={{ marginLeft: 8, color: "var(--awsui-color-text-link-default)", textDecoration: "none" }}>Communications Preferences</a>
        </div>
        <div>
          Console v2.45.1 | Build 2026.09.01 | Active Backend: {provider.toUpperCase()}
        </div>
      </footer>
    </>
  );
}
