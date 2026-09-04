"use client";

import React from "react";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";

export default function BudgetPage() {
  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">AWS Budgets</Header>
        <Alert type="info" header="Budgets">
          AWS Budgets lets you set custom cost and usage budgets with alerts. Not available in local
          emulation.
        </Alert>
        <Container>
          <Box>
            Use AWS Budgets in the real AWS Console to set spending thresholds and receive
            notifications when your costs or usage exceed defined limits.
          </Box>
        </Container>
      </SpaceBetween>
    </div>
  );
}
