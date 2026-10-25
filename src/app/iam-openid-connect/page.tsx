"use client";

import { apiFetch } from "@/lib/api-client";
import React, { useEffect, useState } from "react";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import Modal from "@cloudscape-design/components/modal";
import Input from "@cloudscape-design/components/input";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import FormField from "@cloudscape-design/components/form-field";
import Header from "@cloudscape-design/components/header";
import { useRouter } from 'next/navigation';
import { AwsServiceHeader } from '@/components/ui/AwsServiceHeader';
import { SERVICE_ICONS } from '@/constants/service-icons';

interface OIDCProvider {
  Arn?: string;
}

export default function IAMOpenIDConnectPage() {
  const [providers, setProviders] = useState<OIDCProvider[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();  const [createModal, setCreateModal] = useState(false);
  const [providerUrl, setProviderUrl] = useState("");
  const [clientId, setClientId] = useState("");

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/iam-openid-connect");
      const data = await res.json();
      setProviders(data.providers || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const createProvider = async () => {
    await apiFetch("/api/iam-openid-connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: providerUrl, clientId }),
    });
    setCreateModal(false);
    setProviderUrl("");
    setClientId("");
    fetchProviders();
  };

  const deleteProvider = async (arn: string) => {
    await apiFetch(`/api/iam-openid-connect?arn=${encodeURIComponent(arn)}`, { method: "DELETE" });
    fetchProviders();
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="IAM OIDC Providers"
          serviceIcon={SERVICE_ICONS["/iam-openid-connect"]?.small}
          counter={0}
          primaryAction=<button type="button" className="aws-service-page__create" onClick={() => router.push("/iam-openid-connect/create")}>
            Create provider
        </button>

        />
        <Container
          header={
            <Header
              variant="h2"
              actions={<Button onClick={() => setCreateModal(true)}>Create OIDC Provider</Button>}
            >
              OpenID Connect Providers
            </Header>
          }
          className="aws-table-card"
        >
          <Table
            items={providers}
            loading={loading}
            columnDefinitions={[
              { header: "ARN", cell: (item) => item.Arn || "—" },
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
            empty={<Box>No OIDC providers found.</Box>}
          />
        </Container>

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create OIDC Provider"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createProvider}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m">
            <FormField label="Provider URL">
              <Input
                value={providerUrl}
                onChange={(e) => setProviderUrl(e.detail.value)}
                placeholder="https://token.example.com"
              />
            </FormField>
            <FormField label="Client ID">
              <Input
                value={clientId}
                onChange={(e) => setClientId(e.detail.value)}
                placeholder="sts.amazonaws.com"
              />
            </FormField>
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
