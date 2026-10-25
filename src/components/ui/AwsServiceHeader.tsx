"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Header, SpaceBetween } from "@cloudscape-design/components";

interface AwsServiceHeaderProps {
  /** Service display name (e.g. "EC2", "Amazon S3") */
  serviceName: string;
  /** AWS Architecture Service icon src (e.g. "/icons/Architecture-Service/Arch_Compute/32/Arch_Amazon-EC2_32.svg") */
  serviceIcon?: string;
  /** Resource count shown after the service name */
  counter?: number | string;
  /** Primary action (e.g. "Launch instances", "Create bucket") */
  primaryAction?: React.ReactNode;
  /** Secondary actions */
  actions?: React.ReactNode;
}

/**
 * AWS Console service page header.
 *
 * Matches the real AWS console: service icon + service name on the left,
 * optional resource counter, and primary/secondary actions on the right.
 *
 * On narrow viewports (< 760px), the service name/counter and primary action
 * stack vertically so nothing overflows or wraps awkwardly.
 */
export function AwsServiceHeader({
  serviceName,
  serviceIcon,
  counter,
  primaryAction,
  actions,
}: AwsServiceHeaderProps) {
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;

    const mq = window.matchMedia("(max-width: 760px)");
    const sync = () => setIsNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <Header variant="h1" actions={actions}>
      <SpaceBetween
        direction={isNarrow ? "vertical" : "horizontal"}
        size={isNarrow ? "s" : "s"}
        alignItems={isNarrow ? "start" : "center"}
        className="aws-service-header__row"
      >
        <div className="aws-service-header__left">
          {serviceIcon ? (
            <Image
              key="service-icon"
              src={serviceIcon}
              alt=""
              width={24}
              height={24}
              className="aws-service-header__icon"
            />
          ) : null}
          <span key="service-name" style={{ fontWeight: 600 }}>
            {serviceName}
          </span>
          {counter !== undefined && counter !== null ? (
            <span key="counter" style={{ marginLeft: 8, fontWeight: 500 }}>
              ({counter})
            </span>
          ) : null}
        </div>
        {primaryAction ? (
          <div key="primary-action" className="aws-service-header__action">
            {primaryAction}
          </div>
        ) : null}
      </SpaceBetween>
    </Header>
  );
}
