"use client";

import React from "react";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";
import { useRouter } from 'next/navigation';
import { AwsServiceHeader } from '@/components/ui/AwsServiceHeader';
import { SERVICE_ICONS } from '@/constants/service-icons';

export default function SupportPage() {

  const router = useRouter();  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="AWS Support"
          serviceIcon={SERVICE_ICONS["/support"]?.small}
          counter={0}
          primaryAction=<button type="button" className="aws-service-page__create" onClick={() => router.push("/support/create")}>
            Create case
        </button>

        />
        <Alert type="info" header="Support">
          AWS Support provides technical assistance for AWS products and services. Not available in
          local emulation. Contact AWS Support via the AWS Console.
        </Alert>
        <Container>
          <Box>
            Access AWS Support in the real AWS Console to create support cases, access
            documentation, and get technical guidance from AWS experts.
          </Box>
        </Container>
      </SpaceBetween>
    </div>
  );
}
