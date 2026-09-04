"use client";

import React, { useEffect, useState, useCallback } from "react";
import Header from "@cloudscape-design/components/header";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import Modal from "@cloudscape-design/components/modal";
import Input from "@cloudscape-design/components/input";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import FormField from "@cloudscape-design/components/form-field";
import Tabs from "@cloudscape-design/components/tabs";
import IamPolicyEditor from "@/components/IamPolicyEditor";

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
  const [policyDoc, setPolicyDoc] = useState(JSON.stringify({ Version: "2012-10-17", Statement: [] }, null, 2));
  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null);

  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/iam");
      const data = await res.json();
      setPolicies((data.policies || []).map((p: any) => ({
        PolicyName: p.PolicyName || "",
        PolicyArn: p.Arn || "",
        Arn: p.Arn || "",
        Path: p.Path || "/",
        CreateDate: p.CreateDate || "",
      })));
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchPolicies(); }, [fetchPolicies]);

  const createPolicy = async () => {
    await fetch("/api/iam", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "createPolicy", policyName, policyDocument: policyDoc }),
    });
    setCreateModal(false);
    setPolicyName("");
    setPolicyDoc(JSON.stringify({ Version: "2012-10-17", Statement: [] }, null, 2));
    fetchPolicies();
  };

  const deletePolicy = async (arn: string) => {
    await fetch(`/api/iam?type=policy&name=${encodeURIComponent(arn)}`, { method: "DELETE" });
    fetchPolicies();
  };

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">IAM Policies</Header>
        <Container
          header={
            <Header variant="h2" actions={<Button onClick={() => setCreateModal(true)}>Create Policy</Button>}>
              Managed Policies
            </Header>
          }
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
                    <Button onClick={() => setSelectedPolicy(item.PolicyArn)} formAction="none">View</Button>
                    <Button onClick={() => deletePolicy(item.Arn || item.PolicyArn)} formAction="none">Delete</Button>
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

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create Managed Policy"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createPolicy}>Create</Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m">
            <FormField label="Policy Name">
              <Input value={policyName} onChange={(e) => setPolicyName((e as any).detail?.value || "")} />
            </FormField>
            <IamPolicyEditor label="Policy Document (JSON)" value={policyDoc} onChange={setPolicyDoc} />
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
