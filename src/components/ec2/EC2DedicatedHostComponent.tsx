/**
 * EC2DedicatedHostComponent — Dedicated host create/release.
 */

import React from "react";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";

export function EC2DedicatedHostComponent(): React.ReactElement {
  return (
    <SpaceBetween size="m" direction="vertical">
      <h3>Dedicated Hosts</h3>
      <Button variant="primary">Create Dedicated Host</Button>
      <Button>Release</Button>
    </SpaceBetween>
  );
}
