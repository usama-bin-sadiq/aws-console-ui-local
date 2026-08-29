"use client";
import React from "react";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";

export default function AppConfigPage() {
  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">AWS AppConfig</Header>
        <Alert type="info" header="SDK package not available">
          AppConfig requires the <code>@aws-sdk/client-appconfig</code> package. Add it to package.json to enable full AppConfig management.
        </Alert>
        <Container>
          <Box>AWS AppConfig lets you deploy application configuration safely with validation and rollback support.</Box>
        </Container>
      </SpaceBetween>
    </div>
  );
}
