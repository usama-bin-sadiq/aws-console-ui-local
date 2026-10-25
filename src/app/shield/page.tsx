"use client";

import React from "react";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";
import { useRouter } from 'next/navigation';
import { AwsServiceHeader } from '@/components/ui/AwsServiceHeader';
import { SERVICE_ICONS } from '@/constants/service-icons';

export default function ShieldPage() {

  const router = useRouter();  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="AWS Shield"
          serviceIcon={SERVICE_ICONS["/shield"]?.small}
          counter={0}
          primaryAction=<button type="button" className="aws-service-page__create" onClick={() => router.push("/shield/create")}>
            Create protection
        </button>

        />
        <Alert type="info" header="Shield Standard is automatic">
          AWS Shield Standard provides automatic DDoS protection for all AWS customers at no
          additional cost. Shield Advanced requires a subscription and is not available in local
          emulation.
        </Alert>
        <Container>
          <SpaceBetween size="xs">
            <Box>
              <strong>Shield Standard:</strong> Active — automatically protects all AWS resources
            </Box>
            <Box>
              <strong>Shield Advanced:</strong> Requires subscription — not available in local
              emulation
            </Box>
          </SpaceBetween>
        </Container>
      </SpaceBetween>
    </div>
  );
}
