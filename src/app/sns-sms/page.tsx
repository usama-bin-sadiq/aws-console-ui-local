"use client";

import { useEffect, useState } from "react";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";
import Table from "@cloudscape-design/components/table";
import Header from "@cloudscape-design/components/header";
import { useRouter } from "next/navigation";
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";

export default function SNSSMSPage() {
  const [topics, setTopics] = useState<{ TopicArn: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
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
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="SNS — SMS Notifications"
          serviceIcon={SERVICE_ICONS["/sns-sms"]?.small}
          counter={0}
          primaryAction=<button
            type="button"
            className="aws-service-page__create"
            onClick={() => router.push("/sns-sms/create")}
          >
            Create SMS
          </button>
        />
        {error && (
          <Alert type="error" header="Error">
            {error}
          </Alert>
        )}
        <Alert type="info" header="SMS via SNS">
          To send SMS, publish to an SNS topic with phone number subscriptions. Create topics in the
          SNS console and subscribe phone numbers.
        </Alert>
        <Table
          header={<Header variant="h2">SNS Topics ({topics.length})</Header>}
          items={topics}
          loading={loading}
          columnDefinitions={[{ header: "Topic ARN", cell: (i) => i.TopicArn }]}
          empty={<Box textAlign="center">No topics found.</Box>}
        />
      </SpaceBetween>
    </div>
  );
}
