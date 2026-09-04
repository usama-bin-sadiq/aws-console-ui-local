"use client";
import React from "react";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Link from "@cloudscape-design/components/link";
import Alert from "@cloudscape-design/components/alert";

export default function FargatePage() {
  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">AWS Fargate</Header>
        <Alert type="info" header="Fargate is managed via ECS">
          AWS Fargate is a serverless compute engine for containers. Fargate tasks are launched
          through ECS. Manage your Fargate workloads via{" "}
          <Link href="/ecs-cluster">ECS Clusters</Link> and{" "}
          <Link href="/ecs-service">ECS Services</Link> by selecting the FARGATE launch type.
        </Alert>
        <Container header={<Header variant="h2">About Fargate</Header>}>
          <Box>
            Fargate eliminates the need to provision and manage EC2 instances. You specify CPU and
            memory requirements in your ECS task definition and Fargate handles the underlying
            infrastructure.
          </Box>
        </Container>
      </SpaceBetween>
    </div>
  );
}
