"use client";

import React, { useState, useEffect } from "react";
import Grid from "@cloudscape-design/components/grid";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";

export interface WidgetItem {
  id: string;
  node: React.ReactNode;
}

interface HiddenWidget {
  widget_id: string;
  title?: string;
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
  const [hiddenWidgets, setHiddenWidgets] = useState<HiddenWidget[]>([]);
  const [widgetSizes, setWidgetSizes] = useState<Record<string, "regular" | "extended">>({});

  // Fetch hidden widgets when entering customization mode
  useEffect(() => {
    if (!isCustomizing) return;
    fetch("/api/widgets")
      .then((res) => res.json())
      .then((data) => {
        const allWidgets: Array<{ widget_id: string; visible: number; title?: string }> =
          data.widgets ?? [];
        const hidden = allWidgets.filter((w) => w.visible === 0);
        setHiddenWidgets(hidden);
      })
      .catch(() => {});
  }, [isCustomizing]);

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
    setOrder((prev) => prev.filter((id) => id !== widgetId));
  }

  function handleResize(widgetId: string, newSize: "regular" | "extended") {
    setWidgetSizes((prev) => ({ ...prev, [widgetId]: newSize }));
  }

  function handleRestore(widgetId: string) {
    fetch("/api/widgets", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ widgetId, updates: { visible: 1 } }),
    }).catch(() => {});
    setHiddenWidgets((prev) => prev.filter((w) => w.widget_id !== widgetId));
    // Add back to order if not already present
    setOrder((prev) => (prev.includes(widgetId) ? prev : [...prev, widgetId]));
  }

  // Build a map for quick lookup
  const widgetMap = new Map<string, React.ReactNode>(
    widgets.map((w) => [w.id, w.node])
  );

  // Ordered widget IDs filtered to only those present in the current widgets prop
  const orderedIds = order.filter((id) => widgetMap.has(id));

  // Clone each widget node to inject isCustomizing, widgetId, onResize, onRemove props
  function injectWidgetProps(widgetId: string, node: React.ReactNode): React.ReactNode {
    if (!React.isValidElement(node)) return node;
    return React.cloneElement(node as React.ReactElement<Record<string, unknown>>, {
      isCustomizing,
      widgetId,
      onResize: handleResize,
      onRemove: handleRemove,
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

      {/* Restore hidden widgets panel */}
      {isCustomizing && hiddenWidgets.length > 0 && (
        <Box padding={{ horizontal: "l" }}>
          <SpaceBetween size="s">
            <Alert type="info" header="Hidden widgets">
              <SpaceBetween size="xs">
                {hiddenWidgets.map((hw) => (
                  <div
                    key={hw.widget_id}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  >
                    <span>{hw.title ?? hw.widget_id}</span>
                    <Button
                      variant="link"
                      onClick={() => handleRestore(hw.widget_id)}
                    >
                      Restore
                    </Button>
                  </div>
                ))}
              </SpaceBetween>
            </Alert>
          </SpaceBetween>
        </Box>
      )}

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
              }}
            >
              {injectWidgetProps(widgetId, widgetMap.get(widgetId))}
            </div>
          ))}
        </Grid>
      </Box>
    </SpaceBetween>
  );
}
