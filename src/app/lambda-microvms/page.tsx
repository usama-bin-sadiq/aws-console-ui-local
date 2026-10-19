"use client";
import React from "react";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
export default function Page() {
  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <Header variant="h1">Lambda MicroVMs</Header>
        <Container header={<Header variant="h2">Resources</Header>}>
          <Box>
            <StatusIndicator type="success">Service Available</StatusIndicator>
          </Box>
          <Box>This service is emulated by Ministack / LocalStack.</Box>
        </Container>
      </SpaceBetween>
    </div>
  );
}
