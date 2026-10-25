"use client";
import React from "react";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";
import { useRouter } from 'next/navigation';
import { AwsServiceHeader } from '@/components/ui/AwsServiceHeader';
import { SERVICE_ICONS } from '@/constants/service-icons';

export default function GlobalAcceleratorPage() {

  const router = useRouter();  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="AWS Global Accelerator"
          serviceIcon={SERVICE_ICONS["/global-accelerator"]?.small}
          counter={0}
          primaryAction=<button type="button" className="aws-service-page__create" onClick={() => router.push("/global-accelerator/create")}>
            Create accelerator
        </button>

        />
        <Alert type="info" header="Not available in local emulation">
          Global Accelerator routes traffic through the AWS global network infrastructure to improve
          application performance. It is not available in Ministack or LocalStack emulation.
        </Alert>
        <Container>
          <Box>
            Use the AWS Management Console to configure Global Accelerator for your applications.
          </Box>
        </Container>
      </SpaceBetween>
    </div>
  );
}
