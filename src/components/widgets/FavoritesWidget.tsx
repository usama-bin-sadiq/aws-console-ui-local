"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Widget from "./Widget";
import Cards from "@cloudscape-design/components/cards";
import Box from "@cloudscape-design/components/box";
import Link from "@cloudscape-design/components/link";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";
import Header from "@cloudscape-design/components/header";
import { Favorite } from "@/lib/db";
import { SERVICE_ICONS } from "@/constants/service-icons";
import { ResourceIcon } from "@/components/ui/ResourceIcon";

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
        <Cards
          cardDefinition={{
            header: (item: Favorite) => (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ResourceIcon service={item.service_href} size="small" />
                <Link
                  fontSize="body-m"
                  href={item.service_href}
                  onFollow={(e) => {
                    e.preventDefault();
                    handleServiceClick(item.service_href);
                  }}
                >
                  {item.service_name}
                </Link>
              </div>
            ),
            sections: [],
          }}
          items={favorites.slice(0, 10)}
          loadingText="Loading favorites..."
          empty="No favorites"
          cardsPerRow={[{ cards: 1 }, { minWidth: 400, cards: 2 }, { minWidth: 600, cards: 3 }]}
        />
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
