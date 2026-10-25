"use client";

import { apiFetch } from "@/lib/api-client";
import React, { useEffect, useState } from "react";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import Modal from "@cloudscape-design/components/modal";
import Input from "@cloudscape-design/components/input";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import FormField from "@cloudscape-design/components/form-field";
import Header from "@cloudscape-design/components/header";
import { useRouter } from 'next/navigation';
import { AwsServiceHeader } from '@/components/ui/AwsServiceHeader';
import { SERVICE_ICONS } from '@/constants/service-icons';

interface VirtualMFADevice {
  SerialNumber: string;
  EnableDate?: string;
  User?: { UserName?: string };
}

export default function IAMVirtualMFAPage() {
  const [mfaDevices, setMfaDevices] = useState<VirtualMFADevice[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();  const [createModal, setCreateModal] = useState(false);
  const [deviceName, setDeviceName] = useState("");

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/iam-virtual-mfa");
      const data = await res.json();
      setMfaDevices(data.mfaDevices || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const createDevice = async () => {
    await apiFetch("/api/iam-virtual-mfa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: deviceName }),
    });
    setCreateModal(false);
    setDeviceName("");
    fetchDevices();
  };

  const deleteDevice = async (serialNumber: string) => {
    await apiFetch(`/api/iam-virtual-mfa?serialNumber=${encodeURIComponent(serialNumber)}`, {
      method: "DELETE",
    });
    fetchDevices();
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="IAM Virtual MFA Devices"
          serviceIcon={SERVICE_ICONS["/iam-virtual-mfa"]?.small}
          counter={0}
          primaryAction=<button type="button" className="aws-service-page__create" onClick={() => router.push("/iam-virtual-mfa/create")}>
            Create MFA device
        </button>

        />
        <Container
          header={
            <Header
              variant="h2"
              actions={<Button onClick={() => setCreateModal(true)}>Create MFA Device</Button>}
            >
              Virtual MFA Devices
            </Header>
          }
          className="aws-table-card"
        >
          <Table
            items={mfaDevices}
            loading={loading}
            columnDefinitions={[
              { header: "Serial Number", cell: (item) => item.SerialNumber },
              {
                header: "Enable Date",
                cell: (item) =>
                  item.EnableDate ? new Date(item.EnableDate).toLocaleString() : "—",
              },
              {
                header: "Assigned User",
                cell: (item) => item.User?.UserName || "—",
              },
              {
                header: "Actions",
                cell: (item) => (
                  <Button onClick={() => deleteDevice(item.SerialNumber)} formAction="none">
                    Delete
                  </Button>
                ),
              },
            ]}
            empty={<Box>No virtual MFA devices found.</Box>}
          />
        </Container>

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create Virtual MFA Device"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createDevice}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <FormField label="Device Name">
            <Input value={deviceName} onChange={(e) => setDeviceName(e.detail.value)} />
          </FormField>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
