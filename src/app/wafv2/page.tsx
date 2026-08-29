"use client";
import React, { useEffect, useState } from "react";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import StatusIndicator from "@cloudscape-design/components/status-indicator";

export default function WAFv2Page() {
  const [items] = useState([{ Name: "waf-v2-webacl-demo", Status: "ACTIVE" }]);
  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">WAF v2 - Web Application Firewall</Header>
        <Container>
          <Box>Web ACL: <strong>waf-v2-webacl-demo</strong></Box>
          <StatusIndicator type="success">Active</StatusIndicator>
        </Container>
      </SpaceBetween>
    </div>
  );
}
