"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CodeView } from "@cloudscape-design/code-view";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import Tabs from "@cloudscape-design/components/tabs";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Button from "@cloudscape-design/components/button";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import Alert from "@cloudscape-design/components/alert";
import Spinner from "@cloudscape-design/components/spinner";
import Table from "@cloudscape-design/components/table";
import Modal from "@cloudscape-design/components/modal";
import RadioGroup from "@cloudscape-design/components/radio-group";
import FormField from "@cloudscape-design/components/form-field";
import Select from "@cloudscape-design/components/select";
import Input from "@cloudscape-design/components/input";
import { EC2Instance } from "@/types/ec2";
import CapabilityLink from "@/components/CapabilityLink";

export default function EC2InstanceDetailsPage({
  params,
}: {
  params: Promise<{ instanceId: string }>;
}) {
  const router = useRouter();
  const [instance, setInstance] = useState<EC2Instance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [consoleOutput, setConsoleOutput] = useState<string | null>(null);
  const [loadingConsole, setLoadingConsole] = useState(false);
  const [instanceId, setInstanceId] = useState<string>("");
  const [showKeyPairModal, setShowKeyPairModal] = useState(false);
  const [keyPairs, setKeyPairs] = useState<Array<{ KeyName?: string; KeyType?: string }>>([]);
  const [selectedKeyName, setSelectedKeyName] = useState("");
  const [newKeyName, setNewKeyName] = useState("");
  const [creatingKey, setCreatingKey] = useState(false);
  const [createdKeyMaterial, setCreatedKeyMaterial] = useState<string | null>(null);
  const [modifyingKey, setModifyingKey] = useState(false);
  const [sgRules, setSgRules] = useState<Array<{ GroupId?: string; GroupName?: string; IpPermissions?: unknown[]; IpPermissionsEgress?: unknown[] }>>([]);

  useEffect(() => {
    params.then((p) => setInstanceId(p.instanceId));
  }, [params]);

  const fetchKeyPairs = useCallback(async () => {
    try {
      const res = await fetch("/api/ec2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "describeKeyPairs" }),
      });
      const data = await res.json();
      setKeyPairs(data.keyPairs || []);
    } catch { /* empty */ }
  }, []);

  const fetchSgRules = useCallback(async () => {
    if (!instance?.SecurityGroups?.length) return;
    try {
      const sgIds = instance.SecurityGroups.map((sg) => sg.GroupId).filter(Boolean);
      const res = await fetch("/api/ec2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "describeSecurityGroups", securityGroupIds: sgIds }),
      });
      const data = await res.json();
      setSgRules(data.securityGroups || []);
    } catch { /* empty */ }
  }, [instance]);

  const handleCreateKeyPair = useCallback(async () => {
    if (!newKeyName.trim()) return;
    setCreatingKey(true);
    try {
      const res = await fetch("/api/ec2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "createKeyPair", keyName: newKeyName.trim() }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to create key pair");
      setCreatedKeyMaterial(data.keyPair?.KeyMaterial || "");
      setSelectedKeyName(data.keyPair?.KeyName || newKeyName.trim());
      setKeyPairs((prev) => [...prev, { KeyName: data.keyPair?.KeyName || newKeyName.trim(), KeyType: "rsa" }]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create key pair");
    } finally {
      setCreatingKey(false);
    }
  }, [newKeyName]);

  const fetchInstance = useCallback(async () => {
    if (!instanceId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ec2");
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`API returned non-JSON: ${text.slice(0, 200)}`);
      }
      if (data.error) throw new Error(data.error);
      const allInstances = data.instances || [];
      const found = allInstances.find(
        (i: EC2Instance) => i.InstanceId === instanceId
      );
      if (!found) {
        const ids = allInstances.map((i: EC2Instance) => i.InstanceId).join(", ");
        throw new Error(
          `Instance "${instanceId}" not found. ` +
          `Available: [${ids || "none"}]`
        );
      }
      setInstance(found);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load instance");
    }
    setLoading(false);
  }, [instanceId]);

  const handleAssociateKeyPair = useCallback(async () => {
    if (!selectedKeyName || !instanceId) return;
    setModifyingKey(true);
    try {
      const res = await fetch("/api/ec2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "modifyAttribute",
          instanceId,
          attributes: { KeyName: selectedKeyName },
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to associate key pair");
      setShowKeyPairModal(false);
      setSelectedKeyName("");
      setNewKeyName("");
      setCreatedKeyMaterial(null);
      fetchInstance();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to associate key pair");
    } finally {
      setModifyingKey(false);
    }
  }, [selectedKeyName, instanceId, fetchInstance]);

  useEffect(() => {
    fetchInstance();
  }, [fetchInstance]);

  useEffect(() => {
    if (instance) fetchSgRules();
  }, [instance, fetchSgRules]);

  useEffect(() => {
    if (error && error.includes("not found")) {
      const timer = setTimeout(fetchInstance, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, fetchInstance]);

  const executeAction = useCallback(async (action: string, extra?: Record<string, unknown>) => {
    try {
      const res = await fetch("/api/ec2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, instanceIds: [instanceId], ...extra }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `Action ${action} failed`);
      fetchInstance();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `Failed to ${action}`);
    }
    }, [instanceId, fetchInstance]);

  const loadConsoleOutput = useCallback(async () => {
    setLoadingConsole(true);
    try {
      const res = await fetch("/api/ec2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "getConsoleOutput", instanceId }),
      });
      const data = await res.json();
      setConsoleOutput(data.Output || "No console output available");
    } catch {
      setConsoleOutput("Failed to load console output");
    }
    setLoadingConsole(false);
  }, [instanceId]);

  if (loading) {
    return (
      <div style={{ padding: "16px" }}>
        <SpaceBetween size="l">
          <Header variant="h1">Instance {instanceId || "Loading..."}</Header>
          <Box textAlign="center">
            <Spinner size="large" />
            <Box variant="p" padding={{ top: "s" }}>Loading instance details...</Box>
          </Box>
        </SpaceBetween>
      </div>
    );
  }

  if (error || !instance) {
    return (
      <div style={{ padding: "16px" }}>
        <SpaceBetween size="l">
          <Header variant="h1">Instance {instanceId || "Loading..."}</Header>
          <Alert type="error">{error || "Instance not found"}</Alert>
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={fetchInstance} iconName="refresh">Retry</Button>
            <Button onClick={() => router.push("/ec2")}>Back to EC2</Button>
          </SpaceBetween>
        </SpaceBetween>
      </div>
    );
  }

  const stateName = instance.State?.Name;
  const isRunning = stateName === "running";
  const isStopped = stateName === "stopped";

  function getDefaultUsername(inst: EC2Instance): string {
    const platform = (inst.Platform || "").toLowerCase();
    const name = (inst.Name || "").toLowerCase();
    const imageId = (inst.ImageId || "").toLowerCase();
    if (platform.includes("windows")) return "Administrator";
    if (name.includes("ubuntu") || imageId.includes("ubuntu")) return "ubuntu";
    if (name.includes("debian") || imageId.includes("debian")) return "admin";
    if (name.includes("fedora") || imageId.includes("fedora")) return "fedora";
    if (name.includes("rhel") || name.includes("red hat") || imageId.includes("rhel")) return "ec2-user";
    return "ec2-user";
  }

  const overviewContent = (
    <Container header={<Header variant="h2">Details</Header>}>
      <ColumnLayout columns={3} variant="default">
        <div>
          <Box variant="small" color="text-label">Instance ID</Box>
          <Box>{instance.InstanceId}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">Name</Box>
          <Box>{instance.Name || "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">Instance State</Box>
          <StatusIndicator type={isRunning ? "success" : isStopped ? "warning" : "info"}>
            {stateName}
          </StatusIndicator>
        </div>
        <div>
          <Box variant="small" color="text-label">Instance Type</Box>
          <Box>{instance.InstanceType}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">AMI ID</Box>
          <Box>{instance.ImageId || "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">Architecture</Box>
          <Box>{instance.Architecture || "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">Platform</Box>
          <Box>{instance.Platform || "Linux/Unix"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">Key Pair</Box>
          <SpaceBetween direction="horizontal" size="xs">
            <Box>{instance.KeyName || "—"}</Box>
            {isStopped && (
              <Button
                variant="inline-link"
                onClick={() => {
                  fetchKeyPairs();
                  setShowKeyPairModal(true);
                }}
                formAction="none"
              >
                Change
              </Button>
            )}
          </SpaceBetween>
        </div>
        <div>
          <Box variant="small" color="text-label">Default Username</Box>
          <Box>{getDefaultUsername(instance)}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">SSH Command</Box>
          <Box>
            {instance.PublicIpAddress && instance.KeyName ? (
              <CodeView
                content={`ssh -i "${instance.KeyName}.pem" ${getDefaultUsername(instance)}@${instance.PublicIpAddress}`}
                lineNumbers={false}
              />
            ) : "—"}
          </Box>
        </div>
        <div>
          <Box variant="small" color="text-label">IAM Role</Box>
          <Box>
            {instance.IamInstanceProfile?.Arn ? (
              <CapabilityLink
                label={instance.IamInstanceProfile.Arn}
                href={`/iam?resource=${encodeURIComponent(instance.IamInstanceProfile.Arn)}`}
                enabled
              />
            ) : "—"}
          </Box>
        </div>
        <div>
          <Box variant="small" color="text-label">Launch Time</Box>
          <Box>{instance.LaunchTime ? new Date(instance.LaunchTime).toLocaleString() : "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">Root Device Type</Box>
          <Box>{instance.RootDeviceType || "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">Virtualization Type</Box>
          <Box>{instance.VirtualizationType || "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">EBS Optimized</Box>
          <Box>{instance.EbsOptimized ? "Yes" : "No"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">Termination Protection</Box>
          <Box>{instance.DisableApiTermination ? "Enabled" : "Disabled"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">Shutdown Behavior</Box>
          <Box>{instance.InstanceInitiatedShutdownBehavior || "stop"}</Box>
        </div>
      </ColumnLayout>
    </Container>
  );

  const networkingContent = (
    <Container header={<Header variant="h2">Networking</Header>}>
      <ColumnLayout columns={3} variant="default">
        <div>
          <Box variant="small" color="text-label">Public IPv4 Address</Box>
          <Box>{instance.PublicIpAddress || "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">Private IPv4 Address</Box>
          <Box>{instance.PrivateIpAddress || "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">Public DNS Name</Box>
          <Box>{instance.PublicDnsName || "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">Private DNS Name</Box>
          <Box>{instance.PrivateDnsName || "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">VPC ID</Box>
          <Box>{instance.VpcId ? <CapabilityLink label={instance.VpcId} href={`/vpc?resource=${encodeURIComponent(instance.VpcId)}`} enabled /> : "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">Subnet ID</Box>
          <Box>{instance.SubnetId ? <CapabilityLink label={instance.SubnetId} href={`/subnet?resource=${encodeURIComponent(instance.SubnetId)}`} enabled /> : "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">Availability Zone</Box>
          <Box>{instance.AvailabilityZone || "—"}</Box>
        </div>
      </ColumnLayout>
      {instance.SecurityGroups && instance.SecurityGroups.length > 0 && (
        <div style={{ marginTop: "16px" }}>
          <Box variant="small" color="text-label">Security Groups</Box>
          <SpaceBetween size="xs">
            {instance.SecurityGroups.map((sg, idx) => (
              <Box key={sg.GroupId || sg.GroupName || idx}>
                <CapabilityLink
                  label={`${sg.GroupName} (${sg.GroupId})`}
                  href={sg.GroupId ? `/security-group?resource=${encodeURIComponent(sg.GroupId)}` : undefined}
                  enabled={Boolean(sg.GroupId)}
                  reason="missing security group identifier"
                />
              </Box>
            ))}
          </SpaceBetween>
        </div>
      )}
    </Container>
  );

  const storageContent = (
    <Container header={<Header variant="h2">Storage</Header>}>
      {instance.BlockDeviceMappings && instance.BlockDeviceMappings.length > 0 ? (
        <Table
          columnDefinitions={[
            { header: "Device Name", cell: (item) => item.DeviceName },
            { header: "Volume ID", cell: (item) => item.Ebs?.VolumeId },
            { header: "Status", cell: (item) => <StatusIndicator type="info">{item.Ebs?.Status}</StatusIndicator> },
            { header: "Delete on Termination", cell: (item) => item.Ebs?.DeleteOnTermination ? "Yes" : "No" },
            { header: "Attach Time", cell: (item) => item.Ebs?.AttachTime ? new Date(item.Ebs.AttachTime).toLocaleString() : "—" },
          ]}
          items={instance.BlockDeviceMappings}
          header={<Header variant="h3">Block Device Mappings</Header>}
        />
      ) : (
        <Box>No block device mappings</Box>
      )}
    </Container>
  );

  const tagsContent = (
    <Container header={<Header variant="h2">Tags</Header>}>
      {instance.Tags && instance.Tags.length > 0 ? (
        <Table
          columnDefinitions={[
            { header: "Key", cell: (item) => item.Key },
            { header: "Value", cell: (item) => item.Value },
          ]}
          items={instance.Tags}
          header={<Header variant="h3">Tags ({instance.Tags.length})</Header>}
        />
      ) : (
        <Box>No tags</Box>
      )}
    </Container>
  );

  const monitoringContent = (
    <Container header={<Header variant="h2">Monitoring</Header>}>
      <ColumnLayout columns={2} variant="default">
        <div>
          <Box variant="small" color="text-label">Monitoring</Box>
          <Box>{instance.Monitoring?.State || "disabled"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">Console Output</Box>
          {loadingConsole ? (
            <Spinner size="normal" />
          ) : (
            <Button onClick={loadConsoleOutput} formAction="none">
              Get Console Output
            </Button>
          )}
        </div>
      </ColumnLayout>
      {consoleOutput && (
        <div style={{ marginTop: "16px" }}>
          <Box variant="small" color="text-label">Last Console Output</Box>
          <CodeView content={consoleOutput} lineNumbers wrapLines />
        </div>
      )}
    </Container>
  );

  const securityContent = (
    <Container header={<Header variant="h2">Security Groups</Header>}>
      {sgRules.length > 0 ? (
        <SpaceBetween size="l">
          {sgRules.map((sg) => (
            <SpaceBetween key={sg.GroupId} size="m">
              <Box variant="h3">{sg.GroupName} ({sg.GroupId})</Box>
              <Box variant="h4">Inbound Rules</Box>
              <Table
                columnDefinitions={[
                  { header: "Protocol", cell: (item: Record<string, unknown>) => (item.IpProtocol as string) || "All" },
                  { header: "Port Range", cell: (item: Record<string, unknown>) => {
                    const from = item.FromPort as number;
                    const to = item.ToPort as number;
                    if (from === -1 && to === -1) return "All";
                    if (from === to) return String(from);
                    return `${from} - ${to}`;
                  }},
                  { header: "Source", cell: (item: Record<string, unknown>) => {
                    const ipRanges = item.IpRanges as Array<{ CidrIp?: string }> | undefined;
                    const ipv6 = item.Ipv6Ranges as Array<{ CidrIpv6?: string }> | undefined;
                    const userIdPairs = item.UserIdGroupPairs as Array<{ GroupId?: string }> | undefined;
                    const parts: string[] = [];
                    if (ipRanges) parts.push(...ipRanges.map((r) => r.CidrIp || ""));
                    if (ipv6) parts.push(...ipv6.map((r) => r.CidrIpv6 || ""));
                    if (userIdPairs) parts.push(...userIdPairs.map((r) => r.GroupId || ""));
                    return parts.join(", ") || "—";
                  }},
                ]}
                items={(sg.IpPermissions as Record<string, unknown>[]) || []}
                empty={<Box>No inbound rules</Box>}
              />
              <Box variant="h4">Outbound Rules</Box>
              <Table
                columnDefinitions={[
                  { header: "Protocol", cell: (item: Record<string, unknown>) => (item.IpProtocol as string) || "All" },
                  { header: "Port Range", cell: (item: Record<string, unknown>) => {
                    const from = item.FromPort as number;
                    const to = item.ToPort as number;
                    if (from === -1 && to === -1) return "All";
                    if (from === to) return String(from);
                    return `${from} - ${to}`;
                  }},
                  { header: "Destination", cell: (item: Record<string, unknown>) => {
                    const ipRanges = item.IpRanges as Array<{ CidrIp?: string }> | undefined;
                    const ipv6 = item.Ipv6Ranges as Array<{ CidrIpv6?: string }> | undefined;
                    const userIdPairs = item.UserIdGroupPairs as Array<{ GroupId?: string }> | undefined;
                    const parts: string[] = [];
                    if (ipRanges) parts.push(...ipRanges.map((r) => r.CidrIp || ""));
                    if (ipv6) parts.push(...ipv6.map((r) => r.CidrIpv6 || ""));
                    if (userIdPairs) parts.push(...userIdPairs.map((r) => r.GroupId || ""));
                    return parts.join(", ") || "—";
                  }},
                ]}
                items={(sg.IpPermissionsEgress as Record<string, unknown>[]) || []}
                empty={<Box>No outbound rules</Box>}
              />
            </SpaceBetween>
          ))}
        </SpaceBetween>
      ) : (
        <Box>No security groups attached</Box>
      )}
    </Container>
  );

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header
          variant="h1"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              {isRunning && (
                <Button onClick={() => executeAction("stop")} formAction="none">
                  Stop
                </Button>
              )}
              {isStopped && (
                <Button onClick={() => executeAction("start")} formAction="none">
                  Start
                </Button>
              )}
              {isRunning && (
                <Button onClick={() => executeAction("reboot")} formAction="none">
                  Reboot
                </Button>
              )}
              <Button onClick={() => executeAction("terminate")} formAction="none">
                Terminate
              </Button>
              <Button onClick={() => router.push("/ec2")} formAction="none">
                Back to EC2
              </Button>
            </SpaceBetween>
          }
        >
          Instance {instance.Name || instance.InstanceId}
        </Header>

        <Tabs
          tabs={[
            { label: "Details", id: "overview", content: overviewContent },
            { label: "Networking", id: "networking", content: networkingContent },
            { label: "Security", id: "security", content: securityContent },
            { label: "Storage", id: "storage", content: storageContent },
            { label: "Monitoring", id: "monitoring", content: monitoringContent },
            { label: "Tags", id: "tags", content: tagsContent },
          ]}
        />
      </SpaceBetween>

      <Modal
        visible={showKeyPairModal}
        onDismiss={() => {
          setShowKeyPairModal(false);
          setSelectedKeyName("");
          setNewKeyName("");
          setCreatedKeyMaterial(null);
        }}
        header="Change Key Pair"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => {
                setShowKeyPairModal(false);
                setSelectedKeyName("");
                setNewKeyName("");
                setCreatedKeyMaterial(null);
              }}>Cancel</Button>
              <Button
                variant="primary"
                loading={modifyingKey}
                onClick={handleAssociateKeyPair}
                disabled={!selectedKeyName}
              >
                Associate
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <Alert type="info">
            Instance must be stopped to change the key pair. Current state: <strong>{stateName}</strong>
          </Alert>
          <RadioGroup
            value={selectedKeyName ? (keyPairs.some((kp) => kp.KeyName === selectedKeyName) ? "existing" : "new") : "none"}
            items={[
              { value: "existing", label: "Select existing key pair" },
              { value: "new", label: "Create new key pair" },
            ]}
            onChange={() => {
              setSelectedKeyName("");
              setNewKeyName("");
              setCreatedKeyMaterial(null);
            }}
          />
          {(() => {
            const mode = selectedKeyName ? (keyPairs.some((kp) => kp.KeyName === selectedKeyName) ? "existing" : "new") : "none";
            if (mode === "existing" || (!selectedKeyName && !newKeyName)) {
              return (
                <FormField label="Key pair">
                  <Select
                    selectedOption={selectedKeyName ? { value: selectedKeyName, label: selectedKeyName } : null}
                    options={keyPairs.map((kp) => ({ value: kp.KeyName || "", label: `${kp.KeyName || ""} (${kp.KeyType || "rsa"})` }))}
                    placeholder="Choose a key pair"
                    onChange={({ detail }) => setSelectedKeyName(detail.selectedOption.value || "")}
                  />
                </FormField>
              );
            }
            if (mode === "new") {
              if (createdKeyMaterial) {
                return (
                  <SpaceBetween size="s">
                    <Alert type="success">Key created. Download now — cannot download again.</Alert>
                    <CodeView content={createdKeyMaterial} lineNumbers wrapLines />
                    <Button
                      onClick={() => {
                        const blob = new Blob([createdKeyMaterial], { type: "text/plain" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `${selectedKeyName}.pem`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      iconName="download"
                    >
                      Download private key
                    </Button>
                  </SpaceBetween>
                );
              }
              return (
                <FormField label="Key pair name">
                  <SpaceBetween direction="horizontal" size="s">
                    <Input
                      value={newKeyName}
                      onChange={({ detail }) => setNewKeyName(detail.value)}
                      placeholder="my-key-pair"
                    />
                    <Button
                      variant="primary"
                      loading={creatingKey}
                      onClick={handleCreateKeyPair}
                      disabled={!newKeyName.trim()}
                    >
                      Create
                    </Button>
                  </SpaceBetween>
                </FormField>
              );
            }
            return null;
          })()}
        </SpaceBetween>
      </Modal>
    </div>
  );
}
