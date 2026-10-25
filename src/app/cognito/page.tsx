"use client";
import { apiFetch } from "@/lib/api-client";
import { useEffect, useState } from "react";
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
import Header from "@cloudscape-design/components/header";
import { useRouter } from "next/navigation";
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";

interface UserPool {
  Id: string;
  Name: string;
  CreationDate?: string;
}

interface CognitoUser {
  Username?: string;
  UserStatus?: string;
  UserCreateDate?: string;
}

interface UserPoolClient {
  ClientId?: string;
  ClientName?: string;
  UserPoolId?: string;
  ClientSecret?: string;
}

export default function CognitoPage() {
  const [pools, setPools] = useState<UserPool[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("pools");

  // Create pool modal
  const [createModal, setCreateModal] = useState(false);
  const [poolName, setPoolName] = useState("");

  // List users panel
  const [usersModal, setUsersModal] = useState(false);
  const [selectedPool, setSelectedPool] = useState<UserPool | null>(null);
  const [users, setUsers] = useState<CognitoUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Clients
  const [clients, setClients] = useState<UserPoolClient[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientsModal, setClientsModal] = useState(false);
  const [clientsPoolId, setClientsPoolId] = useState<string>("");
  const [clientsPoolName, setClientsPoolName] = useState<string>("");

  // Client create/edit
  const [clientModal, setClientModal] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientPoolId, setClientPoolId] = useState<string>("");

  const fetchPools = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/cognito");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPools(data.userPools || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "pools")
      queueMicrotask(() => {
        fetchPools();
      });
  }, [activeTab]);

  const createPool = async () => {
    try {
      await apiFetch("/api/cognito", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "createPool", poolName }),
      });
    } finally {
      setCreateModal(false);
      setPoolName("");
      fetchPools();
    }
  };

  const deletePool = async (id: string) => {
    await apiFetch(`/api/cognito?poolId=${encodeURIComponent(id)}`, { method: "DELETE" });
    fetchPools();
  };

  const openListUsers = async (pool: UserPool) => {
    setSelectedPool(pool);
    setUsersModal(true);
    setUsersLoading(true);
    try {
      const res = await apiFetch("/api/cognito", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "listUsers", poolId: pool.Id }),
      });
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  // Clients
  const openClients = async (pool: UserPool) => {
    setClientsPoolId(pool.Id);
    setClientsPoolName(pool.Name);
    setClientsModal(true);
    setClientsLoading(true);
    try {
      const res = await apiFetch("/api/cognito", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "listClients", poolId: pool.Id }),
      });
      const data = await res.json();
      setClients(data.clients || []);
    } catch {
      setClients([]);
    } finally {
      setClientsLoading(false);
    }
  };

  const createClient = async () => {
    try {
      await apiFetch("/api/cognito", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "createClient", poolId: clientsPoolId, clientName }),
      });
      openClients({ Id: clientsPoolId, Name: clientsPoolName });
    } finally {
      setClientModal(false);
      setClientName("");
    }
  };

  const deleteClient = async (clientId: string) => {
    await apiFetch("/api/cognito", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deleteClient", poolId: clientsPoolId, clientId }),
    });
    openClients({ Id: clientsPoolId, Name: clientsPoolName });
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="Amazon Cognito"
          serviceIcon={SERVICE_ICONS["/cognito"]?.small}
          counter={0}
          primaryAction=<button
            type="button"
            className="aws-service-page__create"
            onClick={() => router.push("/cognito/create")}
          >
            Create user pool
          </button>
        />
        {error && (
          <Alert type="error" header="Error">
            {error}
          </Alert>
        )}

        <Tabs
          tabs={[
            {
              label: "User Pools",
              id: "pools",
              content: (
                <Table
                  header={
                    <Header
                      variant="h2"
                      actions={
                        <Button onClick={() => setCreateModal(true)}>Create user pool</Button>
                      }
                    >
                      User Pools ({pools.length})
                    </Header>
                  }
                  items={pools}
                  loading={loading}
                  columnDefinitions={[
                    { header: "Name", cell: (item) => item.Name },
                    { header: "Pool ID", cell: (item) => item.Id },
                    { header: "Created", cell: (item) => item.CreationDate ?? "—" },
                    {
                      header: "Actions",
                      cell: (item: UserPool) => (
                        <SpaceBetween direction="horizontal" size="xs">
                          <Button onClick={() => openListUsers(item)} formAction="none">
                            Users
                          </Button>
                          <Button onClick={() => openClients(item)} formAction="none">
                            Clients
                          </Button>
                          <Button onClick={() => deletePool(item.Id)} formAction="none">
                            Delete
                          </Button>
                        </SpaceBetween>
                      ),
                    },
                  ]}
                  empty={<Box textAlign="center">No user pools found.</Box>}
                />
              ),
            },
            {
              label: "App Clients",
              id: "clients",
              content: (
                <Container className="aws-table-card">
                  <Alert type="info">Select a user pool to manage app clients.</Alert>
                  <Table
                    header={<Header variant="h2">App Clients ({clients.length})</Header>}
                    items={clients}
                    loading={clientsLoading}
                    columnDefinitions={[
                      { header: "Client Name", cell: (item) => item.ClientName || "—" },
                      { header: "Client ID", cell: (item) => item.ClientId || "—" },
                      {
                        header: "Pool ID",
                        cell: (item) => item.UserPoolId || clientsPoolId || "—",
                      },
                      {
                        header: "Actions",
                        cell: (item: UserPoolClient) => (
                          <SpaceBetween direction="horizontal" size="xs">
                            <Button onClick={() => deleteClient(item.ClientId!)} formAction="none">
                              Delete
                            </Button>
                          </SpaceBetween>
                        ),
                      },
                    ]}
                    empty={<Box textAlign="center">No clients found for this pool.</Box>}
                  />
                </Container>
              ),
            },
          ]}
          activeTabId={activeTab}
          onChange={({ detail }) => setActiveTab(detail.activeTabId)}
        />

        {/* Create pool modal */}
        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create user pool"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createPool}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <FormField label="Pool name">
            <Input
              value={poolName}
              onChange={(e) => setPoolName(e.detail.value)}
              placeholder="my-user-pool"
            />
          </FormField>
        </Modal>

        {/* List users modal */}
        <Modal
          visible={usersModal}
          onDismiss={() => {
            setUsersModal(false);
            setUsers([]);
          }}
          header={`Users — ${selectedPool?.Name ?? ""}`}
          footer={
            <Button
              onClick={() => {
                setUsersModal(false);
                setUsers([]);
              }}
            >
              Close
            </Button>
          }
        >
          <Table
            items={users}
            loading={usersLoading}
            columnDefinitions={[
              { header: "Username", cell: (u) => u.Username ?? "—" },
              { header: "Status", cell: (u) => u.UserStatus ?? "—" },
              { header: "Created", cell: (u) => u.UserCreateDate ?? "—" },
            ]}
            empty={<Box textAlign="center">No users found.</Box>}
          />
        </Modal>

        {/* Clients modal */}
        <Modal
          visible={clientsModal}
          onDismiss={() => {
            setClientsModal(false);
            setClients([]);
          }}
          header={`App Clients — ${clientsPoolName || clientsPoolId}`}
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                onClick={() => {
                  setClientModal(true);
                  setClientPoolId(clientsPoolId);
                  setClientName("");
                }}
              >
                Add client
              </Button>
              <Button
                onClick={() => {
                  setClientsModal(false);
                  setClients([]);
                }}
              >
                Close
              </Button>
            </SpaceBetween>
          }
        >
          <Table
            items={clients}
            loading={clientsLoading}
            columnDefinitions={[
              { header: "Client Name", cell: (item) => item.ClientName || "—" },
              { header: "Client ID", cell: (item) => item.ClientId || "—" },
              { header: "Pool ID", cell: (item) => item.UserPoolId || clientsPoolId || "—" },
              {
                header: "Actions",
                cell: (item: UserPoolClient) => (
                  <Button onClick={() => deleteClient(item.ClientId!)} formAction="none">
                    Delete
                  </Button>
                ),
              },
            ]}
            empty={<Box textAlign="center">No clients found.</Box>}
          />
        </Modal>

        {/* Client create/edit modal */}
        <Modal
          visible={clientModal}
          onDismiss={() => {
            setClientModal(false);
            setClientName("");
          }}
          header="Add app client"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                onClick={() => {
                  setClientModal(false);
                  setClientName("");
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={createClient}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <FormField label="Client name">
            <Input
              value={clientName}
              onChange={(e) => setClientName(e.detail.value)}
              placeholder="my-app-client"
            />
          </FormField>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
