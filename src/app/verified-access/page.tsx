"use client";

import { useEffect, useState } from "react";
import Table from "@cloudscape-design/components/table";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";
import Header from "@cloudscape-design/components/header";
import { useRouter } from "next/navigation";
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";

interface VerifiedAccessInstance {
  VerifiedAccessInstanceId: string;
  Description?: string;
  CreationTime?: string;
}

export default function VerifiedAccessPage() {
  const [instances, setInstances] = useState<VerifiedAccessInstance[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchInstances = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/verified-access");
        const data = await res.json();
        setInstances(data.instances || []);
        if (data.message) setMessage(data.message);
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Failed to fetch instances");
      } finally {
        setLoading(false);
      }
    };
    fetchInstances();
  }, []);

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="AWS Verified Access"
          serviceIcon={SERVICE_ICONS["/verified-access"]?.small}
          counter={0}
          primaryAction=<button
            type="button"
            className="aws-service-page__create"
            onClick={() => router.push("/verified-access/create")}
          >
            Create trust policy
          </button>
        />

        {message && (
          <Alert type="info" header="Verified Access not available">
            {message}
          </Alert>
        )}

        <Table
          header={<Header variant="h2">Instances ({instances.length})</Header>}
          items={instances}
          columnDefinitions={[
            { header: "Instance ID", cell: (item) => item.VerifiedAccessInstanceId },
            { header: "Description", cell: (item) => item.Description || "—" },
          ]}
          loading={loading}
          empty={<Box textAlign="center">No Verified Access instances found.</Box>}
        />
      </SpaceBetween>
    </div>
  );
}
