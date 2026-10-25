"use client";

import React from "react";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";
import { useRouter } from 'next/navigation';
import { AwsServiceHeader } from '@/components/ui/AwsServiceHeader';
import { SERVICE_ICONS } from '@/constants/service-icons';

export default function IMDSPage() {

  const router = useRouter();  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="EC2 Instance Metadata Service (IMDS)"
          serviceIcon={SERVICE_ICONS["/imds"]?.small}
          counter={0}
          primaryAction=<button type="button" className="aws-service-page__create" onClick={() => router.push("/imds/create")}>
            Create instance metadata
        </button>

        />
        <Alert type="info" header="IMDS">
          IMDS provides metadata from within EC2 instances at
          http://169.254.169.254/latest/meta-data/. It is only accessible from within an EC2
          instance and is not a standalone management console service.
        </Alert>
        <Container>
          <Box>
            Access instance metadata, user data, and IAM credentials from within a running EC2
            instance using the IMDS endpoint.
          </Box>
        </Container>
      </SpaceBetween>
    </div>
  );
}
