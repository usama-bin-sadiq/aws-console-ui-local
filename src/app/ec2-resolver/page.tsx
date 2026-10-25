"use client";
import { apiFetch } from "@/lib/api-client";
import React, { useEffect, useState } from "react";
import Table from "@cloudscape-design/components/table";
import Header from "@cloudscape-design/components/header";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Alert from "@cloudscape-design/components/alert";
import Modal from "@cloudscape-design/components/modal";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Select from "@cloudscape-design/components/select";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import {
  AddressDraft,
  AddressFieldErrors,
  MIN_ENDPOINT_ADDRESSES,
  SubnetSummary,
  emptyAddress,
  toIpAddresses,
  validateEndpointAddresses,
} from "./endpoint-addresses";
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";

interface ResolverEndpoint {
  Id: string;
  Name?: string;
  Direction: string;
  Status: string;
  IpAddressCount: number;
}

/** Clears one field's message as soon as the user edits that field. */
function updateRowError(
  previous: AddressFieldErrors[],
  index: number,
  field: keyof AddressFieldErrors,
): AddressFieldErrors[] {
  if (!previous[index]?.[field]) return previous;
  const next = [...previous];
  next[index] = { ...next[index], [field]: undefined };
  return next;
}

export default function Route53ResolverPage() {
  const [endpoints, setEndpoints] = useState<ResolverEndpoint[]>([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [endpointName, setEndpointName] = useState("");
  const [creating, setCreating] = useState(false);
  // A resolver endpoint is a set of addresses inside a VPC, so the form edits
  // one row per address and starts with the two the API insists on.
  const [addresses, setAddresses] = useState<AddressDraft[]>([emptyAddress(), emptyAddress()]);
  const [addressErrors, setAddressErrors] = useState<AddressFieldErrors[]>([]);
  const [addressCountError, setAddressCountError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [subnets, setSubnets] = useState<SubnetSummary[]>([]);
  const [subnetNotice, setSubnetNotice] = useState<string | null>(null);

  const fetchEndpoints = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/route53resolver");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setEndpoints(data.endpoints || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEndpoints();
  }, []);

  // Subnets come from the EC2 emulator, not from Route 53: they are the only
  // place a resolver endpoint can take an address from, so the address editor
  // cannot be filled in without them.
  const fetchSubnets = async () => {
    setSubnetNotice(null);
    try {
      const res = await apiFetch("/api/subnet");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSubnets(data.subnets || []);
      // An emulator that answered with no subnets is not the same as one that
      // could not be asked, and the two call for different advice.
      if (!data.subnets || data.subnets.length === 0) {
        setSubnetNotice(
          "A resolver endpoint takes its IP addresses from subnets, and this account has none. Create a subnet in the VPC console, then open this form again.",
        );
      }
    } catch (err: unknown) {
      setSubnets([]);
      setSubnetNotice(
        `Subnets could not be loaded, so no subnet can be chosen here: ${
          err instanceof Error ? err.message : "unknown error"
        }`,
      );
    }
  };

  const openCreateModal = () => {
    setEndpointName("");
    setAddresses([emptyAddress(), emptyAddress()]);
    setAddressErrors([]);
    setAddressCountError(null);
    setCreateError(null);
    setCreateModal(true);
    fetchSubnets();
  };

  const updateAddress = (index: number, field: keyof AddressDraft, value: string) => {
    const next = [...addresses];
    next[index] = { ...next[index], [field]: value };
    setAddresses(next);
  };

  const addAddress = () => {
    setAddresses([...addresses, emptyAddress()]);
    setAddressCountError(null);
  };

  const removeAddress = (index: number) => {
    setAddresses(addresses.filter((_, i) => i !== index));
    setAddressCountError(null);
  };

  const createEndpoint = async () => {
    const validation = validateEndpointAddresses(addresses, subnets);
    setAddressErrors(validation.rowErrors);
    setAddressCountError(validation.formError ?? null);
    if (!validation.valid) return;

    setCreating(true);
    setCreateError(null);
    try {
      const res = await apiFetch("/api/route53resolver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createEndpoint",
          name: endpointName.trim(),
          ipAddresses: toIpAddresses(addresses),
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || `Creating the endpoint failed (HTTP ${res.status})`);
      }
      setCreateModal(false);
      setEndpointName("");
      setAddresses([emptyAddress(), emptyAddress()]);
      fetchEndpoints();
    } catch (err: unknown) {
      // The modal stays open so the addresses can be corrected and retried.
      setCreateError(err instanceof Error ? err.message : "Failed to create resolver endpoint");
    } finally {
      setCreating(false);
    }
  };

  const deleteEndpoint = async (id: string) => {
    await apiFetch(`/api/route53resolver?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    fetchEndpoints();
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="Route 53 Resolver"
          serviceIcon={SERVICE_ICONS["/ec2-resolver"]?.small}
          counter={endpoints?.length ?? 0}
          primaryAction=<button type="button" className="aws-service-page__create" disabled>
            Create resolver
        </button>

        />
        {error && (
          <Alert type="error" header="Error">
            {error}
          </Alert>
        )}
        <Table
          header={
            <Header
              variant="h2"
              actions={<Button onClick={openCreateModal}>Create endpoint</Button>}
            >
              Resolver Endpoints ({endpoints.length})
            </Header>
          }
          items={endpoints}
          loading={loading}
          columnDefinitions={[
            { header: "ID", cell: (item) => item.Id },
            { header: "Direction", cell: (item) => item.Direction },
            { header: "Status", cell: (item) => item.Status },
            {
              header: "Actions",
              cell: (item) => (
                <Button onClick={() => deleteEndpoint(item.Id)} formAction="none">
                  Delete
                </Button>
              ),
            },
          ]}
          empty={<Box textAlign="center">No resolver endpoints found.</Box>}
        />

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create resolver endpoint"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)} formAction="none">
                Cancel
              </Button>
              <Button variant="primary" onClick={createEndpoint} loading={creating}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="l">
            {createError && (
              <Alert type="error" header="The endpoint was not created">
                {createError}
              </Alert>
            )}

            <FormField label="Name">
              <Input
                value={endpointName}
                onChange={(e) => setEndpointName(e.detail.value)}
                placeholder="my-resolver-endpoint"
              />
            </FormField>

            <SpaceBetween size="xs">
              <Box variant="h3">IP addresses</Box>
              <Box variant="p" color="text-body-secondary">
                A resolver endpoint answers DNS queries from at least {MIN_ENDPOINT_ADDRESSES} IP
                addresses in the same VPC. Each address comes from a subnet; leave the address empty
                and Route 53 takes a free one from that subnet.
              </Box>
              {subnetNotice && <Alert type="warning">{subnetNotice}</Alert>}
              {/* The count rule is about the whole list rather than one control, so it cannot
                  live in a single FormField's errorText. */}
              {addressCountError && <Alert type="error">{addressCountError}</Alert>}
              {addresses.map((address, index) => (
                <ColumnLayout key={index} columns={3} variant="default">
                  <FormField
                    label={
                      <>
                        Subnet <span style={{ color: "red" }}>*</span>
                      </>
                    }
                    constraintText="Required"
                    errorText={addressErrors[index]?.subnetId}
                  >
                    <Select
                      selectedOption={
                        address.subnetId
                          ? {
                              value: address.subnetId,
                              label:
                                subnets.find((subnet) => subnet.SubnetId === address.subnetId)
                                  ?.SubnetId || address.subnetId,
                            }
                          : null
                      }
                      options={subnets.map((subnet) => ({
                        value: subnet.SubnetId || "",
                        label: `${subnet.SubnetId || ""} (${subnet.AvailabilityZone || "unknown AZ"}) - ${subnet.CidrBlock || "no CIDR"}`,
                      }))}
                      placeholder="Select a subnet"
                      filteringType="auto"
                      onChange={({ detail: selection }) => {
                        updateAddress(index, "subnetId", selection.selectedOption?.value || "");
                        setAddressErrors((prev) => updateRowError(prev, index, "subnetId"));
                      }}
                    />
                  </FormField>
                  <FormField
                    label="IP address"
                    constraintText="Optional. Must be an IPv4 address inside the subnet's CIDR range."
                    errorText={addressErrors[index]?.ip}
                  >
                    <Input
                      value={address.ip}
                      onChange={(e) => {
                        updateAddress(index, "ip", e.detail.value);
                        setAddressErrors((prev) => updateRowError(prev, index, "ip"));
                      }}
                      placeholder="172.31.0.10"
                    />
                  </FormField>
                  <FormField label=" ">
                    <Button onClick={() => removeAddress(index)} formAction="none">
                      Remove
                    </Button>
                  </FormField>
                </ColumnLayout>
              ))}
              <div>
                <Button onClick={addAddress} formAction="none">
                  Add IP address
                </Button>
              </div>
            </SpaceBetween>
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
