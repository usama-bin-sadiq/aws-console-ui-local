"use client";

import React, { useState } from "react";
import Grid from "@cloudscape-design/components/grid";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";
import Box from "@cloudscape-design/components/box";
import Header from "@cloudscape-design/components/header";

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
  const [widgetSizes, setWidgetSizes] = useState<Record<string, "regular" | "extended">>({});

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

  function handleRemove(widgetId: string) {
    // Optimistically remove from order
    setOrder((prev) => prev.filter((id) => id !== widgetId));
    // Persist to API
    fetch("/api/widgets", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ widgetId, updates: { visible: 0 } }),
    }).catch(() => {});
  }

  function handleResize(widgetId: string, newSize: "regular" | "extended") {
    setWidgetSizes((prev) => ({ ...prev, [widgetId]: newSize }));
  }

  function handleRestore(widgetId: string) {
    setOrder((prev) => (prev.includes(widgetId) ? prev : [...prev, widgetId]));
    fetch("/api/widgets", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ widgetId, updates: { visible: 1 } }),
    }).catch(() => {});
  }

  // Build a map for quick lookup
  const widgetMap = new Map<string, React.ReactNode>(
    widgets.map((w) => [w.id, w.node])
  );

  // Ordered widget IDs filtered to only those present in the current widgets prop
  const orderedIds = order.filter((id) => widgetMap.has(id));

  // Widgets known but not currently in order (i.e., hidden/removed)
  const hiddenWidgetIds = widgets.map((w) => w.id).filter((id) => !order.includes(id));

  // Clone each widget node to inject isCustomizing, widgetId, onResize props
  function injectWidgetProps(widgetId: string, node: React.ReactNode): React.ReactNode {
    if (!React.isValidElement(node)) return node;
    return React.cloneElement(node as React.ReactElement<Record<string, unknown>>, {
      isCustomizing,
      widgetId,
      onResize: handleResize,
    });
  }

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
            variant={isCustomizing ? "primary" : "normal"}
          >
            {isCustomizing ? "Done" : "Customize"}
          </Button>
        </div>
      </Box>

      <Box padding={{ horizontal: "l", bottom: "l" }}>
        <Grid
          gridDefinition={orderedIds.map((widgetId) => ({
            colspan: {
              default: 12,
              xs: 12,
              s: 12,
              m: widgetSizes[widgetId] === "extended" ? 12 : 6,
              l: widgetSizes[widgetId] === "extended" ? 12 : 6,
              xl: widgetSizes[widgetId] === "extended" ? 12 : 6,
            },
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
                cursor: isCustomizing ? "grab" : "default",
                height: "100%",
                position: "relative",
              }}
            >
              {isCustomizing && (
                <div
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    zIndex: 10,
                    display: "flex",
                    gap: "4px",
                  }}
                >
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(widgetId);
                    }}
                    iconName="remove"
                    variant="icon"
                    ariaLabel="Remove widget"
                    formAction="none"
                  />
                </div>
              )}
              {injectWidgetProps(widgetId, widgetMap.get(widgetId))}
            </div>
          ))}
        </Grid>

        {/* Restore hidden widgets panel */}
        {isCustomizing && hiddenWidgetIds.length > 0 && (
          <Box padding={{ top: "m" }}>
            <Header variant="h3">Hidden widgets</Header>
            <SpaceBetween direction="horizontal" size="xs">
              {hiddenWidgetIds.map((id) => (
                <Button
                  key={id}
                  onClick={() => handleRestore(id)}
                  formAction="none"
                >
                  Restore: {id}
                </Button>
              ))}
            </SpaceBetween>
          </Box>
        )}
      </Box>
    </SpaceBetween>
  );
}
