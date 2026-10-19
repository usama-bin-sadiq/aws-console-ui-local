"use client";
import React from "react";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Link from "@cloudscape-design/components/link";

export default function S3TablesPage() {
  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <Header variant="h1">S3 Tables</Header>
        <Container>
          <Box>
            S3 Tables are managed as S3 buckets. Use the <Link href="/s3">S3 bucket list</Link> or{" "}
            <Link href="/s3-files">S3 object browser</Link> to browse table data.
          </Box>
        </Container>
      </SpaceBetween>
    </div>
  );
}
