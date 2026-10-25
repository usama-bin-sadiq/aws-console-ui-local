"use client";
import { apiFetch } from "@/lib/api-client";
import React, { useEffect, useState } from "react";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Alert from "@cloudscape-design/components/alert";
import Modal from "@cloudscape-design/components/modal";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Header from "@cloudscape-design/components/header";
import { useRouter } from 'next/navigation';
import { AwsServiceHeader } from '@/components/ui/AwsServiceHeader';
import { SERVICE_ICONS } from '@/constants/service-icons';

interface OrgAccount {
  Id: string;
  Name: string;
  Email: string;
  Status: string;
}
interface Organization {
  Id?: string;
  MasterAccountId?: string;
}

export default function OrganizationsPage() {
  const [accounts, setAccounts] = useState<OrgAccount[]>([]);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();  const [error, setError] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [email, setEmail] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/organizations");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAccounts(data.accounts || []);
      setOrganization(data.organization || null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const createAccount = async () => {
    await apiFetch("/api/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountName, email }),
    });
    setCreateModal(false);
    setAccountName("");
    setEmail("");
    fetchData();
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="AWS Organizations"
          serviceIcon={SERVICE_ICONS["/organizations"]?.small}
          counter={0}
          primaryAction=<button type="button" className="aws-service-page__create" onClick={() => router.push("/organizations/create")}>
            Create organization
        </button>

        />
        {error && (
          <Alert type="error" header="Error">
            {error}
          </Alert>
        )}
        {organization && (
          <Container header={<Header variant="h2">Organization</Header>}>
            <SpaceBetween size="xs">
              <Box>
                <strong>Organization ID:</strong> {organization.Id || "—"}
              </Box>
              <Box>
                <strong>Master Account:</strong> {organization.MasterAccountId || "—"}
              </Box>
            </SpaceBetween>
          </Container>
        )}
        <Table
          header={
            <Header
              variant="h2"
              actions={<Button onClick={() => setCreateModal(true)}>Create account</Button>}
            >
              Accounts ({accounts.length})
            </Header>
          }
          items={accounts}
          loading={loading}
          columnDefinitions={[
            { header: "Name", cell: (i) => i.Name },
            { header: "ID", cell: (i) => i.Id },
            { header: "Email", cell: (i) => i.Email },
            { header: "Status", cell: (i) => i.Status },
          ]}
          empty={<Box textAlign="center">No accounts found.</Box>}
        />

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create account"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createAccount}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m">
            <FormField label="Account name">
              <Input value={accountName} onChange={(e) => setAccountName(e.detail.value)} />
            </FormField>
            <FormField label="Email">
              <Input value={email} onChange={(e) => setEmail(e.detail.value)} type="email" />
            </FormField>
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
