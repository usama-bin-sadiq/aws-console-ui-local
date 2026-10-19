/**
 * EventBridgeComponent — Event bus and rules.
 */

import React from "react";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";

export function EventBridgeComponent(): React.ReactElement {
  return (
    <SpaceBetween size="m" direction="vertical">
      <h3>EventBridge</h3>
      <Button variant="primary">Create Event Bus</Button>
    </SpaceBetween>
  );
}
