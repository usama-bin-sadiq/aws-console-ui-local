import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ALL_SERVICES } from "@/constants/navigation";
import { SERVICE_REGISTRY } from "@/constants/service-compatibility";
import {
  AdapterMode,
  EmulatorHealthStatus,
  findServiceCompatibility,
  getServiceAvailability,
} from "@/constants/service-compatibility";
import { SERVICE_CATEGORY_MAP, SERVICE_DESCRIPTIONS } from "@/constants/service-descriptions";

interface SearchResult {
  text: string;
  href: string;
  category: string;
  description: string;
}

export interface GlobalSearchOptions {
  /**
   * When false the hook only resolves the query and stops owning dropdown and
   * keyboard behaviour, because a custom panel (the AWS search results panel)
   * drives interaction instead.
   */
  manageDropdown?: boolean;
}

export function useGlobalSearch(
  mode: AdapterMode | "unknown" = AdapterMode.LOCALSTACK,
  healthStatus: EmulatorHealthStatus = "checking",
  healthServices: Record<string, unknown> = {},
  options: GlobalSearchOptions = {},
) {
  const manageDropdown = options.manageDropdown ?? true;
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    const recent = localStorage.getItem("aws_recent_searches");
    if (recent) {
      try {
        setRecentSearches(JSON.parse(recent));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  useEffect(() => {
    if (searchValue.length >= 2) {
      const results: SearchResult[] = [];

      ALL_SERVICES.forEach((service: any) => {
        const compatibility = findServiceCompatibility(service.href);
        const available = compatibility
          ? getServiceAvailability(compatibility, mode, healthStatus, healthServices).enabled
          : false;
        if (available && service.text?.toLowerCase().includes(searchValue.toLowerCase())) {
          results.push({
            text: service.text,
            href: service.href,
            category: SERVICE_CATEGORY_MAP[service.href] || "Other",
            description: SERVICE_DESCRIPTIONS[service.text] || "",
          });
        }
      });

      // Also search SERVICE_REGISTRY for broader coverage
      SERVICE_REGISTRY.forEach((svc) => {
        const available = getServiceAvailability(svc, mode, healthStatus, healthServices).enabled;
        if (available && svc.serviceName.toLowerCase().includes(searchValue.toLowerCase())) {
          const existing = results.find((r) => r.text === svc.serviceName);
          if (!existing) {
            results.push({
              text: svc.serviceName,
              href: `/${svc.routeDir}`,
              category: SERVICE_CATEGORY_MAP[`/${svc.routeDir}`] || "Service",
              description: svc.commonDifferentNote || svc.serviceName,
            });
          }
        }
      });

      setSearchResults(results.slice(0, 20));
      if (manageDropdown) {
        setShowDropdown(true);
        setSelectedIndex(0);
      }
    } else {
      if (manageDropdown) setShowDropdown(false);
      setSearchResults([]);
    }
  }, [searchValue, mode, healthStatus, healthServices, manageDropdown]);

  useEffect(() => {
    if (!manageDropdown) return;
    if (!showDropdown || searchResults.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, searchResults.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (searchResults[selectedIndex]) {
            navigateToService(searchResults[selectedIndex]);
          }
          break;
        case "Escape":
          setShowDropdown(false);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showDropdown, selectedIndex, searchResults, manageDropdown]);

  function navigateToService(result: SearchResult): void {
    const updated = [result.text, ...recentSearches.filter((s) => s !== result.text)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem("aws_recent_searches", JSON.stringify(updated));

    router.push(result.href);
    setShowDropdown(false);
    setSearchValue("");
  }

  return {
    searchValue,
    setSearchValue,
    searchResults,
    showDropdown,
    setShowDropdown,
    selectedIndex,
    navigateToService,
    recentSearches,
  };
}

export function groupByCategory(results: SearchResult[]): Record<string, SearchResult[]> {
  const grouped: Record<string, SearchResult[]> = {};

  results.forEach((result) => {
    if (!grouped[result.category]) {
      grouped[result.category] = [];
    }
    grouped[result.category].push(result);
  });

  return grouped;
}
