"use client";

import React from "react";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";
import { useRouter } from 'next/navigation';
import { AwsServiceHeader } from '@/components/ui/AwsServiceHeader';
import { SERVICE_ICONS } from '@/constants/service-icons';

export default function BillingPage() {

  const router = useRouter();  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="AWS Billing"
          serviceIcon={SERVICE_ICONS["/billing"]?.small}
          counter={0}
          primaryAction=<button type="button" className="aws-service-page__create" onClick={() => router.push("/billing/create")}>
            Create budget
        </button>

        />
        <Alert type="info" header="Billing">
          AWS Billing shows charges and invoices for your AWS account. Not available in local
          emulation.
        </Alert>
        <Container>
          <Box>Access billing information in the real AWS Console.</Box>
        </Container>
      </SpaceBetween>
    </div>
  );
}
