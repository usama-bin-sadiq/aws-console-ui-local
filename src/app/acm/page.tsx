"use client";

import { apiFetch } from "@/lib/api-client";
import { useEffect, useState } from "react";
import Table from "@cloudscape-design/components/table";
import Header from "@cloudscape-design/components/header";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Modal from "@cloudscape-design/components/modal";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Alert from "@cloudscape-design/components/alert";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import TruncatedText from "@/components/TruncatedText";
import { useRouter } from "next/navigation";

interface Certificate {
  CertificateArn: string;
  DomainName?: string;
  Status?: string;
}

export default function AcmPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const [error, setError] = useState("");
  const [createModal, setCreateModal] = useState(false);
  const [domainName, setDomainName] = useState("");
  const [creating, setCreating] = useState(false);
  const [domainNameError, setDomainNameError] = useState<string | null>(null);

  const fetchCertificates = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/acm");
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
    queueMicrotask(() => fetchCertificates());
  }, []);

  const createCertificate = async () => {
    if (!domainName.trim()) {
      setDomainNameError("Domain name is required");
      return;
    }
    setDomainNameError(null);
    setCreating(true);
    try {
      const res = await apiFetch("/api/acm", {
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
      const res = await apiFetch(`/api/acm?arn=${encodeURIComponent(arn)}`, { method: "DELETE" });
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
    <ServiceLayout
      serviceName="AWS Certificate Manager"
      serviceCategory="Security"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "Security", href: "#" },
        { text: "Certificate Manager", href: "#" },
      ]}
      headerActions={
        <SpaceBetween direction="horizontal" size="xs">
          <Button iconName="refresh" onClick={fetchCertificates} ariaLabel="Refresh certificates" />
          <Button
            variant="primary"
            onClick={() => setCreateModal(true)}
            ariaLabel="Request certificate"
          >
            Request certificate
          </Button>
        </SpaceBetween>
      }
    >
      <SpaceBetween size="m" direction="vertical">
        {error && (
          <Alert type="error" dismissible onDismiss={() => setError("")}>
            {error}
          </Alert>
        )}

        <Container
          header={<Header variant="h2">Certificates ({certificates.length})</Header>}
          className="aws-table-card"
        >
          <Table
            header={<Header variant="h2">Certificates</Header>}
            items={certificates}
            columnDefinitions={[
              {
                id: "domain",
                header: "Domain name",
                cell: (item) => item.DomainName || "—",
                isRowHeader: true,
              },
              {
                id: "status",
                header: "Status",
                cell: (item) => (
                  <StatusIndicator
                    type={
                      item.Status === "ISSUED"
                        ? "success"
                        : item.Status === "PENDING_VALIDATION"
                          ? "warning"
                          : "info"
                    }
                  >
                    {item.Status || "—"}
                  </StatusIndicator>
                ),
              },
              {
                id: "arn",
                header: "Certificate ARN",
                cell: (item) => <TruncatedText>{item.CertificateArn || "—"}</TruncatedText>,
              },
              {
                id: "actions",
                header: "Actions",
                cell: (item) => (
                  <Button
                    onClick={() => deleteCertificate(item.CertificateArn)}
                    formAction="none"
                    ariaLabel={`Delete certificate ${item.CertificateArn}`}
                  >
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
              <Button onClick={() => setCreateModal(false)} formAction="none">
                Cancel
              </Button>
              <Button variant="primary" onClick={createCertificate} loading={creating}>
                Request
              </Button>
            </SpaceBetween>
          }
        >
          <FormField
            label={
              <>
                Domain name <span style={{ color: "red" }}>*</span>
              </>
            }
            constraintText="Required"
            errorText={domainNameError}
          >
            <Input
              value={domainName}
              onChange={(e) => {
                setDomainName(e.detail.value);
                setDomainNameError(null);
              }}
              placeholder="example.com"
              ariaLabel="Domain name"
            />
          </FormField>
        </Modal>
      </SpaceBetween>
    </ServiceLayout>
  );
}
