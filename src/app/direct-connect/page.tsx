"use client";
import React from "react";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";

export default function DirectConnectPage() {
  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">AWS Direct Connect</Header>
        <Alert type="info" header="Not available in local emulation">
          Direct Connect provides dedicated network connectivity from your premises to AWS. This
          requires physical network infrastructure and is not supported in Ministack or LocalStack
          emulation.
        </Alert>
        <Container>
          <Box>
            Use the AWS Management Console to manage Direct Connect connections in your real AWS
            environment.
          </Box>
        </Container>
      </SpaceBetween>
    </div>
  );
}
