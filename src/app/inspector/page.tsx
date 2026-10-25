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

interface Finding {
  findingArn?: string;
  title?: string;
  severity?: string;
  status?: string;
}

export default function InspectorPage() {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchFindings = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/inspector");
        const data = await res.json();
        setFindings(data.findings || []);
        if (data.message) setMessage(data.message);
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Failed to fetch findings");
      } finally {
        setLoading(false);
      }
    };
    fetchFindings();
  }, []);

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="Amazon Inspector"
          serviceIcon={SERVICE_ICONS["/inspector"]?.small}
          counter={0}
          primaryAction=<button
            type="button"
            className="aws-service-page__create"
            onClick={() => router.push("/inspector/create")}
          >
            Create assessment
          </button>
        />

        {message && (
          <Alert type="info" header="Inspector not enabled">
            {message}
          </Alert>
        )}

        <Table
          header={<Header variant="h2">Findings ({findings.length})</Header>}
          items={findings}
          columnDefinitions={[
            { header: "Title", cell: (item) => item.title || "—" },
            { header: "Severity", cell: (item) => item.severity || "—" },
            { header: "Status", cell: (item) => item.status || "—" },
          ]}
          loading={loading}
          empty={<Box textAlign="center">No findings found.</Box>}
        />
      </SpaceBetween>
    </div>
  );
}
