"use client";
import React from "react";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import StatusIndicator from "@cloudscape-design/components/status-indicator";

export default function Page() {
  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">AWS Certificate Manager</Header>
        <Container header={<Header variant="h2">Resources</Header>}>
          <Box>
            <StatusIndicator type="info">
              AWS Certificate Manager — coming soon
            </StatusIndicator>
          </Box>
          <Box>This service is emulated by LocalStack / Ministack.</Box>
        </Container>
      </SpaceBetween>
    </div>
  );
}
