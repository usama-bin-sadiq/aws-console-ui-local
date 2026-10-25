/**
 * EC2VolumeDetails — Volume details with tabs.
 */

import React from "react";
import Header from "@cloudscape-design/components/header";
import Tabs from "@cloudscape-design/components/tabs";
import SpaceBetween from "@cloudscape-design/components/space-between";

export interface EC2VolumeDetailsProps {
  readonly volumeId?: string;
}

export function EC2VolumeDetails({ volumeId }: EC2VolumeDetailsProps): React.ReactElement {
  return (
    <SpaceBetween size="l" direction="vertical">
      <Header variant="h1">Volume {volumeId}</Header>
      <Tabs
        tabs={[
          { label: "Overview", id: "overview", content: <div>Overview for {volumeId}</div> },
          {
            label: "Attachments",
            id: "attachments",
            content: <div>Attachments for {volumeId}</div>,
          },
          { label: "Tags", id: "tags", content: <div>Tags for {volumeId}</div> },
          { label: "Monitoring", id: "monitoring", content: <div>Monitoring for {volumeId}</div> },
          { label: "Snapshots", id: "snapshots", content: <div>Snapshots for {volumeId}</div> },
        ]}
      />
    </SpaceBetween>
  );
}
