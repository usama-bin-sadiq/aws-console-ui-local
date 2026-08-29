"use client";

import React, { useEffect, useState } from "react";
import Header from "@cloudscape-design/components/header";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import StatusIndicator from "@cloudscape-design/components/status-indicator";

interface Instance { InstanceId?: string; InstanceType?: string; State?: { Name?: string }; PublicIpAddress?: string; }

export default function EC2Page() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInstances = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ec2");
      const data = await res.json();
      setInstances(data.instances || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchInstances(); }, []);

  const action = async (act: string, ids: string[]) => {
    await fetch("/api/ec2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: act, instanceIds: ids }),
    });
    fetchInstances();
  };

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">EC2 - Elastic Compute Cloud</Header>

        <Container>
          <Table
            header={<Header variant="h2">Instances ({instances.length})</Header>}
            items={instances}
            columnDefinitions={[
              { header: "ID", cell: (item) => item.InstanceId },
              { header: "Type", cell: (item) => item.InstanceType },
              { header: "State", cell: (item) => (
                <StatusIndicator type={item.State?.Name === "running" ? "success" : "stopped"}>
                  {item.State?.Name}
                </StatusIndicator>
              )},
              { header: "Public IP", cell: (item) => item.PublicIpAddress || "N/A" },
              { header: "Actions", cell: (item) => (
                <SpaceBetween direction="horizontal" size="xs">
                  {item.State?.Name !== "running" && (
                    <Button onClick={() => action("start", [item.InstanceId!])} formAction="none">Start</Button>
                  )}
                  {item.State?.Name === "running" && (
                    <Button onClick={() => action("stop", [item.InstanceId!])} formAction="none">Stop</Button>
                  )}
                  <Button onClick={() => action("terminate", [item.InstanceId!])} formAction="none">Terminate</Button>
                </SpaceBetween>
              )},
            ]}
            loading={loading}
            empty={<Box textAlign="center">No instances found.</Box>}
          />
        </Container>
      </SpaceBetween>
    </div>
  );
}
