/**
 * VPCComponent — VPC creation/display.
 */

import React from "react";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";

export function VPCComponent(): React.ReactElement {
  return (
    <SpaceBetween size="m" direction="vertical">
      <h3>VPC</h3>
      <Button variant="primary">Create VPC</Button>
    </SpaceBetween>
  );
}
