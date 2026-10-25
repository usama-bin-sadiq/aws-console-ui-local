import StatusIndicator from "@cloudscape-design/components/status-indicator";

export type StatusType =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "pending"
  | "stopped"
  | "in-progress";

interface StatusBadgeProps {
  status: StatusType;
  label: string;
  showIcon?: boolean;
}

const STATUS_MAP: Record<StatusType, "success" | "warning" | "error" | "info"> = {
  success: "success",
  warning: "warning",
  error: "error",
  info: "info",
  pending: "info",
  stopped: "warning",
  "in-progress": "info",
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return <StatusIndicator type={STATUS_MAP[status] ?? "info"}>{label}</StatusIndicator>;
}
