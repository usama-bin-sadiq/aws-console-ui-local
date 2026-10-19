import { Header, SpaceBetween, Icon } from "@cloudscape-design/components";
import { StatusBadge } from "./StatusBadge";

type ServiceHeaderProps = {
  serviceName: string;
  serviceIcon?: string;
  counter?: number | string;
  actions?: React.ReactNode;
};

export function ServiceHeader({
  serviceName,
  serviceIcon = "aws-service-icon",
  counter,
  actions,
}: ServiceHeaderProps) {
  return (
    <Header
      variant="h1"
      counter={counter ? `(${counter})` : undefined}
      actions={
        actions ? (
          <SpaceBetween direction="horizontal" size="xs">
            {actions}
          </SpaceBetween>
        ) : undefined
      }
    >
      <SpaceBetween direction="horizontal" size="s" alignItems="center">
        <Icon
          key="service-icon"
          name={serviceIcon as React.ComponentProps<typeof Icon>["name"]}
          size="large"
        />
        <span key="service-name">{serviceName}</span>
      </SpaceBetween>
    </Header>
  );
}
