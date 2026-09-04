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
import Tabs from "@cloudscape-design/components/tabs";

interface WAFv2WebACL {
  Id: string;
  Name: string;
  ARN: string;
  Description?: string;
}

interface WAFv2Rule {
  Name?: string;
  Priority?: number;
  Action?: { Allow?: {}; Block?: {} };
  Statement?: Record<string, unknown>;
}

export default function WAFv2Page() {
  const [webAcls, setWebAcls] = useState<WAFv2WebACL[]>([]);
  const [rules, setRules] = useState<WAFv2Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [aclName, setAclName] = useState("");
  const [selectedAcl, setSelectedAcl] = useState<WAFv2WebACL | null>(null);
  const [rulesModal, setRulesModal] = useState(false);

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

  const fetchRules = async (acl: WAFv2WebACL) => {
    setSelectedAcl(acl);
    setRulesModal(true);
    setRulesLoading(true);
    try {
      const res = await fetch(`/api/wafv2?action=getWebAcl&name=${encodeURIComponent(acl.Name)}&scope=REGIONAL`);
      const data = await res.json();
      if (!res.ok || data.error) {
        setRules([]);
      } else {
        setRules((data.webAcl?.WebACL?.Rules || []) as WAFv2Rule[]);
      }
    } catch {
      setRules([]);
    } finally {
      setRulesLoading(false);
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
              <Header variant="h2" actions={<Button onClick={() => setCreateModal(true)}>Create web ACL</Button>}>
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
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button onClick={() => fetchRules(item)} formAction="none">Rules</Button>
                    <Button onClick={() => deleteWebAcl(item.Name, item.Id)} formAction="none">
                      Delete
                    </Button>
                  </SpaceBetween>
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
              <Button variant="primary" onClick={createWebAcl}>Create</Button>
            </SpaceBetween>
          }
        >
          <FormField label="Name">
            <Input value={aclName} onChange={(e) => setAclName(e.detail.value)} placeholder="my-web-acl" />
          </FormField>
        </Modal>
        <Modal
          visible={rulesModal}
          onDismiss={() => { setRulesModal(false); setSelectedAcl(null); setRules([]); }}
          header={`Rules — ${selectedAcl?.Name ?? ""}`}
          footer={<Button onClick={() => { setRulesModal(false); setSelectedAcl(null); setRules([]); }}>Close</Button>}
        >
          <Table
            items={rules}
            loading={rulesLoading}
            columnDefinitions={[
              { header: "Name", cell: (item) => item.Name || "—" },
              { header: "Priority", cell: (item) => String(item.Priority || "—") },
              { header: "Action", cell: (item) => (item.Action?.Allow ? "Allow" : item.Action?.Block ? "Block" : "—") },
            ]}
            empty={<Box textAlign="center">No rules found for this Web ACL.</Box>}
          />
        </Modal>
      </SpaceBetween>
    </div>
  );
}
