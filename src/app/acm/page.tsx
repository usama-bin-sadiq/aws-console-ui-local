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

interface Certificate {
  CertificateArn: string;
  DomainName?: string;
  Status?: string;
}

export default function AcmPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createModal, setCreateModal] = useState(false);
  const [domainName, setDomainName] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchCertificates = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/acm");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch certificates");
      setCertificates(data.certificates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch certificates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const createCertificate = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/acm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainName }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to request certificate");
      }
      setCreateModal(false);
      setDomainName("");
      fetchCertificates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request certificate");
    } finally {
      setCreating(false);
    }
  };

  const deleteCertificate = async (arn: string) => {
    try {
      const res = await fetch(`/api/acm?arn=${encodeURIComponent(arn)}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete certificate");
      }
      fetchCertificates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete certificate");
    }
  };

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">AWS Certificate Manager</Header>

        {error && (
          <Alert type="error" onDismiss={() => setError("")}>
            {error}
          </Alert>
        )}

        <Container>
          <Table
            header={
              <Header
                variant="h2"
                actions={
                  <Button variant="primary" onClick={() => setCreateModal(true)}>
                    Request certificate
                  </Button>
                }
              >
                Certificates ({certificates.length})
              </Header>
            }
            items={certificates}
            columnDefinitions={[
              { header: "Domain name", cell: (item) => item.DomainName || "—" },
              { header: "Status", cell: (item) => item.Status || "—" },
              { header: "Certificate ARN", cell: (item) => item.CertificateArn },
              {
                header: "Actions",
                cell: (item) => (
                  <Button onClick={() => deleteCertificate(item.CertificateArn)} formAction="none">
                    Delete
                  </Button>
                ),
              },
            ]}
            loading={loading}
            empty={<Box textAlign="center">No certificates found.</Box>}
          />
        </Container>

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Request certificate"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createCertificate} loading={creating}>
                Request
              </Button>
            </SpaceBetween>
          }
        >
          <FormField label="Domain name" constraintText="Required">
            <Input
              value={domainName}
              onChange={(e) => setDomainName(e.detail.value)}
              placeholder="example.com"
            />
          </FormField>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
