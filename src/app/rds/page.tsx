"use client";

import React, { useEffect, useState } from "react";
import Header from "@cloudscape-design/components/header";
import Table from "@cloudscape-design/components/table";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import StatusIndicator from "@cloudscape-design/components/status-indicator";

export default function RDSPage() {
  const [instances, setInstances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/rds")
      .then((r) => r.json())
      .then((d) => setInstances(d.instances || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">RDS - Relational Database Service</Header>
        <Container>
          <Table
            header={<Header variant="h2">DB Instances ({instances.length})</Header>}
            items={instances}
            columnDefinitions={[
              { header: "Identifier", cell: (item: any) => item.DBInstanceIdentifier },
              { header: "Engine", cell: (item: any) => item.Engine },
              { header: "Status", cell: (item: any) => (
                <StatusIndicator type={item.DBInstanceStatus === "available" ? "success" : "warning"}>
                  {item.DBInstanceStatus}
                </StatusIndicator>
              )},
              { header: "Class", cell: (item: any) => item.DBInstanceClass },
              { header: "Endpoint", cell: (item: any) => item.Endpoint?.Address || "N/A" },
            ]}
            loading={loading}
            empty={<Box textAlign="center">No RDS instances found.</Box>}
          />
        </Container>
      </SpaceBetween>
    </div>
  );
}
