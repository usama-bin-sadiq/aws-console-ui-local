"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Alert from "@cloudscape-design/components/alert";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Select from "@cloudscape-design/components/select";
import Button from "@cloudscape-design/components/button";
import { apiFetch } from "@/lib/api-client";
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";

interface AlarmForm {
  name: string;
  namespace: string;
  metricName: string;
  statistic: string;
  period: string;
  evaluationPeriods: string;
  threshold: string;
  comparisonOperator: string;
}

export default function CloudWatchAlarmCreatePage() {
  const router = useRouter();
  const [form, setForm] = useState<AlarmForm>({
    name: "",
    namespace: "AWS/EC2",
    metricName: "CPUUtilization",
    statistic: "Average",
    period: "300",
    evaluationPeriods: "1",
    threshold: "80",
    comparisonOperator: "GreaterThanThreshold",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAlarm = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/cloudwatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createAlarm",
          AlarmName: form.name,
          Namespace: form.namespace,
          MetricName: form.metricName,
          Statistic: form.statistic,
          Period: parseInt(form.period),
          EvaluationPeriods: parseInt(form.evaluationPeriods),
          Threshold: parseFloat(form.threshold),
          ComparisonOperator: form.comparisonOperator,
        }),
      });
      if (!res.ok) throw new Error("Failed to create alarm");
      router.push("/cloudwatch");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create alarm");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="CloudWatch"
          serviceIcon={SERVICE_ICONS["/cloudwatch"]?.small}
          counter={0}
          primaryAction={
            <button
              type="button"
              className="aws-service-page__create"
              onClick={() => router.push("/cloudwatch/create")}
            >
              Create Alarm
            </button>
          }
        />

        <Container>
          <Header variant="h2">Create Alarm</Header>
          {error && (
            <Alert type="error" dismissible onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}
          <SpaceBetween size="m">
            <FormField label="Alarm Name">
              <Input
                value={form.name || ""}
                onChange={(e) => setForm({ ...form, name: e.detail.value })}
                placeholder="my-alarm"
              />
            </FormField>
            <FormField label="Namespace">
              <Select
                selectedOption={{ label: form.namespace, value: form.namespace }}
                options={[
                  { label: "AWS/EC2", value: "AWS/EC2" },
                  { label: "AWS/RDS", value: "AWS/RDS" },
                  { label: "AWS/Lambda", value: "AWS/Lambda" },
                  { label: "AWS/S3", value: "AWS/S3" },
                  { label: "AWS/ECS", value: "AWS/ECS" },
                  { label: "AWS/ApplicationELB", value: "AWS/ApplicationELB" },
                ]}
                onChange={(e) =>
                  setForm({ ...form, namespace: e.detail.selectedOption.value || "" })
                }
              />
            </FormField>
            <FormField label="Metric Name">
              <Input
                value={form.metricName || ""}
                onChange={(e) => setForm({ ...form, metricName: e.detail.value })}
                placeholder="CPUUtilization"
              />
            </FormField>
            <FormField label="Statistic">
              <Select
                selectedOption={{ label: form.statistic, value: form.statistic }}
                options={[
                  { label: "Average", value: "Average" },
                  { label: "Sum", value: "Sum" },
                  { label: "Minimum", value: "Minimum" },
                  { label: "Maximum", value: "Maximum" },
                  { label: "SampleCount", value: "SampleCount" },
                ]}
                onChange={(e) =>
                  setForm({ ...form, statistic: e.detail.selectedOption.value || "" })
                }
              />
            </FormField>
            <FormField label="Period (seconds)">
              <Input
                value={form.period || ""}
                onChange={(e) => setForm({ ...form, period: e.detail.value })}
                placeholder="300"
              />
            </FormField>
            <FormField label="Evaluation Periods">
              <Input
                value={form.evaluationPeriods || ""}
                onChange={(e) => setForm({ ...form, evaluationPeriods: e.detail.value })}
                placeholder="1"
              />
            </FormField>
            <FormField label="Threshold">
              <Input
                value={form.threshold || ""}
                onChange={(e) => setForm({ ...form, threshold: e.detail.value })}
                placeholder="80"
              />
            </FormField>
            <FormField label="Comparison Operator">
              <Select
                selectedOption={{ label: form.comparisonOperator, value: form.comparisonOperator }}
                options={[
                  { label: "GreaterThanThreshold", value: "GreaterThanThreshold" },
                  {
                    label: "GreaterThanOrEqualToThreshold",
                    value: "GreaterThanOrEqualToThreshold",
                  },
                  { label: "LessThanThreshold", value: "LessThanThreshold" },
                  { label: "LessThanOrEqualToThreshold", value: "LessThanOrEqualToThreshold" },
                ]}
                onChange={(e) =>
                  setForm({ ...form, comparisonOperator: e.detail.selectedOption.value || "" })
                }
              />
            </FormField>
          </SpaceBetween>
          <SpaceBetween size="xs" direction="horizontal">
            <Button variant="primary" onClick={() => router.push("/cloudwatch")}>
              Cancel
            </Button>
            <Button variant="primary" onClick={createAlarm} disabled={loading}>
              {loading ? "Creating..." : "Create Alarm"}
            </Button>
          </SpaceBetween>
        </Container>
      </SpaceBetween>
    </div>
  );
}
