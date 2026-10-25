"use client";
import { apiFetch } from "@/lib/api-client";
import { useEffect, useState } from "react";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";
import Modal from "@cloudscape-design/components/modal";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Header from "@cloudscape-design/components/header";
import { useRouter } from "next/navigation";
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";

interface SESIdentityItem {
  identity: string;
}

export default function SESPage() {
  const [identities, setIdentities] = useState<SESIdentityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");

  const fetchIdentities = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/ses");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setIdentities((data.identities || []).map((i: string) => ({ identity: i })));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      fetchIdentities();
    });
  }, []);

  const verifyIdentity = async () => {
    await apiFetch("/api/ses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify", emailAddress }),
    });
    setCreateModal(false);
    setEmailAddress("");
    fetchIdentities();
  };

  const deleteIdentity = async (identity: string) => {
    await apiFetch(`/api/ses?identity=${encodeURIComponent(identity)}`, { method: "DELETE" });
    fetchIdentities();
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="SES — Simple Email Service"
          serviceIcon={SERVICE_ICONS["/ses"]?.small}
          counter={0}
          primaryAction=<button
            type="button"
            className="aws-service-page__create"
            onClick={() => router.push("/ses/create")}
          >
            Create identity
          </button>
        />
        {error && (
          <Alert type="error" header="Error">
            {error}
          </Alert>
        )}
        <Table
          header={
            <Header
              variant="h2"
              actions={<Button onClick={() => setCreateModal(true)}>Verify identity</Button>}
            >
              Identities ({identities.length})
            </Header>
          }
          items={identities}
          loading={loading}
          columnDefinitions={[
            { header: "Identity", cell: (item) => item.identity },
            {
              header: "Actions",
              cell: (item) => (
                <Button onClick={() => deleteIdentity(item.identity)} formAction="none">
                  Delete
                </Button>
              ),
            },
          ]}
          empty={<Box textAlign="center">No verified identities.</Box>}
        />

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Verify email identity"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={verifyIdentity}>
                Verify
              </Button>
            </SpaceBetween>
          }
        >
          <FormField label="Email address">
            <Input
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.detail.value)}
              placeholder="user@example.com"
            />
          </FormField>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
