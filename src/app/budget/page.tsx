"use client";

import React from "react";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";
import { useRouter } from 'next/navigation';
import { AwsServiceHeader } from '@/components/ui/AwsServiceHeader';
import { SERVICE_ICONS } from '@/constants/service-icons';

export default function BudgetPage() {

  const router = useRouter();  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="AWS Budgets"
          serviceIcon={SERVICE_ICONS["/budget"]?.small}
          counter={0}
          primaryAction=<button type="button" className="aws-service-page__create" onClick={() => router.push("/budget/create")}>
            Create budget
        </button>

        />
        <Alert type="info" header="Budgets">
          AWS Budgets lets you set custom cost and usage budgets with alerts. Not available in local
          emulation.
        </Alert>
        <Container>
          <Box>
            Use AWS Budgets in the real AWS Console to set spending thresholds and receive
            notifications when your costs or usage exceed defined limits.
          </Box>
        </Container>
      </SpaceBetween>
    </div>
  );
}
