"use client";

import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Link from "@cloudscape-design/components/link";
import { useRouter } from "next/navigation";
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";

export default function MWAAPage() {
  const router = useRouter();
  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="MWAA — Managed Workflows for Apache Airflow"
          serviceIcon={SERVICE_ICONS["/mwaa"]?.small}
          counter={0}
          primaryAction=<button
            type="button"
            className="aws-service-page__create"
            onClick={() => router.push("/mwaa/create")}
          >
            Create environment
          </button>
        />
        <Container>
          <Box>
            MWAA is not supported by Ministack/LocalStack emulation. For workflow orchestration, use{" "}
            <Link href="/athena-workgroup">Athena</Link> or{" "}
            <Link href="/step-functions">Step Functions</Link>.
          </Box>
        </Container>
      </SpaceBetween>
    </div>
  );
}
