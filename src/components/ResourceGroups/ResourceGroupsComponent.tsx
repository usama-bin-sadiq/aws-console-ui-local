/**
 * ResourceGroups — Resource group query/management.
 */

import React from "react";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";

export function ResourceGroupsComponent(): React.ReactElement {
  return (
    <SpaceBetween size="m" direction="vertical">
      <h3>Resource Groups</h3>
      <Button variant="primary">Create Group</Button>
    </SpaceBetween>
  );
}
