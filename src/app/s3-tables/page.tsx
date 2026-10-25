"use client";
import React from "react";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Link from "@cloudscape-design/components/link";
import { useRouter } from 'next/navigation';
import { AwsServiceHeader } from '@/components/ui/AwsServiceHeader';
import { SERVICE_ICONS } from '@/constants/service-icons';

export default function S3TablesPage() {

  const router = useRouter();  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="S3 Tables"
          serviceIcon={SERVICE_ICONS["/s3-tables"]?.small}
          counter={0}
          primaryAction=<button type="button" className="aws-service-page__create" onClick={() => router.push("/s3-tables/create")}>
            Create table
        </button>

        />
        <Container>
          <Box>
            S3 Tables are managed as S3 buckets. Use the <Link href="/s3">S3 bucket list</Link> or{" "}
            <Link href="/s3-files">S3 object browser</Link> to browse table data.
          </Box>
        </Container>
      </SpaceBetween>
    </div>
  );
}
