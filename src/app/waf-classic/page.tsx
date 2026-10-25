"use client";
import React from "react";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Link from "@cloudscape-design/components/link";
import { useRouter } from 'next/navigation';
import { AwsServiceHeader } from '@/components/ui/AwsServiceHeader';
import { SERVICE_ICONS } from '@/constants/service-icons';

export default function WAFClassicPage() {

  const router = useRouter();  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="AWS WAF Classic"
          serviceIcon={SERVICE_ICONS["/waf-classic"]?.small}
          counter={0}
          primaryAction=<button type="button" className="aws-service-page__create" onClick={() => router.push("/waf-classic/create")}>
            Create web ACL
        </button>

        />
        <Container>
          <Box>
            AWS WAF Classic is deprecated. Use <Link href="/wafv2">WAF v2</Link> for new web ACLs.
          </Box>
        </Container>
      </SpaceBetween>
    </div>
  );
}
