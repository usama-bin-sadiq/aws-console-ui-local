"use client";
import React, { useEffect, useState } from "react";
import Header from "@cloudscape-design/components/header";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Alert from "@cloudscape-design/components/alert";
import Modal from "@cloudscape-design/components/modal";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";

interface WAFv2WebACL {
  Id: string;
  Name: string;
  ARN: string;
  Description?: string;
}

export default function WAFv2Page() {
  const [webAcls, setWebAcls] = useState<WAFv2WebACL[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [aclName, setAclName] = useState("");

  const fetchWebAcls = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/wafv2");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setWebAcls(data.webAcls || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebAcls();
  }, []);

  const createWebAcl = async () => {
    await fetch("/api/wafv2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", name: aclName }),
    });
    setCreateModal(false);
    setAclName("");
    fetchWebAcls();
  };

  const deleteWebAcl = async (name: string, id: string) => {
    await fetch(
      `/api/wafv2?name=${encodeURIComponent(name)}&id=${encodeURIComponent(id)}&lockToken=dummy`,
      { method: "DELETE" }
    );
    fetchWebAcls();
  };

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">WAF v2 — Web Application Firewall</Header>
        {error && <Alert type="error" header="Error">{error}</Alert>}
        <Container>
          <Table
            header={
              <Header
                variant="h2"
                actions={<Button onClick={() => setCreateModal(true)}>Create web ACL</Button>}
              >
                Web ACLs ({webAcls.length})
              </Header>
            }
            items={webAcls}
            loading={loading}
            columnDefinitions={[
              { header: "Name", cell: (item) => item.Name },
              { header: "ID", cell: (item) => item.Id },
              { header: "ARN", cell: (item) => item.ARN },
              {
                header: "Actions",
                cell: (item) => (
                  <Button onClick={() => deleteWebAcl(item.Name, item.Id)} formAction="none">
                    Delete
                  </Button>
                ),
              },
            ]}
            empty={<Box textAlign="center">No Web ACLs found.</Box>}
          />
        </Container>
        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create web ACL"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createWebAcl}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <FormField label="Name">
            <Input
              value={aclName}
              onChange={(e) => setAclName(e.detail.value)}
              placeholder="my-web-acl"
            />
          </FormField>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
