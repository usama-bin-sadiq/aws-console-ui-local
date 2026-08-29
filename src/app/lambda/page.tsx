"use client";

import React, { useEffect, useState } from "react";
import Header from "@cloudscape-design/components/header";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Modal from "@cloudscape-design/components/modal";
import Textarea from "@cloudscape-design/components/textarea";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";

interface LambdaFunction { FunctionName?: string; Runtime?: string; LastModified?: string; State?: string; }

export default function LambdaPage() {
  const [functions, setFunctions] = useState<LambdaFunction[]>([]);
  const [loading, setLoading] = useState(true);
  const [invokeModal, setInvokeModal] = useState(false);
  const [selectedFn, setSelectedFn] = useState("");
  const [payload, setPayload] = useState("{}");
  const [invokeResult, setInvokeResult] = useState("");

  const fetchFunctions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/lambda");
      const data = await res.json();
      setFunctions(data.functions || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchFunctions(); }, []);

  const invokeFunction = async () => {
    const res = await fetch("/api/lambda", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "invoke", functionName: selectedFn, payload }),
    });
    const data = await res.json();
    setInvokeResult(JSON.stringify(data.result, null, 2));
  };

  const deleteFunction = async (name: string) => {
    await fetch(`/api/lambda?functionName=${name}`, { method: "DELETE" });
    fetchFunctions();
  };

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">Lambda</Header>

        <Container>
          <Table
            header={<Header variant="h2">Functions ({functions.length})</Header>}
            items={functions}
            columnDefinitions={[
              { header: "Name", cell: (item) => item.FunctionName },
              { header: "Runtime", cell: (item) => item.Runtime },
              { header: "State", cell: (item) => <StatusIndicator type="success">{item.State}</StatusIndicator> },
              { header: "Modified", cell: (item) => item.LastModified },
              {
                header: "Actions",
                cell: (item) => (
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button onClick={() => { setSelectedFn(item.FunctionName!); setInvokeModal(true); }} formAction="none">
                      Invoke
                    </Button>
                    <Button onClick={() => deleteFunction(item.FunctionName!)} formAction="none">
                      Delete
                    </Button>
                  </SpaceBetween>
                ),
              },
            ]}
            loading={loading}
            empty={<Box textAlign="center">No functions found.</Box>}
          />
        </Container>

        <Modal
          visible={invokeModal}
          onDismiss={() => { setInvokeModal(false); setInvokeResult(""); }}
          header={`Invoke ${selectedFn}`}
          footer={
            <Button variant="primary" onClick={() => { invokeFunction(); }}>Invoke</Button>
          }
        >
          <SpaceBetween size="m">
            <FormField label="Payload (JSON)">
              <Textarea value={payload} onChange={(e) => setPayload(e.detail.value)} rows={6} />
            </FormField>
            {invokeResult && (
              <FormField label="Result">
                <pre style={{ background: "#1a1a2e", color: "#0f0", padding: "12px", borderRadius: "4px", overflow: "auto", maxHeight: "300px" }}>
                  {invokeResult}
                </pre>
              </FormField>
            )}
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
