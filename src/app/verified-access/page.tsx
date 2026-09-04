"use client";

import React, { useEffect, useState } from "react";
import Header from "@cloudscape-design/components/header";
import Table from "@cloudscape-design/components/table";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Alert from "@cloudscape-design/components/alert";

interface VerifiedAccessInstance {
  VerifiedAccessInstanceId: string;
  Description?: string;
  CreationTime?: string;
}

export default function VerifiedAccessPage() {
  const [instances, setInstances] = useState<VerifiedAccessInstance[]>([]);
  const [loading, setLoading] = useState(true);
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
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">AWS Verified Access</Header>

        {message && (
          <Alert type="info" header="Verified Access not available">
            {message}
          </Alert>
        )}

        <Container>
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
        </Container>
      </SpaceBetween>
    </div>
  );
}
