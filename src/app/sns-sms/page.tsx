"use client";

import React, { useEffect, useState } from "react";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";
import Table from "@cloudscape-design/components/table";

export default function SNSSMSPage() {
  const [topics, setTopics] = useState<{ TopicArn: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/sns")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setTopics(data.topics || []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unknown error"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">SNS — SMS Notifications</Header>
        {error && (
          <Alert type="error" header="Error">
            {error}
          </Alert>
        )}
        <Alert type="info" header="SMS via SNS">
          To send SMS, publish to an SNS topic with phone number subscriptions. Create topics in the
          SNS console and subscribe phone numbers.
        </Alert>
        <Container>
          <Table
            header={<Header variant="h2">SNS Topics ({topics.length})</Header>}
            items={topics}
            loading={loading}
            columnDefinitions={[{ header: "Topic ARN", cell: (i) => i.TopicArn }]}
            empty={<Box textAlign="center">No topics found.</Box>}
          />
        </Container>
      </SpaceBetween>
    </div>
  );
}
