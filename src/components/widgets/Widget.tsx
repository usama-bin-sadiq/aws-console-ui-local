"use client";

import React, { useState } from "react";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import Button from "@cloudscape-design/components/button";
import ButtonDropdown from "@cloudscape-design/components/button-dropdown";

export interface WidgetProps {
  id: string;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  size?: "regular" | "extended";
  onResize?: (size: "regular" | "extended") => void;
  onRemove?: () => void;
  variant?: "default" | "stacked";
}

export default function Widget({
  id,
  title,
  children,
  actions,
  size = "regular",
  onResize,
  onRemove,
  variant = "default",
}: WidgetProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        height: "100%",
        minHeight: size === "extended" ? "400px" : "300px",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Container
        header={
          <Header
            variant="h2"
            actions={
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                {actions}
                {(onResize || onRemove) && (
                  <ButtonDropdown
                    items={[
                      ...(onResize
                        ? [
                            {
                              id: "regular",
                              text: "Regular view",
                              disabled: size === "regular",
                            },
                            {
                              id: "extended",
                              text: "Extended view",
                              disabled: size === "extended",
                            },
                            { id: "divider-1", itemType: "divider" as const },
                          ]
                        : []),
                      ...(onRemove
                        ? [
                            {
                              id: "remove",
                              text: "Remove from view",
                            },
                          ]
                        : []),
                    ]}
                    onItemClick={(e) => {
                      if (e.detail.id === "regular" || e.detail.id === "extended") {
                        onResize?.(e.detail.id as "regular" | "extended");
                      } else if (e.detail.id === "remove") {
                        onRemove?.();
                      }
                    }}
                    variant="icon"
                    ariaLabel="Widget settings"
                  />
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
