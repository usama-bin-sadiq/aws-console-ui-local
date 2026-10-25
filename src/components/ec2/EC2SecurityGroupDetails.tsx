/**
 * EC2SecurityGroupDetails — SG details with inbound/outbound rules.
 */

import React from "react";
import Header from "@cloudscape-design/components/header";
import Tabs from "@cloudscape-design/components/tabs";
import SpaceBetween from "@cloudscape-design/components/space-between";

export interface EC2SecurityGroupDetailsProps {
  readonly groupId?: string;
}

export function EC2SecurityGroupDetails({
  groupId,
}: EC2SecurityGroupDetailsProps): React.ReactElement {
  return (
    <SpaceBetween size="l" direction="vertical">
      <Header variant="h1">Security Group {groupId}</Header>
      <Tabs
        tabs={[
          {
            label: "Inbound Rules",
            id: "inbound",
            content: <div>Inbound rules for {groupId}</div>,
          },
          {
            label: "Outbound Rules",
            id: "outbound",
            content: <div>Outbound rules for {groupId}</div>,
          },
          { label: "Tags", id: "tags", content: <div>Tags for {groupId}</div> },
        ]}
      />
    </SpaceBetween>
  );
}
