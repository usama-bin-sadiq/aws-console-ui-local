"use client";

import React from "react";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";

export default function AppMeshPage() {
  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <Header variant="h1">AWS App Mesh</Header>
        <Alert type="info" header="App Mesh">
          App Mesh is a service mesh for microservices. Not available in Ministack/LocalStack
          emulation.
        </Alert>
        <Container>
          <Box>
            Use App Mesh in your real AWS environment to monitor and control service communications.
          </Box>
        </Container>
      </SpaceBetween>
    </div>
  );
}
