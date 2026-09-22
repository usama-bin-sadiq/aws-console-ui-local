"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Header,
  Container,
  Box,
  FormField,
  Select,
  Button,
  RadioGroup,
  Card,
  SpaceBetween,
  Alert,
  Tabs,
  Link,
  Divider,
} from "@cloudscape-design/components";
import { useSettingsStore } from "@/stores/settings";
import { useAuth } from "@/context/AuthContext";
import { AWS_REGIONS } from "@/constants/regions";
import { AdapterMode } from "@/constants/service-compatibility";

interface EmulatorHealth {
  status: string;
  provider: string;
  endpoint: string;
  edition?: string;
  readiness?: string;
  services?: Record<string, unknown>;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, signOut, signInWithCredentials } = useAuth();
  const { region, setRegion, theme, setTheme, provider, setProvider } = useSettingsStore();

  const [health, setHealth] = useState<EmulatorHealth | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [credentials, setCredentials] = useState({
    accessKeyId: "",
    secretAccessKey: "",
    sessionToken: "",
  });
  const [activeTab, setActiveTab] = useState("general");

  // Fetch health on mount
  useEffect(() => {
    fetchHealth();
  }, [provider]);

  const fetchHealth = async () => {
    setHealthLoading(true);
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      setHealth(data);
    } catch {
      setHealth({ status: "unreachable", provider: "unknown", endpoint: "", error: "Failed to fetch" });
    } finally {
      setHealthLoading(false);
    }
  };

  const handleProviderChange = (newProvider: "localstack" | "ministack") => {
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
      const endpoint = provider === "ministack"
        ? process.env.NEXT_PUBLIC_MINSTACK_ENDPOINT || "http://localhost:4566"
        : process.env.NEXT_PUBLIC_LOCALSTACK_ENDPOINT || "http://localhost:4566";

      const healthUrl = provider === "ministack"
        ? `${endpoint}/_ministack/health`
        : `${endpoint}/_localstack/health`;

      const res = await fetch(healthUrl, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        setTestResult({ success: true, message: `Connected to ${provider} at ${endpoint}. Edition: ${data.edition || "unknown"}` });
      } else {
        setTestResult({ success: false, message: `Health check failed: ${res.status} ${res.statusText}` });
      }
    } catch (err: unknown) {
      setTestResult({ success: false, message: err instanceof Error ? err.message : "Connection failed" });
    } finally {
      setTesting(false);
    }
  };

  const testCredentials = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      await signInWithCredentials(credentials.accessKeyId, credentials.secretAccessKey, credentials.sessionToken || undefined);
      setTestResult({ success: true, message: "Credentials validated successfully" });
    } catch (err: unknown) {
      setTestResult({ success: false, message: err instanceof Error ? err.message : "Invalid credentials" });
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
  ];

  const regionOptions = AWS_REGIONS.map((r) => ({ value: r.value, label: r.label }));

  const themeOptions = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
  ];

  const tabs = [
    { id: "general", text: "General" },
    { id: "emulator", text: "Emulator" },
    { id: "credentials", text: "Credentials" },
    { id: "account", text: "Account" },
  ];

  return (
    <Container style={{ maxWidth: "900px", paddingTop: "24px" }}>
      <Header variant="h1">Settings</Header>

      <Tabs
        tabs={tabs}
        activeTabId={activeTab}
        onTabClick={({ detail }) => setActiveTab(detail.id)}
        ariaLabels={{ tabs: "Settings categories" }}
      >
        {/* General Tab */}
        {activeTab === "general" && (
          <SpaceBetween size="l" direction="vertical">
            <Card>
              <Box padding="l">
                <Header variant="h3">Provider</Header>
                <Box marginBottom="m" color="text-body-secondary" fontSize="body-s">
                  Select which local AWS emulator backend to use. Changing this requires a page reload.
                </Box>
                <RadioGroup
                  name="provider"
                  value={provider}
                  onChange={({ detail }) => handleProviderChange(detail.value as "localstack" | "ministack")}
                  options={providerOptions}
                />
              </Box>
            </Card>

            <Card>
              <Box padding="l">
                <Header variant="h3">Region</Header>
                <Box marginBottom="m" color="text-body-secondary" fontSize="body-s">
                  Default region for all service API calls.
                </Box>
                <FormField label="AWS Region">
                  <Select
                    value={region}
                    options={regionOptions}
                    placeholder="Select region"
                    onChange={({ detail }) => handleRegionChange(detail.value)}
                    ariaLabel="AWS Region"
                  />
                </FormField>
              </Box>
            </Card>

            <Card>
              <Box padding="l">
                <Header variant="h3">Theme</Header>
                <Box marginBottom="m" color="text-body-secondary" fontSize="body-s">
                  Choose the console color theme.
                </Box>
                <RadioGroup
                  name="theme"
                  value={theme}
                  onChange={({ detail }) => handleThemeChange(detail.value as "light" | "dark")}
                  options={themeOptions}
                />
              </Box>
            </Card>
          </SpaceBetween>
        )}

        {/* Emulator Tab */}
        {activeTab === "emulator" && (
          <SpaceBetween size="l" direction="vertical">
            <Card>
              <Box padding="l">
                <SpaceBetween size="m" direction="horizontal">
                  <Header variant="h3">Emulator Health</Header>
                  <Button onClick={fetchHealth} disabled={healthLoading} iconName="refresh" ariaLabel="Refresh health">
                    Refresh
                  </Button>
                </SpaceBetween>

                {healthLoading ? (
                  <Box textAlign="center" padding="l">Checking emulator health...</Box>
                ) : health ? (
                  <SpaceBetween size="m" direction="vertical">
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                      <div>
                        <Box variant="strong" color="text-body-secondary">Status</Box>
                        <Box variant="h2" style={{ textTransform: "capitalize" }}>
                          {health.status}
                        </Box>
                      </div>
                      <div>
                        <Box variant="strong" color="text-body-secondary">Provider</Box>
                        <Box variant="h2">{health.provider.toUpperCase()}</Box>
                      </div>
                      <div>
                        <Box variant="strong" color="text-body-secondary">Endpoint</Box>
                        <Box variant="body-m" fontFamily="monospace">{health.endpoint}</Box>
                      </div>
                      {health.edition && (
                        <div>
                          <Box variant="strong" color="text-body-secondary">Edition</Box>
                          <Box variant="body-m">{health.edition}</Box>
                        </div>
                      )}
                      {health.readiness && (
                        <div>
                          <Box variant="strong" color="text-body-secondary">Readiness</Box>
                          <Box variant="body-m" style={{ textTransform: "capitalize" }}>
                            {health.readiness}
                          </Box>
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
                        <Box variant="strong" marginBottom="s">Service Capabilities</Box>
                        <div style={{ maxHeight: "300px", overflow: "auto" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                            <thead>
                              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--awsui-color-border-divider)" }}>
                                <th style={{ padding: "8px" }}>Service</th>
                                <th style={{ padding: "8px" }}>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(health.services).map(([key, value]) => (
                                <tr key={key} style={{ borderBottom: "1px solid var(--awsui-color-border-divider)" }}>
                                  <td style={{ padding: "8px", fontFamily: "monospace" }}>{key}</td>
                                  <td style={{ padding: "8px" }}>
                                    {typeof value === "object" && value !== null && "status" in value
                                      ? (value as { status?: unknown }).status === true
                                        ? "✅ Available"
                                        : "❌ Unavailable"
                                      : value === true
                                      ? "✅ Available"
                                      : "❌ Unavailable"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </SpaceBetween>
                ) : (
                  <Alert type="error">Unable to fetch health data</Alert>
                )}
              </Box>
            </Card>

            <Card>
              <Box padding="l">
                <Header variant="h3">Docker Compose Commands</Header>
                <Box marginBottom="m" color="text-body-secondary" fontSize="body-s">
                  Use these commands to start/stop the emulator backends.
                </Box>
                <div style={{ fontFamily: "monospace", fontSize: "13px", background: "#f6f8fa", padding: "16px", borderRadius: "4px", overflow: "auto" }}>
                  <div style={{ marginBottom: "8px" }}><strong># LocalStack:</strong></div>
                  <div style={{ marginBottom: "4px" }}>docker compose -f docker-compose.localstack.yml up -d</div>
                  <div style={{ marginBottom: "4px" }}>docker compose -f docker-compose.localstack.yml down</div>
                  <div style={{ marginBottom: "8px" }}><strong># MinStack:</strong></div>
                  <div style={{ marginBottom: "4px" }}>docker compose -f docker-compose.ministack.yml up -d</div>
                  <div style={{ marginBottom: "4px" }}>docker compose -f docker-compose.ministack.yml down</div>
                  <div style={{ marginBottom: "8px" }}><strong># Both:</strong></div>
                  <div style={{ marginBottom: "4px" }}>docker compose -f docker-compose.both.yml up -d</div>
                  <div style={{ marginBottom: "4px" }}>docker compose -f docker-compose.both.yml down</div>
                </div>
              </Box>
            </Card>
          </SpaceBetween>
        )}

        {/* Credentials Tab */}
        {activeTab === "credentials" && (
          <SpaceBetween size="l" direction="vertical">
            <Card>
              <Box padding="l">
                <Header variant="h3">AWS Credentials</Header>
                <Box marginBottom="m" color="text-body-secondary" fontSize="body-s">
                  Override the default emulator credentials. These are used for all API calls.
                  For LocalStack/MinStack, the defaults are <code>test / test</code>.
                </Box>

                <FormField label="Access Key ID" required>
                  <input
                    type="text"
                    value={credentials.accessKeyId}
                    onChange={(e) => setCredentials({ ...credentials, accessKeyId: e.target.value })}
                    placeholder="AKIA..."
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--awsui-color-border-input)", borderRadius: "4px" }}
                  />
                </FormField>

                <FormField label="Secret Access Key" required>
                  <input
                    type="password"
                    value={credentials.secretAccessKey}
                    onChange={(e) => setCredentials({ ...credentials, secretAccessKey: e.target.value })}
                    placeholder="Secret key"
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--awsui-color-border-input)", borderRadius: "4px" }}
                  />
                </FormField>

                <FormField label="Session Token (optional)">
                  <input
                    type="password"
                    value={credentials.sessionToken}
                    onChange={(e) => setCredentials({ ...credentials, sessionToken: e.target.value })}
                    placeholder="Session token for temporary credentials"
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--awsui-color-border-input)", borderRadius: "4px" }}
                  />
                </FormField>

                <SpaceBetween size="m" direction="horizontal">
                  <Button onClick={testCredentials} loading={testing} variant="primary">
                    Test Credentials
                  </Button>
                  <Button onClick={() => setCredentials({ accessKeyId: "test", secretAccessKey: "test", sessionToken: "" })} variant="link">
                    Reset to defaults (test / test)
                  </Button>
                </SpaceBetween>

                {testResult && (
                  <Alert type={testResult.success ? "success" : "error"} dismissible marginTop="m">
                    {testResult.message}
                  </Alert>
                )}
              </Box>
            </Card>

            <Card>
              <Box padding="l">
                <Header variant="h3">Current Session</Header>
                {user && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                    <div>
                      <Box variant="strong" color="text-body-secondary">Username</Box>
                      <Box variant="body-m">{user.username}</Box>
                    </div>
                    <div>
                      <Box variant="strong" color="text-body-secondary">Email</Box>
                      <Box variant="body-m">{user.email || "—"}</Box>
                    </div>
                    <div>
                      <Box variant="strong" color="text-body-secondary">Account</Box>
                      <Box variant="body-m">{user.accountName || "—"}</Box>
                    </div>
                    <div>
                      <Box variant="strong" color="text-body-secondary">Access Key</Box>
                      <Box variant="body-m" fontFamily="monospace">{user.credentials?.accessKeyId || "—"}</Box>
                    </div>
                    <div>
                      <Box variant="strong" color="text-body-secondary">Role</Box>
                      <Box variant="body-m">{user.isSuperAdmin ? "Super Admin" : "Standard User"}</Box>
                    </div>
                    <div>
                      <Box variant="strong" color="text-body-secondary">Login Method</Box>
                      <Box variant="body-m" style={{ textTransform: "capitalize" }}>{user.loginMethod}</Box>
                    </div>
                  </div>
                )}
              </Box>
            </Card>
          </SpaceBetween>
        )}

        {/* Account Tab */}
        {activeTab === "account" && (
          <SpaceBetween size="l" direction="vertical">
            <Card>
              <Box padding="l">
                <Header variant="h3">Sign Out</Header>
                <Box marginBottom="m" color="text-body-secondary" fontSize="body-s">
                  Sign out of the console. You will be redirected to the login page.
                </Box>
                <Button onClick={handleSignOut} variant="primary">
                  Sign Out
                </Button>
              </Box>
            </Card>

            <Card>
              <Box padding="l">
                <Header variant="h3">Danger Zone</Header>
                <Box marginBottom="m" color="text-body-secondary" fontSize="body-s">
                  These actions are irreversible.
                </Box>
                <SpaceBetween direction="horizontal" size="m">
                  <Button variant="error" onClick={() => { localStorage.clear(); window.location.reload(); }}>
                    Clear All Local Storage
                  </Button>
                </SpaceBetween>
              </Box>
            </Card>
          </SpaceBetween>
        )}
      </Tabs>
    </Container>
  );
}