"use client";

import React from "react";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Link from "@cloudscape-design/components/link";

export default function BedrockAgentCorePage() {
  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">Amazon Bedrock AgentCore</Header>
        <Container>
          <Box>
            AgentCore extends Bedrock Agents with advanced runtime capabilities.
            Manage your agents via{" "}
            <Link href="/bedrock-agent">Bedrock Agents</Link>.
          </Box>
        </Container>
      </SpaceBetween>
    </div>
  );
}
