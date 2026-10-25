"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Header,
  Container,
  Box,
  FormField,
  Select,
  Button,
  RadioGroup,
  SpaceBetween,
  Alert,
  Tabs,
  Divider,
  Table,
} from "@cloudscape-design/components";
import { useSettingsStore } from "@/stores/settings";
import { useAuth } from "@/context/AuthContext";
import { AWS_REGIONS } from "@/constants/regions";
import { getHealthPathForMode, toAdapterMode } from "@/constants/service-compatibility";

interface EmulatorHealth {
  status: string;
  provider: string;
  endpoint: string;
  edition?: string;
  readiness?: string;
  services?: Record<string, unknown>;
  error?: string;
}

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export default function SettingsPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { region, setRegion, theme, setTheme, provider, setProvider } = useSettingsStore();

  const [health, setHealth] = useState<EmulatorHealth | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  const fetchHealth = async () => {
    setHealthLoading(true);
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      setHealth(data);
    } catch {
      setHealth({
        status: "unreachable",
        provider: "unknown",
        endpoint: "",
        error: "Failed to fetch",
      });
    } finally {
      setHealthLoading(false);
    }
  };

  // Fetch health on mount
  useEffect(() => {
    queueMicrotask(() => {
      fetchHealth();
    });
  }, [provider]);

  const handleProviderChange = (newProvider: "localstack" | "ministack" | "localemu") => {
    setProvider(newProvider);
    localStorage.setItem("ACTIVE_BACKEND", newProvider);
    // Reload to reinitialize SDK clients
    window.location.reload();
  };

  const handleRegionChange = (newRegion: string) => {
    setRegion(newRegion);
  };

  const handleThemeChange = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const endpoint =
        provider === "ministack"
          ? process.env.NEXT_PUBLIC_MINSTACK_ENDPOINT || "http://localhost:4566"
          : provider === "localemu"
            ? process.env.NEXT_PUBLIC_LOCALEMU_ENDPOINT || "http://localhost:4566"
            : process.env.NEXT_PUBLIC_LOCALSTACK_ENDPOINT || "http://localhost:4566";

      const healthUrl = `${endpoint}${getHealthPathForMode(toAdapterMode(provider))}`;

      const res = await fetch(healthUrl, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        setTestResult({
          success: true,
          message: `Connected to ${provider} at ${endpoint}. Edition: ${data.edition || "unknown"}`,
        });
      } else {
        setTestResult({
          success: false,
          message: `Health check failed: ${res.status} ${res.statusText}`,
        });
      }
    } catch (err: unknown) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : "Connection failed",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const providerOptions = [
    { value: "localstack", label: "LocalStack" },
    { value: "ministack", label: "MinStack" },
    { value: "localemu", label: "LocalEmu" },
  ];

  const regionOptions = AWS_REGIONS.map((r) => ({ value: r.value, label: r.label }));

  const themeOptions = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
  ];

  const tabs = [
    {
      id: "general",
      label: "General",
      content: activeTab === "general" && (
        <SpaceBetween size="l" direction="vertical">
          <Container disableContentPaddings>
            <Box padding="l">
              <Header variant="h3">Provider</Header>
              <Box margin={{ bottom: "m" }} color="text-body-secondary" fontSize="body-s">
                Select which local AWS emulator backend to use. Changing this requires a page
                reload.
              </Box>
              <RadioGroup
                name="provider"
                value={provider}
                onChange={({ detail }) =>
                  handleProviderChange(detail.value as "localstack" | "ministack" | "localemu")
                }
                items={providerOptions}
              />
            </Box>
          </Container>

          <Container disableContentPaddings>
            <Box padding="l">
              <Header variant="h3">Region</Header>
              <Box margin={{ bottom: "m" }} color="text-body-secondary" fontSize="body-s">
                Default region for all service API calls.
              </Box>
              <FormField label="AWS Region">
                <Select
                  selectedOption={regionOptions.find((option) => option.value === region) ?? null}
                  options={regionOptions}
                  placeholder="Select region"
                  onChange={({ detail }) =>
                    handleRegionChange(detail.selectedOption.value ?? region)
                  }
                  ariaLabel="AWS Region"
                />
              </FormField>
            </Box>
          </Container>

          <Container disableContentPaddings>
            <Box padding="l">
              <Header variant="h3">Theme</Header>
              <Box margin={{ bottom: "m" }} color="text-body-secondary" fontSize="body-s">
                Choose the console color theme.
              </Box>
              <RadioGroup
                name="theme"
                value={theme}
                onChange={({ detail }) => handleThemeChange(detail.value as "light" | "dark")}
                items={themeOptions}
              />
            </Box>
          </Container>
        </SpaceBetween>
      ),
    },
    {
      id: "emulator",
      label: "Emulator",
      content: activeTab === "emulator" && (
        <SpaceBetween size="l" direction="vertical">
          <Container className="aws-table-card" disableContentPaddings>
            <Box padding="l">
              <SpaceBetween size="m" direction="horizontal">
                <Header variant="h3">Emulator Health</Header>
                <Button
                  onClick={fetchHealth}
                  disabled={healthLoading}
                  iconName="refresh"
                  ariaLabel="Refresh health"
                >
                  Refresh
                </Button>
              </SpaceBetween>

              {healthLoading ? (
                <Box textAlign="center" padding="l">
                  Checking emulator health...
                </Box>
              ) : health ? (
                <SpaceBetween size="m" direction="vertical">
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "16px",
                    }}
                  >
                    <div>
                      <Box variant="strong" color="text-body-secondary">
                        Status
                      </Box>
                      <Box variant="h2">{capitalize(health.status)}</Box>
                    </div>
                    <div>
                      <Box variant="strong" color="text-body-secondary">
                        Provider
                      </Box>
                      <Box variant="h2">{health.provider.toUpperCase()}</Box>
                    </div>
                    <div>
                      <Box variant="strong" color="text-body-secondary">
                        Endpoint
                      </Box>
                      <Box variant="code">{health.endpoint}</Box>
                    </div>
                    {health.edition && (
                      <div>
                        <Box variant="strong" color="text-body-secondary">
                          Edition
                        </Box>
                        <Box>{health.edition}</Box>
                      </div>
                    )}
                    {health.readiness && (
                      <div>
                        <Box variant="strong" color="text-body-secondary">
                          Readiness
                        </Box>
                        <Box>{capitalize(health.readiness)}</Box>
                      </div>
                    )}
                  </div>

                  <Divider />

                  <Button onClick={testConnection} loading={testing} variant="primary">
                    Test Connection
                  </Button>

                  {testResult && (
                    <Alert type={testResult.success ? "success" : "error"} dismissible>
                      {testResult.message}
                    </Alert>
                  )}

                  {health.services && Object.keys(health.services).length > 0 && (
                    <div>
                      <Divider />
                      <Box variant="strong" margin={{ bottom: "s" }}>
                        Service Capabilities
                      </Box>
                      <Table
                        variant="embedded"
                        columnDefinitions={[
                          {
                            id: "service",
                            header: "Service",
                            cell: (item) => <code>{item.key}</code>,
                          },
                          {
                            id: "status",
                            header: "Status",
                            cell: (item) =>
                              typeof item.value === "object" &&
                              item.value !== null &&
                              "status" in item.value
                                ? (item.value as { status?: unknown }).status === true
                                  ? "Available"
                                  : "Unavailable"
                                : item.value === true
                                  ? "Available"
                                  : "Unavailable",
                          },
                        ]}
                        items={Object.entries(health.services).map(([key, value]) => ({
                          key,
                          value,
                        }))}
                      />
                    </div>
                  )}
                </SpaceBetween>
              ) : (
                <Alert type="error">Unable to fetch health data</Alert>
              )}
            </Box>
          </Container>

          <Container disableContentPaddings>
            <Box padding="l">
              <Header variant="h3">Docker Compose Commands</Header>
              <Box margin={{ bottom: "m" }} color="text-body-secondary" fontSize="body-s">
                Use these commands to start/stop the emulator backends.
              </Box>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: "13px",
                  background: "#f6f8fa",
                  padding: "16px",
                  borderRadius: "4px",
                  overflow: "auto",
                }}
              >
                <div style={{ marginBottom: "8px" }}>
                  <strong># LocalStack:</strong>
                </div>
                <div style={{ marginBottom: "4px" }}>
                  docker compose -f docker-compose.localstack.yml up -d
                </div>
                <div style={{ marginBottom: "4px" }}>
                  docker compose -f docker-compose.localstack.yml down
                </div>
                <div style={{ marginBottom: "8px" }}>
                  <strong># MinStack:</strong>
                </div>
                <div style={{ marginBottom: "4px" }}>
                  docker compose -f docker-compose.ministack.yml up -d
                </div>
                <div style={{ marginBottom: "4px" }}>
                  docker compose -f docker-compose.ministack.yml down
                </div>
                <div style={{ marginBottom: "8px" }}>
                  <strong># LocalEmu:</strong>
                </div>
                <div style={{ marginBottom: "4px" }}>
                  docker compose -f docker-compose.localemu.yml up -d
                </div>
                <div style={{ marginBottom: "4px" }}>
                  docker compose -f docker-compose.localemu.yml down
                </div>
                <div style={{ marginBottom: "8px" }}>
                  <strong># Both:</strong>
                </div>
                <div style={{ marginBottom: "4px" }}>
                  docker compose -f docker-compose.both.yml up -d
                </div>
                <div style={{ marginBottom: "4px" }}>
                  docker compose -f docker-compose.both.yml down
                </div>
              </div>
            </Box>
          </Container>
        </SpaceBetween>
      ),
    },
    {
      id: "account",
      label: "Account",
      content: activeTab === "account" && (
        <SpaceBetween size="l" direction="vertical">
          <Container disableContentPaddings>
            <Box padding="l">
              <Header variant="h3">Sign Out</Header>
              <Box margin={{ bottom: "m" }} color="text-body-secondary" fontSize="body-s">
                Sign out of the console. You will be redirected to the login page.
              </Box>
              <Button onClick={handleSignOut} variant="primary">
                Sign Out
              </Button>
            </Box>
          </Container>

          <Container disableContentPaddings>
            <Box padding="l">
              <Header variant="h3">Danger Zone</Header>
              <Box margin={{ bottom: "m" }} color="text-body-secondary" fontSize="body-s">
                These actions are irreversible.
              </Box>
              <SpaceBetween direction="horizontal" size="m">
                <Button
                  variant="normal"
                  onClick={() => {
                    localStorage.clear();
                    window.location.reload();
                  }}
                >
                  Clear All Local Storage
                </Button>
              </SpaceBetween>
            </Box>
          </Container>
        </SpaceBetween>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: "900px", paddingTop: "24px" }}>
      <Container>
        <Header variant="h1">Settings</Header>

        <Tabs
          tabs={tabs}
          activeTabId={activeTab}
          onChange={({ detail }) => setActiveTab(detail.activeTabId)}
          ariaLabel="Settings categories"
        />
      </Container>
    </div>
  );
}
