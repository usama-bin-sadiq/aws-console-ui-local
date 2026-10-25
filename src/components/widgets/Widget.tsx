"use client";

import { apiFetch } from "@/lib/api-client";
import React, { useState } from "react";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";

export interface WidgetProps {
  id: string;
  widgetId: string;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  variant?: "default" | "stacked";
  isCustomizing?: boolean;
  onResize?: (widgetId: string, newSize: "regular" | "extended") => void;
  onRemove?: (widgetId: string) => void;
}

export default function Widget({
  id,
  widgetId,
  title,
  children,
  actions,
  variant = "default",
  isCustomizing = false,
  onResize,
  onRemove,
}: WidgetProps) {
  const [size, setSize] = useState<"regular" | "extended">("regular");

  function handleResize() {
    const newSize = size === "regular" ? "extended" : "regular";
    setSize(newSize);
    onResize?.(widgetId, newSize);
    apiFetch("/api/widgets", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ widgetId, updates: { width: newSize === "extended" ? 2 : 1 } }),
    }).catch(() => {});
  }

  function handleRemove() {
    onRemove?.(widgetId);
    apiFetch("/api/widgets", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ widgetId, updates: { visible: 0 } }),
    }).catch(() => {});
  }

  return (
    <div
      style={{
        height: "100%",
        minHeight: size === "extended" ? "400px" : "300px",
      }}
    >
      <Container
        header={
          <Header
            variant="h2"
            actions={
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                {actions}
                {isCustomizing && (
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button
                      variant="icon"
                      iconName={size === "extended" ? "shrink" : "expand"}
                      ariaLabel={size === "extended" ? "Shrink widget" : "Expand widget"}
                      onClick={handleResize}
                    />
                    <Button
                      variant="icon"
                      iconName="close"
                      ariaLabel="Remove widget"
                      onClick={handleRemove}
                    />
                  </SpaceBetween>
                )}
              </div>
            }
          >
            {title}
          </Header>
        }
        variant={variant}
      >
        {children}
      </Container>
    </div>
  );
}
