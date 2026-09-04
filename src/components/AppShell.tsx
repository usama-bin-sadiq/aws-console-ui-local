"use client";

import React, { useEffect, useState, useRef } from "react";
import AppLayout from "@cloudscape-design/components/app-layout";
import SideNavigation from "@cloudscape-design/components/side-navigation";
import TopNavigation from "@cloudscape-design/components/top-navigation";
import BreadcrumbGroup from "@cloudscape-design/components/breadcrumb-group";
import Input from "@cloudscape-design/components/input";
import SplitPanel from "@cloudscape-design/components/split-panel";
import Box from "@cloudscape-design/components/box";
import Icon from "@cloudscape-design/components/icon";
import { Mode, applyMode } from "@cloudscape-design/global-styles";
import { usePathname, useRouter } from "next/navigation";
import { useSettingsStore, FavoriteItem } from "@/stores/settings";
import { AWS_REGIONS } from "@/constants/regions";
import { NAVIGATION_ITEMS } from "@/constants/navigation";
import { getRecentlyVisited } from "@/lib/sqlite-adapter";
import { useGlobalSearch, groupByCategory } from "@/hooks/useGlobalSearch";
import type { Terminal } from "xterm";
import type { FitAddon } from "@xterm/addon-fit";
import { Container } from "@cloudscape-design/components";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { region, setRegion, theme, setTheme, provider, setProvider, favorites, addFavorite, removeFavorite, reorderFavorites } = useSettingsStore();
  const { searchValue, setSearchValue, searchResults, showDropdown, setShowDropdown, selectedIndex, navigateToService } = useGlobalSearch();
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: "n1", type: "info" as const, header: "Welcome to AWS Console Emulator", content: "Connected to LocalStack adapter (F-002)", dismissible: true },
    { id: "n2", type: "success" as const, header: "Service Health", content: "All monitored services operational (F-028)", dismissible: false },
  ]);
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstance = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);

  // Apply theme
  useEffect(() => {
    applyMode(theme as Mode);
  }, [theme]);

  // Mount tracking for hydration fix
  useEffect(() => {
    setMounted(true);
  }, []);

  // Health check on mount
  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        if (data.provider) {
          setProvider(data.provider);
        }
      })
      .catch(() => {
        setProvider("unknown");
      });
  }, [setProvider]);

  // Keyboard shortcuts: Ctrl+K opens search, Esc closes dropdown
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          setShowDropdown(true);
        }
      }
      if (e.key === "Escape") {
        setShowDropdown(false);
        setNotificationsOpen(false);
        if (terminalOpen) {
          setTerminalOpen(false);
          localStorage.setItem("terminal_open", "false");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [terminalOpen, setShowDropdown]);

  // Expanded categories are kept open by default for consistent SSR/hydration
  // (localStorage persistence removed to avoid server/client mismatch)

  const handleCategoryToggle = (categoryText: string, expanded: boolean) => {
    setExpandedCategories({ ...expandedCategories, [categoryText]: expanded });
  };

  // Load xterm CSS dynamically
  useEffect(() => {
    if (terminalOpen && typeof window !== "undefined") {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://cdn.jsdelivr.net/npm/xterm@5.3.0/css/xterm.css";
      document.head.appendChild(link);
    }
  }, [terminalOpen]);

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

  const executeCommand = (cmd: string, term: Terminal) => {
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
      // Execute AWS CLI command via API
      fetch("/api/terminal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: trimmed }),
      })
        .then((r) => r.json())
        .then((data) => {
          term.writeln(data.output || "");
        })
        .catch(() => {
          term.writeln("Error executing command");
        });
    } else if (trimmed) {
      term.writeln(`Command not found: ${trimmed}`);
    }
  };

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
        search={
          <div style={{ position: "relative", width: "100%", maxWidth: 420 }}>
            <Input
              type="search"
              placeholder="Search AWS services (e.g., S3, EC2, Lambda)"
              value={searchValue}
              onChange={(e) => setSearchValue(e.detail.value)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              ariaLabel="Search services"
            />
            {/* Reference: Cloudscape Design System — Dropdown container per docs/components/dropdown/ */}
            {showDropdown && searchResults.length > 0 && (
              <Container
                variant="embedded"
                header={
                  <div
                    style={{
                      padding: "8px 16px",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "var(--awsui-color-text-label)",
                      borderBottom: "1px solid var(--awsui-color-border-divider-default)",
                      backgroundColor: "var(--awsui-color-background-container-header)",
                      borderTopLeftRadius: "24px",
                      borderTopRightRadius: "24px",
                    }}
                  >
                    Search Results
                  </div>
                }
                {...{ style: { borderRadius: "24px", overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" } } as any}
              >
                <div style={{ padding: "8px 4px" }}>
                  {Object.entries(groupedSearchResults).map(([category, services]) => (
                    <div key={category}>
                      <Box padding="xs" variant="div">
                        <div style={{ padding: "8px 16px", fontSize: "12px", fontWeight: 700, color: "var(--awsui-color-text-label)", borderBottom: "1px solid var(--awsui-color-border-divider-default)", backgroundColor: "var(--awsui-color-background-container-header)", borderRadius: 4 }}>
                          {category}
                        </div>
                      </Box>
                      {services.map((service, idx) => {
                        const globalIndex = searchResults.findIndex((r) => r.href === service.href);
                        return (
                          <a
                            key={`${category}-${idx}`}
                            href={service.href}
                            onClick={(e) => {
                              e.preventDefault();
                              navigateToService(service);
                            }}
                            style={{
                              display: "flex", alignItems: "center", gap: "12px",
                              padding: "12px 16px", textDecoration: "none",
                              color: "var(--awsui-color-text-body-default)",
                              backgroundColor: globalIndex === selectedIndex ? "var(--awsui-color-background-dropdown-item-hover)" : "transparent",
                              borderBottom: "1px solid var(--awsui-color-border-divider-default)",
                              cursor: "pointer",
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "var(--awsui-color-background-dropdown-item-hover)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = globalIndex === selectedIndex ? "var(--awsui-color-background-dropdown-item-hover)" : "transparent"; }}
                          >
                            <Icon name="search" size="small" />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, marginBottom: "4px" }}>{service.text}</div>
                              <div style={{ fontSize: "12px", color: "var(--awsui-color-text-body-secondary)" }}>{service.description}</div>
                            </div>
                            <Icon name="angle-right-double" size="small" />
                          </a>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </Container>
            )}
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
            onClick: toggleTerminal,
          },
          {
            type: "menu-dropdown",
            text: selectedRegion.label,
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
            ariaLabel: `Provider: ${provider}`,
          },
          {
            type: "button",
            text: theme === "dark" ? "☀️ Light" : "🌙 Dark",
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
            text: "Account",
            iconName: "user-profile",
            items: [
              { id: "profile", text: "Account", href: "/account" },
              { id: "org", text: "Organization", href: "/organizations" },
              { id: "security", text: "Security Credentials", href: "/iam-virtual-mfa" },
              { id: "billing", text: "Billing Dashboard", href: "/billing" },
              { id: "quotas", text: "Service Quotas", href: "/servicequotas/home" },
              { id: "settings", text: "Console Settings", href: "/console/account/v2/home#settings" },
              { id: "signout", text: "Sign Out", href: "/signout" },
            ],
          },
        ]}
      />
      </div>
      <AppLayout
        headerSelector="#awsui-top-navigation"
        navigationWidth={280}
        navigationCollapsedWidth={54}
        breadcrumbs={<BreadcrumbGroup items={breadcrumbs} />}
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
              <a
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
                <img src={theme === "dark" ? "/icons/Architecture-Group/AWS-Cloud-logo_32_Dark.svg" : "/icons/Architecture-Group/AWS-Cloud-logo_32.svg"} alt="AWS" style={{ width: 28, height: 28 }} />
                <span>AWS Services</span>
              </a>
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
                header={undefined}
                style={{ color: theme === "dark" ? "#d5dbdb" : "#232f3e", fontSize: "13px", border: "none" }}
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
              ...NAVIGATION_ITEMS.map((item: any) => {
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
           />
          </div>
          </div>
        }
        content={
          <div style={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 60px)", paddingTop: 64 }}>
            <div id="main-content" aria-label="Main content" role="main" tabIndex={-1} style={{ outline: "none", flex: 1 }}>{children}</div>
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
        style={{
          padding: "16px 24px",
          backgroundColor: "var(--awsui-color-background-container-header)",
          borderTop: "1px solid var(--awsui-color-border-divider-default)",
          fontSize: "12px",
          color: "var(--awsui-color-text-body-secondary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
        aria-label="Footer"
      >
        <div>
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
