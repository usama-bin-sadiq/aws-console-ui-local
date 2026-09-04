"use client";

import React from "react";
import Widget from "./Widget";
import Box from "@cloudscape-design/components/box";
import Link from "@cloudscape-design/components/link";

export default function CostUsageWidget({
  widgetId = "cost-usage",
  isCustomizing,
  onResize,
  onRemove,
}: {
  widgetId?: string;
  isCustomizing?: boolean;
  onResize?: (widgetId: string, newSize: "regular" | "extended") => void;
  onRemove?: (widgetId: string) => void;
}) {
  return (
    <Widget
      id="cost-usage"
      widgetId={widgetId}
      title="Cost and usage"
      isCustomizing={isCustomizing}
      onResize={onResize}
      onRemove={onRemove}
      actions={
        <Link fontSize="body-s" href="/billing">
          View details
        </Link>
      }
    >
      <Box color="text-body-secondary">
        Billing and cost data are not provided by the local emulator. No cost values are displayed.
      </Box>
    </Widget>
  );
}
