"use client";
import React from "react";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";

export default function GlobalAcceleratorPage() {
  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <Header variant="h1">AWS Global Accelerator</Header>
        <Alert type="info" header="Not available in local emulation">
          Global Accelerator routes traffic through the AWS global network infrastructure to improve
          application performance. It is not available in Ministack or LocalStack emulation.
        </Alert>
        <Container>
          <Box>
            Use the AWS Management Console to configure Global Accelerator for your applications.
          </Box>
        </Container>
      </SpaceBetween>
    </div>
  );
}
