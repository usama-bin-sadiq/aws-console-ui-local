"use client";

import React, { useEffect, useState, useCallback } from "react";
import Header from "@cloudscape-design/components/header";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import ButtonDropdown from "@cloudscape-design/components/button-dropdown";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Modal from "@cloudscape-design/components/modal";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Select from "@cloudscape-design/components/select";
import Alert from "@cloudscape-design/components/alert";
import TextFilter from "@cloudscape-design/components/text-filter";
import Pagination from "@cloudscape-design/components/pagination";
import { EC2KeyPair } from "@/types/ec2";

export default function KeyPairPage() {
  const [keyPairs, setKeyPairs] = useState<EC2KeyPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<EC2KeyPair[]>([]);
  const [filteringText, setFilteringText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [createModal, setCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyType, setNewKeyType] = useState("rsa");
  const [createdKeyMaterial, setCreatedKeyMaterial] = useState<string | null>(null);

  const fetchKeyPairs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ec2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "describeKeyPairs" }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setKeyPairs(data.keyPairs || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch key pairs");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchKeyPairs();
  }, [fetchKeyPairs]);

  const handleCreate = useCallback(async () => {
    if (!newKeyName.trim()) return;
    try {
      const res = await fetch("/api/ec2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createKeyPair",
          keyName: newKeyName,
          keyType: newKeyType,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to create key pair");
      setCreatedKeyMaterial(data.keyPair?.KeyMaterial || null);
      fetchKeyPairs();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create key pair");
    }
  }, [newKeyName, newKeyType, fetchKeyPairs]);

  const handleDelete = useCallback(async () => {
    const names = selectedItems.map((k) => k.KeyName).filter(Boolean);
    if (names.length === 0) return;
    try {
      for (const name of names) {
        await fetch("/api/ec2", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "deleteKeyPair", keyName: name }),
        });
      }
      setSelectedItems([]);
      fetchKeyPairs();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete key pair");
    }
  }, [selectedItems, fetchKeyPairs]);

  const filteredItems = keyPairs.filter((kp) => {
    if (!filteringText.trim()) return true;
    return kp.KeyName?.toLowerCase().includes(filteringText.toLowerCase());
  });

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header
          variant="h1"
          counter={`(${keyPairs.length})`}
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button iconName="refresh" onClick={fetchKeyPairs} ariaLabel="Refresh" />
              <ButtonDropdown
                items={[
                  {
                    text: "Delete key pairs",
                    id: "delete",
                    disabled: selectedItems.length === 0,
                  },
                ]}
                onItemClick={() => handleDelete()}
                disabled={selectedItems.length === 0}
                ariaLabel="Key pair actions"
              >
                Actions
              </ButtonDropdown>
              <Button variant="primary" onClick={() => setCreateModal(true)}>
                Create key pair
              </Button>
            </SpaceBetween>
          }
        >
          Key pairs
        </Header>

        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Container>
          <Table
            columnDefinitions={[
              {
                id: "name",
                header: "Key pair name",
                cell: (item) => item.KeyName,
                sortingField: "KeyName",
                isRowHeader: true,
              },
              {
                id: "fingerprint",
                header: "Key pair fingerprint",
                cell: (item) => item.KeyFingerprint || "—",
              },
              {
                id: "type",
                header: "Type",
                cell: (item) => item.KeyType || "rsa",
              },
            ]}
            items={filteredItems.slice((currentPage - 1) * 25, currentPage * 25)}
            loading={loading}
            loadingText="Loading key pairs..."
            selectionType="multi"
            selectedItems={selectedItems}
            onSelectionChange={({ detail }) => setSelectedItems(detail.selectedItems as EC2KeyPair[])}
            trackBy="KeyName"
            filter={
              <TextFilter
                filteringText={filteringText}
                filteringPlaceholder="Filter key pairs"
                filteringAriaLabel="Filter key pairs"
                onChange={({ detail }) => {
                  setFilteringText(detail.filteringText);
                  setCurrentPage(1);
                }}
              />
            }
            pagination={
              <Pagination
                currentPageIndex={currentPage}
                pagesCount={Math.ceil(filteredItems.length / 25)}
                onChange={({ detail }) => setCurrentPage(detail.currentPageIndex)}
              />
            }
            empty={
              <Box textAlign="center" color="inherit">
                <Box variant="strong" textAlign="center" color="inherit">
                  No key pairs found
                </Box>
                <Box variant="p" padding={{ bottom: "s" }} color="inherit">
                  Create a key pair to connect to your EC2 instances.
                </Box>
                <Button onClick={() => setCreateModal(true)}>Create key pair</Button>
              </Box>
            }
          />
        </Container>
      </SpaceBetween>

      <Modal
        visible={createModal}
        onDismiss={() => {
          setCreateModal(false);
          setCreatedKeyMaterial(null);
          setNewKeyName("");
        }}
        header="Create key pair"
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => {
              setCreateModal(false);
              setCreatedKeyMaterial(null);
              setNewKeyName("");
            }} formAction="none">
              Close
            </Button>
            {!createdKeyMaterial && (
              <Button variant="primary" onClick={handleCreate} disabled={!newKeyName.trim()}>
                Create key pair
              </Button>
            )}
          </SpaceBetween>
        }
      >
        {createdKeyMaterial ? (
          <SpaceBetween size="m">
            <Alert type="success">
              Key pair created successfully. Download your private key file now. You cannot download it again.
            </Alert>
            <Container header={<Header variant="h3">Key Material</Header>}>
              <pre style={{
                background: "#1a1a2e",
                color: "#e0e0e0",
                padding: "16px",
                borderRadius: "4px",
                overflow: "auto",
                maxHeight: "200px",
                fontFamily: "monospace",
                fontSize: "12px",
              }}>
                {createdKeyMaterial}
              </pre>
            </Container>
            <Button
              onClick={() => {
                const blob = new Blob([createdKeyMaterial], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${newKeyName}.pem`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Download .pem file
            </Button>
          </SpaceBetween>
        ) : (
          <SpaceBetween size="m">
            <FormField label="Key pair name">
              <Input
                value={newKeyName}
                onChange={({ detail }) => setNewKeyName(detail.value)}
                placeholder="Enter key pair name"
              />
            </FormField>
            <FormField label="Key pair type">
              <Select
                selectedOption={{ value: newKeyType, label: newKeyType === "rsa" ? "RSA (recommended)" : "ED25519" }}
                options={[
                  { value: "rsa", label: "RSA (recommended)" },
                  { value: "ed25519", label: "ED25519" },
                ]}
                onChange={({ detail }) => setNewKeyType(detail.selectedOption.value || "rsa")}
              />
            </FormField>
          </SpaceBetween>
        )}
      </Modal>
    </div>
  );
}
