"use client";

import { useState } from "react";
import Image from "next/image";
import { getServiceIcon } from "@/constants/service-icons";

export interface AwsServiceIconProps {
  href: string;
  size?: "small" | "large";
  className?: string;
}

/**
 * AwsServiceIcon — renders a service's official AWS Architecture Service Icon.
 *
 * The icon catalogue is not complete for every registered service, so a missing
 * mapping *and* a mapped-but-absent file both fall back to the same neutral
 * placeholder. Without the `onError` fallback a missing file renders as a
 * broken-image glyph, which is worse than an honest placeholder.
 */
export function AwsServiceIcon({ href, size = "small", className }: AwsServiceIconProps) {
  const [failed, setFailed] = useState(false);
  const icon = getServiceIcon(href, size);
  const classes = ["aws-overlay-service-icon", className].filter(Boolean).join(" ");

  if (!icon || failed) {
    return (
      <span
        className={`${classes} aws-overlay-service-icon--empty`}
        aria-hidden="true"
        title={failed ? "Icon file missing from the vendored AWS icon set" : undefined}
      />
    );
  }

  return (
    <Image
      className={classes}
      src={icon}
      alt=""
      aria-hidden="true"
      width={size === "small" ? 32 : 48}
      height={size === "small" ? 32 : 48}
      loading="lazy"
      unoptimized
      onError={() => setFailed(true)}
    />
  );
}
