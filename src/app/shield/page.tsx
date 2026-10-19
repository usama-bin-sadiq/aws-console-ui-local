"use client";

import React from "react";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";

export default function ShieldPage() {
  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <Header variant="h1">AWS Shield</Header>
        <Alert type="info" header="Shield Standard is automatic">
          AWS Shield Standard provides automatic DDoS protection for all AWS customers at no
          additional cost. Shield Advanced requires a subscription and is not available in local
          emulation.
        </Alert>
        <Container>
          <SpaceBetween size="xs">
            <Box>
              <strong>Shield Standard:</strong> Active — automatically protects all AWS resources
            </Box>
            <Box>
              <strong>Shield Advanced:</strong> Requires subscription — not available in local
              emulation
            </Box>
          </SpaceBetween>
        </Container>
      </SpaceBetween>
    </div>
  );
}
