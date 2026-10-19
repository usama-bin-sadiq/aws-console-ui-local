"use client";

import Link from "@cloudscape-design/components/link";
import StatusIndicator from "@cloudscape-design/components/status-indicator";

export interface CapabilityLinkProps {
  readonly label: string;
  readonly href?: string;
  readonly enabled: boolean;
  readonly reason?: string;
}

export default function CapabilityLink({ label, href, enabled, reason }: CapabilityLinkProps) {
  if (enabled && href) {
    return <Link href={href}>{label}</Link>;
  }

  return (
    <StatusIndicator type="warning">
      {label}
      {reason ? ` (${reason})` : " (unavailable)"}
    </StatusIndicator>
  );
}
