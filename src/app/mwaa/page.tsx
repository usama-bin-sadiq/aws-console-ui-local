"use client";

import React from "react";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Link from "@cloudscape-design/components/link";

export default function MWAAPage() {
  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <Header variant="h1">MWAA — Managed Workflows for Apache Airflow</Header>
        <Container>
          <Box>
            MWAA is not supported by Ministack/LocalStack emulation. For workflow orchestration, use{" "}
            <Link href="/athena-workgroup">Athena</Link> or{" "}
            <Link href="/step-functions">Step Functions</Link>.
          </Box>
        </Container>
      </SpaceBetween>
    </div>
  );
}
