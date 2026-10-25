"use client";
import React from "react";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Header from "@cloudscape-design/components/header";
import { useRouter } from 'next/navigation';
import { AwsServiceHeader } from '@/components/ui/AwsServiceHeader';
import { SERVICE_ICONS } from '@/constants/service-icons';
export default function Page() {

  const router = useRouter();  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="AWS Elemental MediaConnect"
          serviceIcon={SERVICE_ICONS["/mediaconnect"]?.small}
          counter={0}
          primaryAction=<button type="button" className="aws-service-page__create" onClick={() => router.push("/mediaconnect/create")}>
            Create flow
        </button>

        />
        <Container header={<Header variant="h2">Resources</Header>}>
          <Box>
            <StatusIndicator type="success">Service Available</StatusIndicator>
          </Box>
          <Box>This service is emulated by Ministack / LocalStack.</Box>
        </Container>
      </SpaceBetween>
    </div>
  );
}
