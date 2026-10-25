"use client";

import React from "react";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";
import { useRouter } from 'next/navigation';
import { AwsServiceHeader } from '@/components/ui/AwsServiceHeader';
import { SERVICE_ICONS } from '@/constants/service-icons';

export default function CostExplorerPage() {

  const router = useRouter();  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="AWS Cost Explorer"
          serviceIcon={SERVICE_ICONS["/cost-explorer"]?.small}
          counter={0}
          primaryAction=<button type="button" className="aws-service-page__create" onClick={() => router.push("/cost-explorer/create")}>
            Create report
        </button>

        />
        <Alert type="info" header="Cost Explorer">
          Cost Explorer provides visualizations of your AWS spending patterns over time. Not
          available in local emulation.
        </Alert>
        <Container>
          <Box>
            Use Cost Explorer in the real AWS Console to analyze your spending trends, forecast
            future costs, and identify cost-saving opportunities.
          </Box>
        </Container>
      </SpaceBetween>
    </div>
  );
}
