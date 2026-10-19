"use client";

import React from "react";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";

export default function SupportPage() {
  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <Header variant="h1">AWS Support</Header>
        <Alert type="info" header="Support">
          AWS Support provides technical assistance for AWS products and services. Not available in
          local emulation. Contact AWS Support via the AWS Console.
        </Alert>
        <Container>
          <Box>
            Access AWS Support in the real AWS Console to create support cases, access
            documentation, and get technical guidance from AWS experts.
          </Box>
        </Container>
      </SpaceBetween>
    </div>
  );
}
