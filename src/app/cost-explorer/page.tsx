"use client";

import React from "react";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";

export default function CostExplorerPage() {
  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <Header variant="h1">AWS Cost Explorer</Header>
        <Alert type="info" header="Cost Explorer">
          Cost Explorer provides visualizations of your AWS spending patterns over time. Not
          available in local emulation.
        </Alert>
        <Container>
          <Box>
            Use Cost Explorer in the real AWS Console to analyze your spending trends, forecast
            future costs, and identify cost-saving opportunities.
          </Box>
        </Container>
      </SpaceBetween>
    </div>
  );
}
