import React, { useState } from "react";
import Image from "next/image";
import { SERVICE_ICONS } from "@/constants/service-icons";

interface ResourceIconProps {
  service: string;
  size?: "small" | "medium" | "large";
  showLabel?: boolean;
}

const SIZE_MAP = {
  small: 24,
  medium: 32,
  large: 48,
};

/**
 * Two-character abbreviation for the placeholder, derived from the service
 * route. The leading slash and separators are dropped first, so "/ecs-cluster"
 * reads "EC" rather than the meaningless "/E".
 */
function abbreviate(service: string): string {
  const cleaned = service.replace(/^\/+|[^a-zA-Z0-9]/g, "");
  return (cleaned.slice(0, 2) || "?").toUpperCase();
}

/**
 * ResourceIcon — a service icon with an honest fallback.
 *
 * A registered service can be in the catalogue while its SVG is absent from the
 * vendored icon set. A missing mapping and a missing file therefore need the
 * same treatment: render a neutral placeholder rather than letting the browser
 * draw a broken-image glyph. The placeholder also has no alt text, so a card
 * that already names the service does not show the name twice.
 */
export function ResourceIcon({ service, size = "medium", showLabel = false }: ResourceIconProps) {
  const [failed, setFailed] = useState(false);
  const iconSize = SIZE_MAP[size];
  const icon = SERVICE_ICONS[service];

  const placeholder = (
    <div
      aria-hidden="true"
      title={
        failed
          ? "Icon file missing from the vendored AWS icon set"
          : "No icon mapped for this service"
      }
      style={{
        width: iconSize,
        height: iconSize,
        borderRadius: 4,
        background: "var(--color-background-layout-secondary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size === "small" ? 10 : size === "medium" ? 12 : 14,
        color: "var(--color-text-status-info)",
        fontWeight: 600,
      }}
    >
      {abbreviate(service)}
    </div>
  );

  if (!icon || failed) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        {placeholder}
        {showLabel && <span style={{ fontSize: size === "small" ? 12 : 14 }}>{service}</span>}
      </span>
    );
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <Image
        src={icon.small}
        alt=""
        aria-hidden="true"
        width={iconSize}
        height={iconSize}
        onError={() => setFailed(true)}
      />
      {showLabel && <span style={{ fontSize: size === "small" ? 12 : 14 }}>{service}</span>}
    </span>
  );
}
