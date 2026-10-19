"use client";

import React from "react";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";

export default function BillingPage() {
  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <Header variant="h1">AWS Billing</Header>
        <Alert type="info" header="Billing">
          AWS Billing shows charges and invoices for your AWS account. Not available in local
          emulation.
        </Alert>
        <Container>
          <Box>Access billing information in the real AWS Console.</Box>
        </Container>
      </SpaceBetween>
    </div>
  );
}
