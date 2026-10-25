"use client";

import { apiFetch } from "@/lib/api-client";
import { useEffect, useState } from "react";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import Modal from "@cloudscape-design/components/modal";
import Input from "@cloudscape-design/components/input";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import FormField from "@cloudscape-design/components/form-field";
import Header from "@cloudscape-design/components/header";
import { useRouter } from "next/navigation";
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";

interface SAMLProvider {
  Arn?: string;
  ValidUntil?: string;
  CreateDate?: string;
}

export default function IAMSAMLPage() {
  const [samlProviders, setSamlProviders] = useState<SAMLProvider[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const [createModal, setCreateModal] = useState(false);
  const [providerName, setProviderName] = useState("");

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/iam-saml");
      const data = await res.json();
      setSamlProviders(data.samlProviders || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    queueMicrotask(() => {
      fetchProviders();
    });
  }, []);

  const createProvider = async () => {
    await apiFetch("/api/iam-saml", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: providerName }),
    });
    setCreateModal(false);
    setProviderName("");
    fetchProviders();
  };

  const deleteProvider = async (arn: string) => {
    await apiFetch(`/api/iam-saml?arn=${encodeURIComponent(arn)}`, { method: "DELETE" });
    fetchProviders();
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="IAM SAML Providers"
          serviceIcon={SERVICE_ICONS["/iam-saml"]?.small}
          counter={0}
          primaryAction=<button
            type="button"
            className="aws-service-page__create"
            onClick={() => router.push("/iam-saml/create")}
          >
            Create provider
          </button>
        />
        <Container
          header={
            <Header
              variant="h2"
              actions={<Button onClick={() => setCreateModal(true)}>Create SAML Provider</Button>}
            >
              SAML Providers
            </Header>
          }
          className="aws-table-card"
        >
          <Table
            items={samlProviders}
            loading={loading}
            columnDefinitions={[
              { header: "ARN", cell: (item) => item.Arn || "—" },
              {
                header: "Created",
                cell: (item) =>
                  item.CreateDate ? new Date(item.CreateDate).toLocaleString() : "—",
              },
              {
                header: "Actions",
                cell: (item) => (
                  <Button
                    onClick={() => deleteProvider(item.Arn!)}
                    formAction="none"
                    disabled={!item.Arn}
                  >
                    Delete
                  </Button>
                ),
              },
            ]}
            empty={<Box>No SAML providers found.</Box>}
          />
        </Container>

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create SAML Provider"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createProvider}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <FormField label="Provider Name">
            <Input value={providerName} onChange={(e) => setProviderName(e.detail.value)} />
          </FormField>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
