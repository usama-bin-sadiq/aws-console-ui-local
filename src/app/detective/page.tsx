"use client";

import React from "react";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";
import { useRouter } from 'next/navigation';
import { AwsServiceHeader } from '@/components/ui/AwsServiceHeader';
import { SERVICE_ICONS } from '@/constants/service-icons';

export default function DetectivePage() {

  const router = useRouter();  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="Amazon Detective"
          serviceIcon={SERVICE_ICONS["/detective"]?.small}
          counter={0}
          primaryAction=<button type="button" className="aws-service-page__create" onClick={() => router.push("/detective/create")}>
            Create graph
        </button>

        />
        <Alert type="info" header="Not available in local emulation">
          Amazon Detective helps investigate security issues by analyzing AWS CloudTrail, VPC Flow
          Logs, and GuardDuty data. It is not supported in Ministack or LocalStack emulation.
        </Alert>
        <Container>
          <Box>
            Enable Detective in your real AWS environment for automated security investigations and
            visualizations.
          </Box>
        </Container>
      </SpaceBetween>
    </div>
  );
}
