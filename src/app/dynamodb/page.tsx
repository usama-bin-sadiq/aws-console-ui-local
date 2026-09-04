"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@cloudscape-design/components/header";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import Modal from "@cloudscape-design/components/modal";
import Input from "@cloudscape-design/components/input";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import FormField from "@cloudscape-design/components/form-field";

interface DynamoTable { TableName?: string; TableStatus?: string; ItemCount?: number; }

export default function DynamoDBPage() {
  const router = useRouter();
  const [tables, setTables] = useState<DynamoTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [newTable, setNewTable] = useState("");

  const fetchTables = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dynamodb");
      const data = await res.json();
      setTables(data.tables || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchTables(); }, []);

  const createTable = async () => {
    await fetch("/api/dynamodb", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        TableName: newTable,
        KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
        AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
        BillingMode: "PAY_PER_REQUEST",
      }),
    });
    setCreateModal(false);
    setNewTable("");
    fetchTables();
  };

  const deleteTable = async (name: string) => {
    await fetch(`/api/dynamodb?tableName=${name}`, { method: "DELETE" });
    fetchTables();
  };

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header
          variant="h1"
          actions={
            <Button variant="primary" onClick={() => setCreateModal(true)} ariaLabel="Create DynamoDB table">
              Create Table
            </Button>
          }
        >
          DynamoDB
        </Header>

        <Container>
          <Table
            header={<Header variant="h2">Tables ({tables.length})</Header>}
            items={tables}
            columnDefinitions={[
              { header: "Name", cell: (item) => (
                <a href={`/dynamodb/${encodeURIComponent(item.TableName || "")}`} style={{ color: "var(--awsui-color-text-interactive-default)", textDecoration: "underline" }}>
                  {item.TableName}
                </a>
              ) },
              { header: "Status", cell: (item) => item.TableStatus },
              { header: "Items", cell: (item) => item.ItemCount || 0 },
              {
                header: "Actions",
                cell: (item) => (
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button onClick={() => router.push(`/dynamodb/${encodeURIComponent(item.TableName!)}`)} formAction="none" ariaLabel={`View DynamoDB table ${item.TableName}`}>View</Button>
                    <Button onClick={() => deleteTable(item.TableName!)} formAction="none" ariaLabel={`Delete DynamoDB table ${item.TableName}`}>Delete</Button>
                  </SpaceBetween>
                ),
              },
            ]}
            loading={loading}
            empty={<Box textAlign="center">No tables found. Create one to get started.</Box>}
          />
        </Container>

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create DynamoDB Table"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createTable}>Create</Button>
            </SpaceBetween>
          }
        >
          <FormField label="Table Name">
            <Input value={newTable} onChange={(e) => setNewTable(e.detail.value)} />
          </FormField>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
