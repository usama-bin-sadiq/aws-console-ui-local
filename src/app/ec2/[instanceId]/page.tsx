"use client";

import React from "react";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import Tabs from "@cloudscape-design/components/tabs";
import SpaceBetween from "@cloudscape-design/components/space-between";
import { AdapterStatus } from "@/components/AdapterStatus/AdapterStatus";

export default function EC2InstanceDetailsPage({ params }: { params: { instanceId: string } }): React.ReactElement {
  return (
    <SpaceBetween size="l" direction="vertical">
      <Header variant="h1">Instance {params.instanceId}</Header>
      <AdapterStatus status="connected" endpointUrl={process.env.NEXT_PUBLIC_LOCALSTACK_ENDPOINT || "http://localhost:4566"} />
      <Tabs
        tabs={[
          { label: "Overview", id: "overview", content: <div>Overview content for {params.instanceId}</div> },
          { label: "Status Checks", id: "status", content: <div>Status checks for {params.instanceId}</div> },
          { label: "Monitoring", id: "monitoring", content: <div>Monitoring for {params.instanceId}</div> },
          { label: "Security", id: "security", content: <div>Security groups for {params.instanceId}</div> },
          { label: "Networking", id: "networking", content: <div>Networking for {params.instanceId}</div> },
          { label: "Storage", id: "storage", content: <div>Storage volumes for {params.instanceId}</div> },
          { label: "Tags", id: "tags", content: <div>Tags for {params.instanceId}</div> },
        ]}
      />
    </SpaceBetween>
  );
}
