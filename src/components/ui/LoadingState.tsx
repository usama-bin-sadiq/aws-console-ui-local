import React from "react";
import Spinner from "@cloudscape-design/components/spinner";
import Box from "@cloudscape-design/components/box";
import SpaceBetween from "@cloudscape-design/components/space-between";

interface LoadingStateProps {
  message?: string;
  type?: "spinner" | "skeleton";
  count?: number;
}

/**
 * LoadingState — matches real AWS console loading.
 *
 * Skeleton type renders shimmering placeholder blocks (the AWS pattern) instead
 * of a bare spinner, so the page holds its shape while data loads. Uses the
 * shell's theme CSS variables (--bg, --border2, --accent) so it works in both
 * light and dark modes without raw hex values.
 */
export function LoadingState({
  message = "Loading…",
  type = "spinner",
  count = 3,
}: LoadingStateProps) {
  if (type === "skeleton") {
    return (
      <SpaceBetween direction="vertical" size="m">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="aws-loading-skeleton"
            style={{ height: i % 2 === 0 ? 48 : 32, borderRadius: 4 }}
          />
        ))}
      </SpaceBetween>
    );
  }

  return (
    <Box textAlign="center" padding={{ vertical: "xxl" }}>
      <SpaceBetween direction="vertical" size="s" alignItems="center">
        <Spinner size="large" />
        <Box color="text-body-secondary">{message}</Box>
      </SpaceBetween>
    </Box>
  );
}
