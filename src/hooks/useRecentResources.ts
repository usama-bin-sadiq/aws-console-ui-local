import { useEffect, useState } from "react";

interface RecentResource {
  service: string;
  resource: {
    id: string;
    name: string;
    type: string;
  };
  timestamp: number;
}

export function useRecentResources() {
  const [recentResources, setRecentResources] = useState<RecentResource[]>([]);

  // Load recent resources from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("aws_recent_resources");
    if (saved) {
      try {
        setRecentResources(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse recent resources", e);
      }
    }
  }, []);

  const addRecentResource = (
    service: string,
    resource: { id: string; name: string; type: string }
  ) => {
    const recent = JSON.parse(
      localStorage.getItem("aws_recent_resources") || "[]"
    );
    const newRecent = [
      { service, resource, timestamp: Date.now() },
      ...recent.filter((r: RecentResource) => r.resource.id !== resource.id),
    ].slice(0, 10);
    localStorage.setItem("aws_recent_resources", JSON.stringify(newRecent));
    setRecentResources(newRecent);
  };

  const getRecentResources = () => {
    return recentResources;
  };

  return { addRecentResource, getRecentResources, recentResources };
}
