"use client";
import React from "react";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";
import { useRouter } from 'next/navigation';
import { AwsServiceHeader } from '@/components/ui/AwsServiceHeader';
import { SERVICE_ICONS } from '@/constants/service-icons';

export default function DirectConnectPage() {

  const router = useRouter();  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="AWS Direct Connect"
          serviceIcon={SERVICE_ICONS["/direct-connect"]?.small}
          counter={0}
          primaryAction=<button type="button" className="aws-service-page__create" onClick={() => router.push("/direct-connect/create")}>
            Create connection
        </button>

        />
        <Alert type="info" header="Not available in local emulation">
          Direct Connect provides dedicated network connectivity from your premises to AWS. This
          requires physical network infrastructure and is not supported in Ministack or LocalStack
          emulation.
        </Alert>
        <Container>
          <Box>
            Use the AWS Management Console to manage Direct Connect connections in your real AWS
            environment.
          </Box>
        </Container>
      </SpaceBetween>
    </div>
  );
}
