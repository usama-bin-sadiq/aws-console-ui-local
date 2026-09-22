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
import ButtonDropdown from "@cloudscape-design/components/button-dropdown";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import Alert from "@cloudscape-design/components/alert";
import Spinner from "@cloudscape-design/components/spinner";
import Table from "@cloudscape-design/components/table";
import Modal from "@cloudscape-design/components/modal";
import RadioGroup from "@cloudscape-design/components/radio-group";
import FormField from "@cloudscape-design/components/form-field";
import Select from "@cloudscape-design/components/select";
import Input from "@cloudscape-design/components/input";
import Checkbox from "@cloudscape-design/components/checkbox";
import Image from "next/image";
import { EC2Instance } from "@/types/ec2";
import CapabilityLink from "@/components/CapabilityLink";
import { SERVICE_ICONS } from "@/constants/service-icons";
import { CrossServiceLinks, CROSS_SERVICE_LINKS } from "@/components/CrossServiceLinks";
import { apiFetch } from "@/lib/api-client";

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
  const [instanceConnectUrl, setInstanceConnectUrl] = useState<string | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [loadingConnect, setLoadingConnect] = useState(false);
  const [statusChecks, setStatusChecks] = useState<Array<{ InstanceId?: string; InstanceState?: { Name?: string }; SystemStatus?: { Status?: string; Details?: Array<{ Name?: string; Status?: string }> }; InstanceStatus?: { Status?: string; Details?: Array<{ Name?: string; Status?: string }> } }>>([]);
  const [loadingStatusChecks, setLoadingStatusChecks] = useState(false);
  const [volumes, setVolumes] = useState<Array<{ VolumeId?: string; Size?: number; VolumeType?: string; State?: string; AvailabilityZone?: string; Iops?: number; Throughput?: number; Encrypted?: boolean; KmsKeyId?: string; Attachments?: Array<{ InstanceId?: string; Device?: string; State?: string; AttachTime?: Date }>; Tags?: Array<{ Key?: string; Value?: string }>; CreateTime?: Date }>>([]);
  const [loadingVolumes, setLoadingVolumes] = useState(false);
  const [networkInterfaces, setNetworkInterfaces] = useState<Array<{ NetworkInterfaceId?: string; SubnetId?: string; VpcId?: string; Description?: string; Status?: string; MacAddress?: string; PrivateIpAddress?: string; PrivateDnsName?: string; Groups?: Array<{ GroupId?: string; GroupName?: string }>; Attachment?: { AttachmentId?: string; InstanceId?: string; DeviceIndex?: number; Status?: string; AttachTime?: Date; DeleteOnTermination?: boolean }; Ipv6Addresses?: Array<{ Ipv6Address?: string }>; Tags?: Array<{ Key?: string; Value?: string }> }>>([]);
  const [loadingNetworkInterfaces, setLoadingNetworkInterfaces] = useState(false);
  const [amiDetails, setAmiDetails] = useState<{ ImageId?: string; Name?: string; Description?: string; State?: string; Architecture?: string; CreationDate?: string; OwnerId?: string; Platform?: string; RootDeviceType?: string; VirtualizationType?: string; ImageType?: string; Public?: boolean; ProductCodes?: Array<{ ProductCodeId?: string; ProductCodeType?: string }>; Hypervisor?: string; EnaSupport?: boolean; SriovNetSupport?: string; BootMode?: string; DeprecationTime?: string } | null>(null);
  const [loadingAmi, setLoadingAmi] = useState(false);
  const [elasticIps, setElasticIps] = useState<Array<{ AllocationId?: string; PublicIp?: string; Domain?: string; InstanceId?: string; AssociationId?: string; NetworkInterfaceId?: string; Tags?: Array<{ Key?: string; Value?: string }> }>>([]);
  const [loadingElasticIps, setLoadingElasticIps] = useState(false);

  useEffect(() => {
    params.then((p) => setInstanceId(p.instanceId));
  }, [params]);

  // Early declarations for use in callbacks
  const stateName = instance?.State?.Name;
  const isRunning = stateName === "running";
  const isStopped = stateName === "stopped";

  const fetchInstance = useCallback(async () => {
    if (!instanceId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/ec2");
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

  const loadConsoleOutput = useCallback(async () => {
    setLoadingConsole(true);
    try {
      const res = await apiFetch("/api/ec2", {
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

  const fetchKeyPairs = useCallback(async () => {
    try {
      const res = await apiFetch("/api/ec2", {
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
      const res = await apiFetch("/api/ec2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "describeSecurityGroups", securityGroupIds: sgIds }),
      });
      const data = await res.json();
      setSgRules(data.securityGroups || []);
    } catch { /* empty */ }
  }, [instance]);

  const fetchInstanceConnect = useCallback(async () => {
    if (!instanceId) return;
    setLoadingConnect(true);
    try {
      const res = await apiFetch("/api/ec2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "instanceConnect", instanceId }),
      });
      const data = await res.json();
      if (data.url) {
        setInstanceConnectUrl(data.url);
        setShowConnectModal(true);
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to get instance connect URL");
    } finally {
      setLoadingConnect(false);
    }
  }, [instanceId]);

  const fetchStatusChecks = useCallback(async () => {
    if (!instanceId) return;
    setLoadingStatusChecks(true);
    try {
      const res = await apiFetch("/api/ec2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "describeStatus", instanceIds: [instanceId] }),
      });
      const data = await res.json();
      setStatusChecks(data.instanceStatuses || []);
    } catch { /* empty */ }
    finally {
      setLoadingStatusChecks(false);
    }
  }, [instanceId]);

  const fetchVolumes = useCallback(async () => {
    if (!instance?.BlockDeviceMappings?.length) return;
    setLoadingVolumes(true);
    try {
      const volumeIds = instance.BlockDeviceMappings.map((bdm) => bdm.Ebs?.VolumeId).filter(Boolean);
      if (!volumeIds.length) return;
      const res = await apiFetch("/api/ec2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "describeVolumes", volumeIds }),
      });
      const data = await res.json();
      setVolumes(data.volumes || []);
    } catch { /* empty */ }
    finally {
      setLoadingVolumes(false);
    }
  }, [instance]);

  const fetchNetworkInterfaces = useCallback(async () => {
    if (!instance?.NetworkInterfaces?.length) return;
    setLoadingNetworkInterfaces(true);
    try {
      const niIds = instance.NetworkInterfaces.map((ni) => ni.NetworkInterfaceId).filter(Boolean);
      if (!niIds.length) return;
      const res = await apiFetch("/api/ec2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "describeNetworkInterfaces", networkInterfaceIds: niIds }),
      });
      const data = await res.json();
      setNetworkInterfaces(data.networkInterfaces || []);
    } catch { /* empty */ }
    finally {
      setLoadingNetworkInterfaces(false);
    }
  }, [instance]);

  const fetchAmiDetails = useCallback(async () => {
    if (!instance?.ImageId) return;
    setLoadingAmi(true);
    try {
      const res = await apiFetch("/api/ec2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "describeImages", imageIds: [instance.ImageId] }),
      });
      const data = await res.json();
      setAmiDetails(data.images?.[0] || null);
    } catch { /* empty */ }
    finally {
      setLoadingAmi(false);
    }
  }, [instance]);

  const fetchElasticIps = useCallback(async () => {
    setLoadingElasticIps(true);
    try {
      const res = await apiFetch("/api/ec2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "describeAddresses" }),
      });
      const data = await res.json();
      setElasticIps(data.addresses || []);
    } catch { /* empty */ }
    finally {
      setLoadingElasticIps(false);
    }
  }, []);

  const handleChangeInstanceType = useCallback(async () => {
    if (!instanceId || stateName !== "stopped" || !instance) return;
    const newType = prompt("Enter new instance type (e.g., t3.medium):", instance.InstanceType || "");
    if (!newType) return;
    try {
      await apiFetch("/api/ec2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "modifyAttribute", instanceId, attributes: { InstanceType: { Value: newType } } }),
      });
      fetchInstance();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to change instance type");
    }
  }, [instanceId, instance?.InstanceType, stateName, fetchInstance]);

  const handleToggleTerminationProtection = useCallback(async () => {
    if (!instanceId || !instance) return;
    const newValue = !instance.DisableApiTermination;
    try {
      await apiFetch("/api/ec2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "modifyAttribute", instanceId, attributes: { DisableApiTermination: { Value: newValue } } }),
      });
      fetchInstance();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to toggle termination protection");
    }
  }, [instanceId, instance?.DisableApiTermination, fetchInstance]);

  const handleModifyUserData = useCallback(async () => {
    if (!instanceId || stateName !== "stopped" || !instance) return;
    const userData = prompt("Enter new User Data (base64 encoded):", "");
    if (!userData) return;
    try {
      await apiFetch("/api/ec2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "modifyAttribute", instanceId, attributes: { UserData: { Value: userData } } }),
      });
      fetchInstance();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to modify user data");
    }
  }, [instanceId, stateName, fetchInstance]);

  const handleAllocateAddress = useCallback(async () => {
    try {
      const res = await apiFetch("/api/ec2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "allocateAddress", domain: "vpc" }),
      });
      const data = await res.json();
      if (data.allocationId) {
        fetchElasticIps();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to allocate Elastic IP");
    }
  }, [fetchElasticIps]);

  const handleAssociateAddress = useCallback(async (allocationId: string) => {
    if (!instanceId) return;
    try {
      await apiFetch("/api/ec2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "associateAddress", allocationId, instanceId }),
      });
      fetchInstance();
      fetchElasticIps();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to associate Elastic IP");
    }
  }, [instanceId, fetchInstance, fetchElasticIps]);

  const handleReleaseAddress = useCallback(async (allocationId: string) => {
    if (!confirm("Release this Elastic IP address?")) return;
    try {
      await apiFetch("/api/ec2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "releaseAddress", allocationId }),
      });
      fetchElasticIps();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to release Elastic IP");
    }
  }, [fetchElasticIps]);

  const executeAction = useCallback(async (action: string, extra?: Record<string, unknown>) => {
    try {
      const res = await apiFetch("/api/ec2", {
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

  const handleAssociateKeyPair = useCallback(async () => {
    if (!selectedKeyName || !instanceId) return;
    setModifyingKey(true);
    try {
      const res = await apiFetch("/api/ec2", {
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

  const handleCreateKeyPair = useCallback(async () => {
    if (!newKeyName.trim()) return;
    setCreatingKey(true);
    try {
      const res = await apiFetch("/api/ec2", {
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

  const handleCreateVolume = useCallback(async () => {
    if (!instance?.AvailabilityZone) return;
    const size = prompt("Enter volume size (GiB):", "10");
    if (!size) return;
    try {
      const res = await apiFetch("/api/ec2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "createVolume", availabilityZone: instance.AvailabilityZone, size: parseInt(size), volumeType: "gp3" }),
      });
      const data = await res.json();
      if (data.volumeId) {
        fetchVolumes();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create volume");
    }
  }, [instance, fetchVolumes]);

  const handleAttachVolume = useCallback(async (volumeId: string) => {
    if (!instanceId) return;
    const device = prompt("Enter device name (e.g., /dev/xvdf):", "/dev/xvdf");
    if (!device) return;
    try {
      await apiFetch("/api/ec2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "attachVolume", volumeId, instanceId, device }),
      });
      fetchVolumes();
      fetchInstance();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to attach volume");
    }
  }, [instanceId, fetchVolumes, fetchInstance]);

  const handleDetachVolume = useCallback(async (volumeId: string) => {
    if (!confirm("Detach this volume?")) return;
    try {
      await apiFetch("/api/ec2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "detachVolume", volumeId, instanceId }),
      });
      fetchVolumes();
      fetchInstance();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to detach volume");
    }
  }, [instanceId, fetchVolumes, fetchInstance]);

  useEffect(() => {
    fetchInstance();
  }, [fetchInstance]);

  useEffect(() => {
    if (instance) {
      fetchSgRules();
      fetchVolumes();
      fetchNetworkInterfaces();
      fetchAmiDetails();
      fetchElasticIps();
    }
  }, [instance, fetchSgRules, fetchVolumes, fetchNetworkInterfaces, fetchAmiDetails, fetchElasticIps]);

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

  // ─── Connect Tab ───
  const connectContent = (
    <Container header={<Header variant="h2">Connect to Instance</Header>}>
      <SpaceBetween size="l">
        <ColumnLayout columns={2} variant="default">
          <div>
            <Box variant="small" color="text-label">Instance ID</Box>
            <Box>{instance.InstanceId}</Box>
          </div>
          <div>
            <Box variant="small" color="text-label">Instance State</Box>
            <StatusIndicator type={isRunning ? "success" : isStopped ? "warning" : "info"}>
              {stateName}
            </StatusIndicator>
          </div>
          <div>
            <Box variant="small" color="text-label">Public IP</Box>
            <Box>{instance.PublicIpAddress || "—"}</Box>
          </div>
          <div>
            <Box variant="small" color="text-label">Private IP</Box>
            <Box>{instance.PrivateIpAddress || "—"}</Box>
          </div>
          <div>
            <Box variant="small" color="text-label">Default Username</Box>
            <Box>{getDefaultUsername(instance)}</Box>
          </div>
          <div>
            <Box variant="small" color="text-label">Key Pair</Box>
            <Box>{instance.KeyName || "—"}</Box>
          </div>
        </ColumnLayout>
        <Alert type="info">
          <SpaceBetween size="xs">
            <Box>
              <Box variant="strong">EC2 Instance Connect</Box>
              <Box variant="p" color="text-body-secondary">Connect to your instance using a browser-based SSH client. This requires the instance to be running and have a public IP address.</Box>
            </Box>
            <Button variant="primary" loading={loadingConnect} onClick={fetchInstanceConnect} disabled={!isRunning || !instance.PublicIpAddress}>
              Connect
            </Button>
          </SpaceBetween>
        </Alert>
        {instanceConnectUrl && (
          <Box margin={{ top: "m" }}>
            <Box variant="p" color="text-body-secondary">Opening connection in new tab...</Box>
          </Box>
        )}
      </SpaceBetween>
    </Container>
  );

  // ─── Status Checks Tab ───
  const statusChecksContent = (
    <Container header={<Header variant="h2">Status Checks</Header>}>
      <SpaceBetween size="l">
        <ColumnLayout columns={2} variant="default">
          <div>
            <Box variant="small" color="text-label">Instance Status</Box>
            <Box>{statusChecks[0]?.InstanceStatus?.Status === "ok" ? (
              <StatusIndicator type="success">2/2 checks passed</StatusIndicator>
            ) : statusChecks[0]?.InstanceStatus?.Status === "impaired" ? (
              <StatusIndicator type="error">1/2 checks failed</StatusIndicator>
            ) : (
              <StatusIndicator type="warning">Initializing...</StatusIndicator>
            )}</Box>
          </div>
          <div>
            <Box variant="small" color="text-label">System Status</Box>
            <Box>{statusChecks[0]?.SystemStatus?.Status === "ok" ? (
              <StatusIndicator type="success">OK</StatusIndicator>
            ) : statusChecks[0]?.SystemStatus?.Status === "impaired" ? (
              <StatusIndicator type="error">Impaired</StatusIndicator>
            ) : (
              <StatusIndicator type="warning">Initializing...</StatusIndicator>
            )}</Box>
          </div>
        </ColumnLayout>
        {loadingStatusChecks ? (
          <Box textAlign="center" padding="l"><Spinner size="normal" /></Box>
        ) : statusChecks.length > 0 ? (
          <Box margin={{ top: "l" }}>
            <SpaceBetween size="m">
              <Container header={<Header variant="h3">System Status Details</Header>}>
              <Table
                columnDefinitions={[
                  { header: "Status Check", cell: (item: any) => item.Name },
                  { header: "Status", cell: (item: any) => item.Status === "ok" ? <StatusIndicator type="success">Passed</StatusIndicator> : item.Status === "impaired" ? <StatusIndicator type="error">Failed</StatusIndicator> : <StatusIndicator type="warning">Initializing</StatusIndicator> },
                  { header: "Impaired Since", cell: (item: any) => item.ImpairedSince ? new Date(item.ImpairedSince).toLocaleString() : "—" },
                ]}
                items={statusChecks[0]?.SystemStatus?.Details || []}
                empty={<Box>No system status details</Box>}
              />
            </Container>
            <Container header={<Header variant="h3">Instance Status Details</Header>}>
              <Table
                columnDefinitions={[
                  { header: "Status Check", cell: (item: any) => item.Name },
                  { header: "Status", cell: (item: any) => item.Status === "ok" ? <StatusIndicator type="success">Passed</StatusIndicator> : item.Status === "impaired" ? <StatusIndicator type="error">Failed</StatusIndicator> : <StatusIndicator type="warning">Initializing</StatusIndicator> },
                  { header: "Impaired Since", cell: (item: any) => item.ImpairedSince ? new Date(item.ImpairedSince).toLocaleString() : "—" },
                ]}
                items={statusChecks[0]?.InstanceStatus?.Details || []}
                empty={<Box>No instance status details</Box>}
              />
</Container>
            </SpaceBetween>
          </Box>
        ) : (
          <Button onClick={fetchStatusChecks} formAction="none">Refresh Status Checks</Button>
        )}
      </SpaceBetween>
    </Container>
  );

  // ─── Volumes Tab ───
  const volumesContent = (
    <Container header={<Header variant="h2">Volumes</Header>}>
      <SpaceBetween size="l">
        <Box margin={{ bottom: "m" }}>
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={handleCreateVolume} formAction="none">Create Volume</Button>
            <Button onClick={fetchVolumes} formAction="none" loading={loadingVolumes}>Refresh</Button>
          </SpaceBetween>
        </Box>
        {loadingVolumes ? (
          <Box textAlign="center" padding="l"><Spinner size="normal" /></Box>
        ) : volumes.length > 0 ? (
          <Table
            columnDefinitions={[
              { header: "Volume ID", cell: (item: any) => item.VolumeId },
              { header: "Size (GiB)", cell: (item: any) => item.Size },
              { header: "Type", cell: (item: any) => item.VolumeType },
              { header: "State", cell: (item: any) => <StatusIndicator type={item.State === "in-use" ? "success" : item.State === "available" ? "info" : "warning"}>{item.State}</StatusIndicator> },
              { header: "IOPS", cell: (item: any) => item.Iops || "—" },
              { header: "Throughput (MiB/s)", cell: (item: any) => item.Throughput || "—" },
              { header: "Encrypted", cell: (item: any) => item.Encrypted ? "Yes" : "No" },
              { header: "AZ", cell: (item: any) => item.AvailabilityZone },
              { header: "Attached To", cell: (item: any) => item.Attachments?.[0]?.InstanceId || "—" },
              { header: "Device", cell: (item: any) => item.Attachments?.[0]?.Device || "—" },
              { header: "Created", cell: (item: any) => item.CreateTime ? new Date(item.CreateTime).toLocaleString() : "—" },
              { header: "Actions", cell: (item: any) => (
                <SpaceBetween direction="horizontal" size="xs">
                  {item.State === "available" && <Button variant="inline-link" onClick={() => handleAttachVolume(item.VolumeId!)} formAction="none">Attach</Button>}
                  {item.State === "in-use" && <Button variant="inline-link" onClick={() => handleDetachVolume(item.VolumeId!)} formAction="none">Detach</Button>}
                  <Button variant="inline-link" onClick={() => {}} formAction="none">Create Snapshot</Button>
                </SpaceBetween>
              )},
            ]}
            items={volumes}
            empty={<Box>No volumes found</Box>}
          />
        ) : (
          <Box textAlign="center" padding="l">No volumes found</Box>
        )}
      </SpaceBetween>
    </Container>
  );

  // ─── Network Interfaces Tab ───
  const networkInterfacesContent = (
    <Container header={<Header variant="h2">Network Interfaces</Header>}>
      <SpaceBetween size="l">
        {loadingNetworkInterfaces ? (
          <Box textAlign="center" padding="l"><Spinner size="normal" /></Box>
        ) : networkInterfaces.length > 0 ? (
          <Table
            columnDefinitions={[
              { header: "Interface ID", cell: (item: any) => item.NetworkInterfaceId },
              { header: "Description", cell: (item: any) => item.Description || "—" },
              { header: "Subnet", cell: (item: any) => item.SubnetId },
              { header: "VPC", cell: (item: any) => item.VpcId },
              { header: "Private IP", cell: (item: any) => item.PrivateIpAddress },
              { header: "Public IP", cell: (item: any) => item.Association?.PublicIp || "—" },
              { header: "Status", cell: (item: any) => <StatusIndicator type={item.Status === "in-use" ? "success" : item.Status === "available" ? "info" : "warning"}>{item.Status}</StatusIndicator> },
              { header: "Security Groups", cell: (item: any) => item.Groups?.map((g: any) => `${g.GroupName} (${g.GroupId})`).join(", ") || "—" },
              { header: "Attachment", cell: (item: any) => item.Attachment ? `${item.Attachment.InstanceId} (${item.Attachment.DeviceIndex})` : "—" },
              { header: "MAC Address", cell: (item: any) => item.MacAddress || "—" },
              { header: "IPv6 Addresses", cell: (item: any) => item.Ipv6Addresses?.map((ip: any) => ip.Ipv6Address).join(", ") || "—" },
            ]}
            items={networkInterfaces}
            empty={<Box>No network interfaces</Box>}
          />
        ) : (
          <Box textAlign="center" padding="l">No network interfaces</Box>
        )}
      </SpaceBetween>
    </Container>
  );

  // ─── AMI Tab ───
  const amiContent = (
    <Container header={<Header variant="h2">AMI Details</Header>}>
      {loadingAmi ? (
        <Box textAlign="center" padding="l"><Spinner size="normal" /></Box>
      ) : amiDetails ? (
        <ColumnLayout columns={2} variant="default">
          <div>
            <Box variant="small" color="text-label">AMI ID</Box>
            <Box>{amiDetails.ImageId}</Box>
          </div>
          <div>
            <Box variant="small" color="text-label">Name</Box>
            <Box>{amiDetails.Name || "—"}</Box>
          </div>
          <div>
            <Box variant="small" color="text-label">Description</Box>
            <Box>{amiDetails.Description || "—"}</Box>
          </div>
          <div>
            <Box variant="small" color="text-label">State</Box>
            <StatusIndicator type={amiDetails.State === "available" ? "success" : "warning"}>{amiDetails.State}</StatusIndicator>
          </div>
          <div>
            <Box variant="small" color="text-label">Architecture</Box>
            <Box>{amiDetails.Architecture || "—"}</Box>
          </div>
          <div>
            <Box variant="small" color="text-label">Platform</Box>
            <Box>{amiDetails.Platform || "Linux/Unix"}</Box>
          </div>
          <div>
            <Box variant="small" color="text-label">Root Device Type</Box>
            <Box>{amiDetails.RootDeviceType || "—"}</Box>
          </div>
          <div>
            <Box variant="small" color="text-label">Virtualization Type</Box>
            <Box>{amiDetails.VirtualizationType || "—"}</Box>
          </div>
          <div>
            <Box variant="small" color="text-label">Image Type</Box>
            <Box>{amiDetails.ImageType || "—"}</Box>
          </div>
          <div>
            <Box variant="small" color="text-label">Public</Box>
            <Box>{amiDetails.Public ? "Yes" : "No"}</Box>
          </div>
          <div>
            <Box variant="small" color="text-label">Owner ID</Box>
            <Box>{amiDetails.OwnerId || "—"}</Box>
          </div>
          <div>
            <Box variant="small" color="text-label">Creation Date</Box>
            <Box>{amiDetails.CreationDate || "—"}</Box>
          </div>
          <div>
            <Box variant="small" color="text-label">Hypervisor</Box>
            <Box>{amiDetails.Hypervisor || "—"}</Box>
          </div>
          <div>
            <Box variant="small" color="text-label">ENA Support</Box>
            <Box>{amiDetails.EnaSupport ? "Yes" : "No"}</Box>
          </div>
          <div>
            <Box variant="small" color="text-label">SR-IOV Net Support</Box>
            <Box>{amiDetails.SriovNetSupport || "—"}</Box>
          </div>
          <div>
            <Box variant="small" color="text-label">Boot Mode</Box>
            <Box>{amiDetails.BootMode || "—"}</Box>
          </div>
          <div>
            <Box variant="small" color="text-label">Deprecation Time</Box>
            <Box>{amiDetails.DeprecationTime || "—"}</Box>
          </div>
        </ColumnLayout>
      ) : (
        <Box>No AMI details available</Box>
      )}
    </Container>
  );

  // ─── Elastic IPs Tab ───
  const elasticIpsContent = (
    <Container header={<Header variant="h2">Elastic IPs</Header>}>
      <SpaceBetween size="l">
        <Box margin={{ bottom: "m" }}>
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={handleAllocateAddress} formAction="none" loading={loadingElasticIps}>Allocate Elastic IP</Button>
            <Button onClick={fetchElasticIps} formAction="none" loading={loadingElasticIps}>Refresh</Button>
          </SpaceBetween>
        </Box>
        {loadingElasticIps ? (
          <Box textAlign="center" padding="l"><Spinner size="normal" /></Box>
        ) : elasticIps.length > 0 ? (
          <Table
            columnDefinitions={[
              { header: "Allocation ID", cell: (item: any) => item.AllocationId },
              { header: "Public IP", cell: (item: any) => item.PublicIp },
              { header: "Domain", cell: (item: any) => item.Domain },
              { header: "Instance ID", cell: (item: any) => item.InstanceId ? <CapabilityLink label={item.InstanceId!} href={`/ec2/${item.InstanceId}`} enabled /> : "—" },
              { header: "Association ID", cell: (item: any) => item.AssociationId || "—" },
              { header: "Network Interface", cell: (item: any) => item.NetworkInterfaceId || "—" },
              { header: "Actions", cell: (item: any) => (
                <SpaceBetween direction="horizontal" size="xs">
                  {item.InstanceId ? (
                    <Button variant="inline-link" onClick={() => {}} formAction="none">Disassociate</Button>
                  ) : (
                    <Button variant="inline-link" onClick={() => handleAssociateAddress(item.AllocationId!)} formAction="none">Associate</Button>
                  )}
                  <Button variant="inline-link" onClick={() => handleReleaseAddress(item.AllocationId!)} formAction="none">Release</Button>
                </SpaceBetween>
              )},
            ]}
            items={elasticIps}
            empty={<Box>No Elastic IPs</Box>}
          />
        ) : (
          <Box textAlign="center" padding="l">No Elastic IPs allocated</Box>
        )}
      </SpaceBetween>
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
              {isRunning && (
                <Button onClick={fetchInstanceConnect} formAction="none" loading={loadingConnect}>
                  Connect
                </Button>
              )}
              {isStopped && (
                <Button onClick={handleChangeInstanceType} formAction="none">
                  Change Instance Type
                </Button>
              )}
              <ButtonDropdown
                items={[
                  { text: "Termination Protection", id: "termination-protection" },
                  { text: "View/Change User Data", id: "user-data" },
                  { text: "Manage Elastic IPs", id: "elastic-ips" },
                ]}
                onItemClick={({ detail }) => {
                  if (detail.id === "termination-protection") handleToggleTerminationProtection();
                  else if (detail.id === "user-data") handleModifyUserData();
                  else if (detail.id === "elastic-ips") fetchElasticIps();
                }}
                ariaLabel="Instance actions"
              >
                Actions
              </ButtonDropdown>
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
            { label: "Connect", id: "connect", content: connectContent },
            { label: "Status Checks", id: "status-checks", content: statusChecksContent },
            { label: "Volumes", id: "volumes", content: volumesContent },
            { label: "Network Interfaces", id: "network-interfaces", content: networkInterfacesContent },
            { label: "AMI", id: "ami", content: amiContent },
            { label: "Elastic IPs", id: "elastic-ips", content: elasticIpsContent },
          ]}
        />
        <CrossServiceLinks links={CROSS_SERVICE_LINKS["/ec2"] || []} />
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
