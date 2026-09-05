"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Widget from "./Widget";
import Box from "@cloudscape-design/components/box";
import Link from "@cloudscape-design/components/link";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";
import { Favorite } from "@/lib/db";

export default function FavoritesWidget({
  widgetId = "favorites",
  isCustomizing,
  onResize,
  onRemove,
}: {
  widgetId?: string;
  isCustomizing?: boolean;
  onResize?: (widgetId: string, newSize: "regular" | "extended") => void;
  onRemove?: (widgetId: string) => void;
}) {
  const router = useRouter();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const response = await fetch("/api/favorites");
        const data = await response.json();
        setFavorites(data.favorites || []);
      } catch (error) {
        console.error("Failed to fetch favorites:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  const handleServiceClick = (href: string) => {
    router.push(href);
  };

  return (
    <Widget
      id="favorites"
      widgetId={widgetId}
      title="Favorites"
      isCustomizing={isCustomizing}
      onResize={onResize}
      onRemove={onRemove}
      actions={
        favorites.length > 0 && (
          <Link fontSize="body-s" href="#">
            Edit
          </Link>
        )
      }
    >
      {loading ? (
        <Box textAlign="center" padding="l">
          Loading favorites...
        </Box>
      ) : favorites.length === 0 ? (
        <Box textAlign="center" padding="l">
          <SpaceBetween size="m">
            <div
              style={{
                fontSize: "14px",
                color: "var(--awsui-color-text-body-secondary)",
              }}
            >
              You haven&apos;t added any favorites yet.
            </div>
            <div>
              <Button variant="primary">Browse services</Button>
            </div>
          </SpaceBetween>
        </Box>
      ) : (
        <SpaceBetween size="xs">
          {favorites.slice(0, 10).map((fav) => (
            <div
              key={fav.id}
              onClick={() => handleServiceClick(fav.service_href)}
              style={{
                padding: "12px",
                borderRadius: "8px",
                cursor: "pointer",
                border: "1px solid var(--awsui-color-border-container)",
                backgroundColor: "var(--awsui-color-background-container-content)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "var(--awsui-color-background-container-header)";
                e.currentTarget.style.borderColor =
                  "var(--awsui-color-border-item-selected)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  "var(--awsui-color-background-container-content)";
                e.currentTarget.style.borderColor =
                  "var(--awsui-color-border-container)";
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "4px",
                    backgroundColor: "var(--awsui-color-background-badge-icon)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: "18px" }}>📦</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "var(--awsui-color-text-link-default)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {fav.service_name}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </SpaceBetween>
      )}

      {favorites.length > 0 && (
        <Box textAlign="center" margin={{ top: "m" }}>
          <Link fontSize="body-s" href="#">
            View all favorites
          </Link>
        </Box>
      )}
    </Widget>
  );
}
