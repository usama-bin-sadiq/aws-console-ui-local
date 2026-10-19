import React from "react";
import Alert from "@cloudscape-design/components/alert";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";

interface ErrorStateProps {
  title?: string;
  message: string;
  retry?: () => void;
}

export function ErrorState({ title = "Error", message, retry }: ErrorStateProps) {
  return (
    <SpaceBetween direction="vertical" size="s">
      <Alert type="error" header={title}>
        {message}
      </Alert>
      {retry && (
        <Button iconName="refresh" onClick={retry}>
          Retry
        </Button>
      )}
    </SpaceBetween>
  );
}
