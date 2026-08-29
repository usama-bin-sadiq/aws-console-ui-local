"use client";

import React, { useEffect, useState } from "react";
import Header from "@cloudscape-design/components/header";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import Modal from "@cloudscape-design/components/modal";
import Input from "@cloudscape-design/components/input";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Tabs from "@cloudscape-design/components/tabs";
import FormField from "@cloudscape-design/components/form-field";
import StatusIndicator from "@cloudscape-design/components/status-indicator";

export default function CloudWatchPage() {
  const [data, setData] = useState({ alarms: [], metrics: [] });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cloudwatch");
      const d = await res.json();
      setData(d);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">CloudWatch</Header>
        <Tabs
          tabs={[
            {
              label: `Alarms (${data.alarms.length})`,
              id: "alarms",
              content: (
                <Container>
                  <Table
                    items={data.alarms}
                    columnDefinitions={[
                      { header: "Name", cell: (item: any) => item.AlarmName },
                      { header: "State", cell: (item: any) => (
                        <StatusIndicator type={item.AlarmState === "OK" ? "success" : "error"}>
                          {item.AlarmState}
                        </StatusIndicator>
                      )},
                      { header: "Metric", cell: (item: any) => item.MetricName },
                      { header: "Namespace", cell: (item: any) => item.Namespace },
                    ]}
                    loading={loading}
                    empty={<Box>No alarms configured.</Box>}
                  />
                </Container>
              ),
            },
            {
              label: `Metrics (${data.metrics.length})`,
              id: "metrics",
              content: (
                <Container>
                  <Table
                    items={data.metrics}
                    columnDefinitions={[
                      { header: "Metric Name", cell: (item: any) => item.MetricName },
                      { header: "Namespace", cell: (item: any) => item.Namespace },
                      { header: "Dimensions", cell: (item: any) => item.Dimensions?.map((d: any) => d.Name).join(", ") || "N/A" },
                    ]}
                    loading={loading}
                    empty={<Box>No metrics available.</Box>}
                  />
                </Container>
              ),
            },
          ]}
        />
      </SpaceBetween>
    </div>
  );
}
