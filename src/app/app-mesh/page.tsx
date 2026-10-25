"use client";

import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";
import { useRouter } from "next/navigation";
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";

export default function AppMeshPage() {
  const router = useRouter();
  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="AWS App Mesh"
          serviceIcon={SERVICE_ICONS["/app-mesh"]?.small}
          counter={0}
          primaryAction=<button
            type="button"
            className="aws-service-page__create"
            onClick={() => router.push("/app-mesh/create")}
          >
            Create mesh
          </button>
        />
        <Alert type="info" header="App Mesh">
          App Mesh is a service mesh for microservices. Not available in Ministack/LocalStack
          emulation.
        </Alert>
        <Container>
          <Box>
            Use App Mesh in your real AWS environment to monitor and control service communications.
          </Box>
        </Container>
      </SpaceBetween>
    </div>
  );
}
