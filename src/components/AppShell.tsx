"use client";

import React, { useEffect, useState, useRef } from "react";
import AppLayout from "@cloudscape-design/components/app-layout";
import SideNavigation from "@cloudscape-design/components/side-navigation";
import TopNavigation from "@cloudscape-design/components/top-navigation";
import BreadcrumbGroup from "@cloudscape-design/components/breadcrumb-group";
import Input from "@cloudscape-design/components/input";
import SplitPanel from "@cloudscape-design/components/split-panel";
import { Mode, applyMode } from "@cloudscape-design/global-styles";
import { usePathname, useRouter } from "next/navigation";
import { useSettingsStore } from "@/stores/settings";
import { AWS_REGIONS } from "@/constants/regions";
import { NAVIGATION_ITEMS, ALL_SERVICES } from "@/constants/navigation";
import { getProviderBadgeColor } from "@/utils/theme";
import type { Terminal } from "xterm";
import type { FitAddon } from "@xterm/addon-fit";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { region, setRegion, theme, setTheme, provider, setProvider } = useSettingsStore();
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [groupedResults, setGroupedResults] = useState<Record<string, any[]>>({});
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstance = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);

  // Apply theme
  useEffect(() => {
    applyMode(theme as Mode);
  }, [theme]);

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

  // Search handling with grouping by category
  useEffect(() => {
    if (searchValue.length >= 3) {
      const results = ALL_SERVICES.filter((service: any) =>
        service.text?.toLowerCase().includes(searchValue.toLowerCase())
      );
      
      // Group results by category
      const grouped: Record<string, any[]> = {};
      NAVIGATION_ITEMS.forEach((item: any) => {
        if (item.type === "expandable-link-group" && item.items) {
          const matchingServices = item.items.filter((svc: any) =>
            results.some((r: any) => r.href === svc.href)
          );
          if (matchingServices.length > 0) {
            grouped[item.text] = matchingServices;
          }
        }
      });
      
      setGroupedResults(grouped);
      setSearchResults(results.slice(0, 10));
      setShowSearch(true);
      setSelectedIndex(0);
    } else {
      setShowSearch(false);
      setSearchResults([]);
      setGroupedResults({});
    }
  }, [searchValue]);

  // Load expanded categories from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("nav_expanded");
    if (saved) {
      try {
        setExpandedCategories(JSON.parse(saved));
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);

  // Save expanded categories to localStorage
  const handleCategoryToggle = (categoryText: string, expanded: boolean) => {
    const newExpanded = { ...expandedCategories, [categoryText]: expanded };
    setExpandedCategories(newExpanded);
    localStorage.setItem("nav_expanded", JSON.stringify(newExpanded));
  };

  // Keyboard navigation for search
  useEffect(() => {
    if (!showSearch) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, searchResults.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (searchResults[selectedIndex]) {
            router.push(searchResults[selectedIndex].href);
            setShowSearch(false);
            setSearchValue("");
          }
          break;
        case 'Escape':
          setShowSearch(false);
          setSearchValue("");
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearch, selectedIndex, searchResults, router]);

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
            theme: {
              background: theme === "dark" ? "#000000" : "#ffffff",
              foreground: theme === "dark" ? "#ffffff" : "#000000",
            },
          });
          
          const fit = new FitAddon();
          fitAddon.current = fit;
          term.loadAddon(fit);
          term.open(terminalRef.current!);
          fit.fit();
          
          term.writeln("AWS Console Terminal");
          term.writeln("Connected to local environment");
          term.write("$ ");

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
  const providerBadgeColor = getProviderBadgeColor(provider);

  return (
    <>
      <TopNavigation
        identity={{
          href: "/",
          title: "AWS Console",
          logo: { src: "/aws-logo.svg", alt: "AWS" },
        }}
        search={
          <div style={{ position: "relative", width: 300 }}>
            <Input
              type="search"
              placeholder="Search services..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.detail.value)}
              onBlur={() => setTimeout(() => setShowSearch(false), 200)}
            />
            {showSearch && Object.keys(groupedResults).length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  backgroundColor: "var(--awsui-color-background-dropdown-item-default)",
                  border: "1px solid var(--awsui-color-border-dropdown-container)",
                  borderRadius: "var(--awsui-border-radius-dropdown)",
                  marginTop: 4,
                  zIndex: 9999,
                  maxHeight: 400,
                  overflow: "auto",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                }}
              >
                {Object.entries(groupedResults).map(([category, services]) => (
                  <div key={category}>
                    <div
                      style={{
                        padding: "8px 12px",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "var(--awsui-color-text-label)",
                        borderBottom: "1px solid var(--awsui-color-border-divider-default)",
                        backgroundColor: "var(--awsui-color-background-container-header)",
                      }}
                    >
                      {category}
                    </div>
                    {services.map((service: any, idx: number) => {
                      const globalIndex = searchResults.findIndex((r: any) => r.href === service.href);
                      return (
                        <div
                          key={service.href}
                          style={{
                            padding: "10px 12px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            backgroundColor:
                              globalIndex === selectedIndex
                                ? "var(--awsui-color-background-dropdown-item-hover)"
                                : "transparent",
                            color: "var(--awsui-color-text-body-default)",
                          }}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          onClick={() => {
                            router.push(service.href);
                            setSearchValue("");
                            setShowSearch(false);
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "14px" }}>
                              Go to {service.text}
                            </div>
                            <div
                              style={{
                                fontSize: "12px",
                                color: "var(--awsui-color-text-body-secondary)",
                              }}
                            >
                              {category}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        }
        utilities={[
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
            text: provider,
            iconName: provider === "unknown" ? "status-warning" : "status-positive",
          },
          {
            type: "button",
            iconName: theme === "dark" ? "view-full" : "view-horizontal",
            text: "",
            onClick: toggleTheme,
          },
          {
            type: "menu-dropdown",
            text: "Account",
            iconName: "user-profile",
            items: [
              { id: "profile", text: "Profile" },
              { id: "settings", text: "Settings" },
              { id: "signout", text: "Sign out" },
            ],
          },
        ]}
      />
      <AppLayout
        headerSelector="#awsui-top-navigation"
        breadcrumbs={<BreadcrumbGroup items={breadcrumbs} />}
        navigation={
          <SideNavigation
            activeHref={pathname}
            items={NAVIGATION_ITEMS.map((item: any) => {
              if (item.type === "divider") return { type: "divider" };
              if (item.type === "expandable-link-group") {
                return {
                  type: "expandable-link-group",
                  text: item.text,
                  defaultExpanded: expandedCategories[item.text] !== false,
                  items: item.items,
                };
              }
              return item;
            })}
            onFollow={(event) => {
              if (!event.detail.external) {
                event.preventDefault();
                router.push(event.detail.href);
              }
            }}
          />
        }
        content={children}
        splitPanel={
          terminalOpen ? (
            <SplitPanel header="Terminal">
              <div
                ref={terminalRef}
                style={{ height: "100%", padding: 10 }}
              />
            </SplitPanel>
          ) : undefined
        }
        splitPanelOpen={terminalOpen}
        onSplitPanelToggle={({ detail }) => {
          setTerminalOpen(detail.open);
          localStorage.setItem("terminal_open", String(detail.open));
        }}
        toolsHide={true}
      />
    </>
  );
}
