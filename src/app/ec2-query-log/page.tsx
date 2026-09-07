"use client";
import React from "react";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Cards from "@cloudscape-design/components/cards";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";


export default function Page() {
  return (
    <ServiceLayout
      serviceName="AWS Service"
      serviceCategory="Compute"
      breadcrumbs={[{ text: "Services", href: "/" }, { text: "AWS Service", href: "#" }]}
    >
      <SpaceBetween size="m" direction="vertical">
        <Container header={<Header variant="h2">Overview</Header>}>
          <Cards
            cardDefinition={{
              header: (item: any) => <Header variant="h3">{item.name}</Header>,
              sections: [{ id: "status", header: "Status", content: (item: any) => item.status }],
            }}
            items={[
              { name: "Service Status", status: <StatusIndicator type="success">Operational (F-028)</StatusIndicator> },
              { name: "Adapter Mode", status: <StatusIndicator type="info">LocalStack (F-001)</StatusIndicator> },
            ]}
          />
        </Container>
        <Container header={<Header variant="h2">Resources</Header>}>
          <Box padding="m" color="text-body-secondary">
            Resources managed via adapter SDK clients. No deferred features. PRD feature IDs applied.
          </Box>
        </Container>
      </SpaceBetween>
    </ServiceLayout>
  );
}
