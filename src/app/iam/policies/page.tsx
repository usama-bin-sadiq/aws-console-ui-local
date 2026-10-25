"use client";

import { apiFetch } from "@/lib/api-client";
import React, { useEffect, useState, useCallback } from "react";
import Header from "@cloudscape-design/components/header";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import ButtonDropdown from "@cloudscape-design/components/button-dropdown";
import Modal from "@cloudscape-design/components/modal";
import Input from "@cloudscape-design/components/input";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import FormField from "@cloudscape-design/components/form-field";
import Tabs from "@cloudscape-design/components/tabs";
import IamPolicyEditor from "@/components/IamPolicyEditor";
import Alert from "@cloudscape-design/components/alert";

interface PolicyItem {
  PolicyName: string;
  PolicyArn: string;
  Arn: string;
  Path: string;
  CreateDate?: string;
}

export default function IAMPoliciesPage() {
  const [policies, setPolicies] = useState<PolicyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [policyName, setPolicyName] = useState("");
  const [policyDoc, setPolicyDoc] = useState(
    JSON.stringify({ Version: "2012-10-17", Statement: [] }, null, 2),
  );
  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null);
  const [policyDocument, setPolicyDocument] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PolicyItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/iam");
      const data = await res.json().catch(() => null);
      if (data === null || !res.ok || data.error) {
        throw new Error(data?.message || data?.error || `Request failed (HTTP ${res.status})`);
      }
      const list = Array.isArray(data.policies)
        ? data.policies
        : Array.isArray(data.Policies)
          ? data.Policies
          : Array.isArray(data.items)
            ? data.items
            : [];
      setPolicies(
        list.map((p: any) => ({
          PolicyName: p.PolicyName || "",
          PolicyArn: p.Arn || "",
          Arn: p.Arn || "",
          Path: p.Path || "/",
          CreateDate: p.CreateDate || "",
        })),
      );
      setError(null);
    } catch (e) {
      setPolicies([]);
      setError(e instanceof Error ? e.message : "Failed to load policies");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const createPolicy = async () => {
    if (!policyName.trim()) return;
    const response = await apiFetch("/api/iam", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "createPolicy", policyName, policyDocument: policyDoc }),
    });
    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      setError(result.error || "Failed to create policy");
      return;
    }
    setCreateModal(false);
    setPolicyName("");
    setPolicyDoc(JSON.stringify({ Version: "2012-10-17", Statement: [] }, null, 2));
    fetchPolicies();
  };

  const loadPolicy = async (arn: string) => {
    setSelectedPolicy(arn);
    const response = await apiFetch(
      `/api/iam?action=getPolicy&policyArn=${encodeURIComponent(arn)}`,
    );
    const result = (await response.json()) as {
      policy?: { DefaultVersionId?: string };
      document?: string;
      error?: string;
    };
    if (!response.ok || result.error) {
      setError(result.error || "Failed to load policy");
      return;
    }
    const document = result.document ? decodeURIComponent(result.document) : result.policy || {};
    setPolicyDocument(typeof document === "string" ? document : JSON.stringify(document, null, 2));
  };

  const deletePolicy = async () => {
    if (!deleteTarget) return;
    const response = await apiFetch(
      `/api/iam?type=policy&name=${encodeURIComponent(deleteTarget.Arn || deleteTarget.PolicyArn)}`,
      { method: "DELETE" },
    );
    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      setError(result.error || "Failed to delete policy");
      return;
    }
    setDeleteTarget(null);
    if (selectedPolicy === deleteTarget.PolicyArn) {
      setSelectedPolicy(null);
      setPolicyDocument(null);
    }
    await fetchPolicies();
  };

  return (
    <Box padding="m" className="service-content">
      <SpaceBetween size="l">
        <Header
          variant="h1"
          actions={
            <Button iconName="refresh" onClick={fetchPolicies}>
              Refresh
            </Button>
          }
        >
          IAM Policies
        </Header>
        {error ? (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        ) : null}
        <Container
          header={
            <Header
              variant="h2"
              actions={<Button onClick={() => setCreateModal(true)}>Create Policy</Button>}
            >
              Managed Policies
            </Header>
          }
          className="aws-table-card"
        >
          <Table
            items={policies}
            loading={loading}
            columnDefinitions={[
              { header: "Policy Name", cell: (item: PolicyItem) => item.PolicyName },
              { header: "ARN", cell: (item: PolicyItem) => item.Arn || item.PolicyArn },
              { header: "Path", cell: (item: PolicyItem) => item.Path },
              { header: "Created", cell: (item: PolicyItem) => item.CreateDate || "—" },
              {
                header: "Actions",
                cell: (item: PolicyItem) => (
                  <SpaceBetween direction="horizontal" size="xs">
                    <ButtonDropdown
                      items={[
                        { id: "view", text: "View policy" },
                        { id: "delete", text: "Delete policy" },
                      ]}
                      ariaLabel={`Actions for policy ${item.PolicyName}`}
                      onItemClick={({ detail }) => {
                        if (detail.id === "view") void loadPolicy(item.PolicyArn);
                        if (detail.id === "delete") setDeleteTarget(item);
                      }}
                    >
                      Actions
                    </ButtonDropdown>
                  </SpaceBetween>
                ),
              },
            ]}
            empty={<Box>No policies found.</Box>}
            selectionType="single"
            onSelectionChange={({ detail }) => {
              const item = detail.selectedItems[0] as PolicyItem | undefined;
              if (item) setSelectedPolicy(item.PolicyArn);
            }}
          />
        </Container>

        {selectedPolicy && policyDocument ? (
          <Container header={<Header variant="h2">Policy document</Header>}>
            <IamPolicyEditor label={selectedPolicy} value={policyDocument} readOnly />
          </Container>
        ) : null}

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create Managed Policy"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createPolicy}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m">
            <FormField label="Policy Name">
              <Input
                value={policyName}
                onChange={(e: { detail?: { value?: string } }) => setPolicyName((e.detail?.value || ""))}
              />
            </FormField>
            <IamPolicyEditor
              label="Policy Document (JSON)"
              value={policyDoc}
              onChange={setPolicyDoc}
            />
          </SpaceBetween>
        </Modal>

        <Modal
          visible={Boolean(deleteTarget)}
          onDismiss={() => setDeleteTarget(null)}
          header="Delete managed policy"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="primary" onClick={() => void deletePolicy()}>
                Delete policy
              </Button>
            </SpaceBetween>
          }
        >
          <Box>
            Delete {deleteTarget?.PolicyName || "this policy"}? This action cannot be undone.
          </Box>
        </Modal>
      </SpaceBetween>
    </Box>
  );
}
