"use client";

import React from "react";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";

export default function DetectivePage() {
  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <Header variant="h1">Amazon Detective</Header>
        <Alert type="info" header="Not available in local emulation">
          Amazon Detective helps investigate security issues by analyzing AWS CloudTrail, VPC Flow
          Logs, and GuardDuty data. It is not supported in Ministack or LocalStack emulation.
        </Alert>
        <Container>
          <Box>
            Enable Detective in your real AWS environment for automated security investigations and
            visualizations.
          </Box>
        </Container>
      </SpaceBetween>
    </div>
  );
}
