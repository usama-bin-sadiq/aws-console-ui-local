"use client";

import React from "react";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";

export default function MaciePage() {
  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <Header variant="h1">Amazon Macie</Header>
        <Alert type="info" header="Not available in local emulation">
          Amazon Macie uses machine learning to automatically discover, classify, and protect
          sensitive data in S3. It is not supported in Ministack or LocalStack emulation.
        </Alert>
        <Container>
          <Box>
            Enable Macie in your real AWS environment to get data security and privacy insights for
            your S3 buckets.
          </Box>
        </Container>
      </SpaceBetween>
    </div>
  );
}
