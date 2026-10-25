"use client";

import React from "react";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";
import { useRouter } from 'next/navigation';
import { AwsServiceHeader } from '@/components/ui/AwsServiceHeader';
import { SERVICE_ICONS } from '@/constants/service-icons';

export default function MaciePage() {

  const router = useRouter();  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="Amazon Macie"
          serviceIcon={SERVICE_ICONS["/macie"]?.small}
          counter={0}
          primaryAction=<button type="button" className="aws-service-page__create" onClick={() => router.push("/macie/create")}>
            Create session
        </button>

        />
        <Alert type="info" header="Not available in local emulation">
          Amazon Macie uses machine learning to automatically discover, classify, and protect
          sensitive data in S3. It is not supported in Ministack or LocalStack emulation.
        </Alert>
        <Container>
          <Box>
            Enable Macie in your real AWS environment to get data security and privacy insights for
            your S3 buckets.
          </Box>
        </Container>
      </SpaceBetween>
    </div>
  );
}
