"use client";

import React, { useState } from "react";
import Grid from "@cloudscape-design/components/grid";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";
import Box from "@cloudscape-design/components/box";

export interface WidgetItem {
  id: string;
  node: React.ReactNode;
}

export interface WidgetContainerProps {
  widgets: WidgetItem[];
  onSettingsClick?: () => void;
}

export default function WidgetContainer({
  widgets,
  onSettingsClick,
}: WidgetContainerProps) {
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [order, setOrder] = useState<string[]>(() => widgets.map((w) => w.id));

  function handleDrop(targetId: string) {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    const newOrder = [...order];
    const fromIndex = newOrder.indexOf(draggedId);
    const toIndex = newOrder.indexOf(targetId);

    if (fromIndex === -1 || toIndex === -1) {
      setDraggedId(null);
      return;
    }

    // Swap the two positions
    newOrder[fromIndex] = targetId;
    newOrder[toIndex] = draggedId;

    setOrder(newOrder);
    setDraggedId(null);

    // Persist position updates to the API (fire-and-forget)
    newOrder.forEach((widgetId, index) => {
      const posX = index % 2;
      const posY = Math.floor(index / 2);
      fetch("/api/widgets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          widgetId,
          updates: { position_x: posX, position_y: posY },
        }),
      }).catch(() => {});
    });
  }

  // Build a map for quick lookup
  const widgetMap = new Map<string, React.ReactNode>(
    widgets.map((w) => [w.id, w.node])
  );

  // Ordered widget IDs filtered to only those present in the current widgets prop
  const orderedIds = order.filter((id) => widgetMap.has(id));

  return (
    <SpaceBetween size="l">
      <Box padding={{ top: "m", horizontal: "l" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "28px",
                fontWeight: 700,
                margin: 0,
                color: "var(--awsui-color-text-heading-default)",
              }}
            >
              AWS Management Console
            </h1>
            <p
              style={{
                fontSize: "14px",
                color: "var(--awsui-color-text-body-secondary)",
                margin: "4px 0 0 0",
              }}
            >
              Welcome back. Customize this page to show the information that
              matters most to you.
            </p>
          </div>
          <Button
            onClick={() => {
              setIsCustomizing(!isCustomizing);
              onSettingsClick?.();
            }}
            iconName="settings"
          >
            Customize
          </Button>
        </div>
      </Box>

      <Box padding={{ horizontal: "l", bottom: "l" }}>
        <Grid
          gridDefinition={orderedIds.map(() => ({
            colspan: { default: 12, xs: 12, s: 12, m: 6, l: 6, xl: 6 },
          }))}
        >
          {orderedIds.map((widgetId) => (
            <div
              key={widgetId}
              draggable
              onDragStart={() => setDraggedId(widgetId)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(widgetId)}
              style={{
                opacity: draggedId === widgetId ? 0.5 : 1,
                cursor: "grab",
                height: "100%",
              }}
            >
              {widgetMap.get(widgetId)}
            </div>
          ))}
        </Grid>
      </Box>
    </SpaceBetween>
  );
}
