import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: string;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Box textAlign="center" color="inherit">
      <SpaceBetween direction="vertical" size="s">
        <Box key="title" variant="h2" color="inherit">
          {title}
        </Box>
        {description && (
          <Box key="description" variant="p" color="text-body-secondary">
            {description}
          </Box>
        )}
        {action && (
          <Button key="action" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </SpaceBetween>
    </Box>
  );
}
