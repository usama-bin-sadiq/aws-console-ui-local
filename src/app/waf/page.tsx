"use client";
import React from "react";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Link from "@cloudscape-design/components/link";

export default function WAFPage() {
  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">AWS WAF</Header>
        <Container>
          <Box>
            AWS WAF Classic is deprecated. Use <Link href="/wafv2">WAF v2</Link> for new web ACLs.
          </Box>
        </Container>
      </SpaceBetween>
    </div>
  );
}
