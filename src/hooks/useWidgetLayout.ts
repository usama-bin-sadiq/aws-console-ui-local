"use client";

import { useState, useEffect, useCallback } from "react";
import { WidgetConfig } from "@/lib/db";

export interface WidgetLayoutItem {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  visible: boolean;
}

export function useWidgetLayout(userId: string = "default") {
  const [widgets, setWidgets] = useState<WidgetLayoutItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWidgets = useCallback(async () => {
    try {
      const response = await fetch(`/api/widgets?userId=${userId}`);
      const data = await response.json();
      
      const layoutItems: WidgetLayoutItem[] = data.widgets.map((w: WidgetConfig) => ({
        id: w.widget_id,
        x: w.position_x,
        y: w.position_y,
        w: w.width,
        h: w.height,
        visible: w.visible === 1,
      }));
      
      setWidgets(layoutItems);
    } catch (error) {
      console.error("Failed to load widgets:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadWidgets();
  }, [loadWidgets]);

  const updateWidget = useCallback(
    async (widgetId: string, updates: Partial<Omit<WidgetLayoutItem, "id">>) => {
      try {
        await fetch("/api/widgets", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            widgetId,
            updates: {
              position_x: updates.x,
              position_y: updates.y,
              width: updates.w,
              height: updates.h,
              visible: updates.visible ? 1 : 0,
            },
          }),
        });

        setWidgets((prev) =>
          prev.map((w) => (w.id === widgetId ? { ...w, ...updates } : w))
        );
      } catch (error) {
        console.error("Failed to update widget:", error);
      }
    },
    [userId]
  );

  const resetLayout = useCallback(async () => {
    try {
      const response = await fetch("/api/widgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action: "reset",
        }),
      });
      const data = await response.json();
      
      const layoutItems: WidgetLayoutItem[] = data.widgets.map((w: WidgetConfig) => ({
        id: w.widget_id,
        x: w.position_x,
        y: w.position_y,
        w: w.width,
        h: w.height,
        visible: w.visible === 1,
      }));
      
      setWidgets(layoutItems);
    } catch (error) {
      console.error("Failed to reset layout:", error);
    }
  }, [userId]);

  const toggleWidgetVisibility = useCallback(
    async (widgetId: string) => {
      const widget = widgets.find((w) => w.id === widgetId);
      if (widget) {
        await updateWidget(widgetId, { visible: !widget.visible });
      }
    },
    [widgets, updateWidget]
  );

  const resizeWidget = useCallback(
    async (widgetId: string, size: "regular" | "extended") => {
      const height = size === "extended" ? 2 : 1;
      await updateWidget(widgetId, { h: height });
    },
    [updateWidget]
  );

  return {
    widgets,
    loading,
    updateWidget,
    resetLayout,
    toggleWidgetVisibility,
    resizeWidget,
  };
}
