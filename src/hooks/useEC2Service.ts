/**
 * useEC2Service — Adapter-aware hook for all EC2 SDK actions.
 * Uses adapter SDK factory; routes to localstack endpoint.
 * PRD §9.2.1, §10.1–10.4
 */

import { useState, useCallback } from "react";
import { ec2 } from "@/lib/aws-clients";
import {
  DescribeInstancesCommand,
  RunInstancesCommand,
  TerminateInstancesCommand,
  StartInstancesCommand,
  StopInstancesCommand,
  RebootInstancesCommand,
  ModifyInstanceAttributeCommand,
  DescribeInstanceStatusCommand,
  CreateTagsCommand,
  DeleteTagsCommand,
  GetConsoleOutputCommand,
  DescribeImagesCommand,
  DescribeInstanceTypesCommand,
  DescribeKeyPairsCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  CreateKeyPairCommand,
  DeleteKeyPairCommand,
  DescribeRegionsCommand,
  DescribeAvailabilityZonesCommand,
  type Instance,
  type Image,
  type InstanceTypeInfo,
  type KeyPairInfo,
  type SecurityGroup,
  type Subnet,
  type Vpc,
  type InstanceStatus,
  type Region,
  type AvailabilityZone,
} from "@aws-sdk/client-ec2";

// ─── State Types ───────────────────────────────────────────────────────────

export interface EC2ServiceState {
  readonly instances: Instance[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly images: Image[];
  readonly instanceTypes: InstanceTypeInfo[];
  readonly keyPairs: KeyPairInfo[];
  readonly securityGroups: SecurityGroup[];
  readonly subnets: Subnet[];
  readonly vpcs: Vpc[];
  readonly regions: Region[];
  readonly availabilityZones: AvailabilityZone[];
}

export interface EC2LaunchParams {
  imageId: string;
  instanceType: string;
  keyName?: string;
  subnetId?: string;
  securityGroupIds?: string[];
  iamInstanceProfile?: string;
  userData?: string;
  tags?: Array<{ Key: string; Value: string }>;
  blockDeviceMappings?: Array<{
    DeviceName: string;
    Ebs: {
      VolumeSize: number;
      VolumeType: string;
      Iops?: number;
      Throughput?: number;
      Encrypted: boolean;
      DeleteOnTermination: boolean;
    };
  }>;
  monitoring?: boolean;
  disableApiTermination?: boolean;
  shutdownBehavior?: "stop" | "terminate";
  numInstances?: number;
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useEC2Service() {
  const [state, setState] = useState<EC2ServiceState>({
    instances: [],
    loading: false,
    error: null,
    images: [],
    instanceTypes: [],
    keyPairs: [],
    securityGroups: [],
    subnets: [],
    vpcs: [],
    regions: [],
    availabilityZones: [],
  });

  const setLoading = useCallback(() => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
  }, []);

  const setError = useCallback((message: string) => {
    setState((prev) => ({ ...prev, error: message, loading: false }));
  }, []);

  const describeInstances = useCallback(async () => {
    setLoading();
    try {
      const result = await ec2.send(new DescribeInstancesCommand({}));
      const instances: Instance[] = [];
      for (const reservation of result.Reservations || []) {
        for (const instance of reservation.Instances || []) {
          instances.push(instance);
        }
      }
      setState((prev) => ({ ...prev, instances, loading: false }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to describe instances");
    }
  }, [setLoading, setError]);

  const launchInstances = useCallback(
    async (params: EC2LaunchParams) => {
      setLoading();
      try {
        const commandParams: Record<string, unknown> = {
          ImageId: params.imageId,
          InstanceType: params.instanceType,
          MinCount: params.numInstances ?? 1,
          MaxCount: params.numInstances ?? 1,
        };
        if (params.keyName) commandParams.KeyName = params.keyName;
        if (params.subnetId) commandParams.SubnetId = params.subnetId;
        if (params.securityGroupIds?.length)
          commandParams.SecurityGroupIds = params.securityGroupIds;
        if (params.iamInstanceProfile)
          commandParams.IamInstanceProfile = { Arn: params.iamInstanceProfile };
        if (params.userData)
          commandParams.UserData = Buffer.from(params.userData).toString("base64");
        if (params.monitoring) commandParams.Monitoring = { Enabled: true };
        if (params.disableApiTermination !== undefined)
          commandParams.DisableApiTermination = params.disableApiTermination;
        if (params.shutdownBehavior)
          commandParams.InstanceInitiatedShutdownBehavior = params.shutdownBehavior;
        if (params.tags?.length) {
          commandParams.TagSpecifications = [{ ResourceType: "instance", Tags: params.tags }];
        }
        if (params.blockDeviceMappings?.length) {
          commandParams.BlockDeviceMappings = params.blockDeviceMappings.map((bdm) => ({
            DeviceName: bdm.DeviceName,
            Ebs: bdm.Ebs,
          }));
        }

        const result = await ec2.send(new RunInstancesCommand(commandParams as any));
        setState((prev) => ({
          ...prev,
          instances: [...prev.instances, ...(result.Instances || [])],
          loading: false,
        }));
        return result.Instances;
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to launch instances");
        throw err;
      }
    },
    [setLoading, setError],
  );

  const startInstances = useCallback(
    async (instanceIds: string[]) => {
      setLoading();
      try {
        const result = await ec2.send(new StartInstancesCommand({ InstanceIds: instanceIds }));
        await describeInstances();
        return result.StartingInstances;
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to start instances");
        throw err;
      }
    },
    [setLoading, setError, describeInstances],
  );

  const stopInstances = useCallback(
    async (instanceIds: string[]) => {
      setLoading();
      try {
        const result = await ec2.send(new StopInstancesCommand({ InstanceIds: instanceIds }));
        await describeInstances();
        return result.StoppingInstances;
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to stop instances");
        throw err;
      }
    },
    [setLoading, setError, describeInstances],
  );

  const rebootInstances = useCallback(
    async (instanceIds: string[]) => {
      setLoading();
      try {
        await ec2.send(new RebootInstancesCommand({ InstanceIds: instanceIds }));
        await describeInstances();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to reboot instances");
        throw err;
      }
    },
    [setLoading, setError, describeInstances],
  );

  const terminateInstances = useCallback(
    async (instanceIds: string[]) => {
      setLoading();
      try {
        const result = await ec2.send(new TerminateInstancesCommand({ InstanceIds: instanceIds }));
        await describeInstances();
        return result.TerminatingInstances;
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to terminate instances");
        throw err;
      }
    },
    [setLoading, setError, describeInstances],
  );

  const describeImages = useCallback(
    async (owners?: string[]) => {
      setLoading();
      try {
        const result = await ec2.send(
          new DescribeImagesCommand({
            Owners: owners || ["amazon"],
          }),
        );
        setState((prev) => ({ ...prev, images: result.Images || [], loading: false }));
        return result.Images;
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to describe images");
        return [];
      }
    },
    [setLoading, setError],
  );

  const describeInstanceTypes = useCallback(async () => {
    setLoading();
    try {
      const result = await ec2.send(new DescribeInstanceTypesCommand({}));
      setState((prev) => ({ ...prev, instanceTypes: result.InstanceTypes || [], loading: false }));
      return result.InstanceTypes;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to describe instance types");
      return [];
    }
  }, [setLoading, setError]);

  const describeKeyPairs = useCallback(async () => {
    setLoading();
    try {
      const result = await ec2.send(new DescribeKeyPairsCommand({}));
      setState((prev) => ({ ...prev, keyPairs: result.KeyPairs || [], loading: false }));
      return result.KeyPairs;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to describe key pairs");
      return [];
    }
  }, [setLoading, setError]);

  const describeSecurityGroups = useCallback(
    async (filters?: Array<{ Name: string; Values: string[] }>) => {
      try {
        const result = await ec2.send(new DescribeSecurityGroupsCommand({ Filters: filters }));
        setState((prev) => ({ ...prev, securityGroups: result.SecurityGroups || [] }));
        return result.SecurityGroups;
      } catch (err: unknown) {
        return [];
      }
    },
    [],
  );

  const describeSubnets = useCallback(
    async (filters?: Array<{ Name: string; Values: string[] }>) => {
      try {
        const result = await ec2.send(new DescribeSubnetsCommand({ Filters: filters }));
        setState((prev) => ({ ...prev, subnets: result.Subnets || [] }));
        return result.Subnets;
      } catch (err: unknown) {
        return [];
      }
    },
    [],
  );

  const describeVpcs = useCallback(async (filters?: Array<{ Name: string; Values: string[] }>) => {
    try {
      const result = await ec2.send(new DescribeVpcsCommand({ Filters: filters }));
      setState((prev) => ({ ...prev, vpcs: result.Vpcs || [] }));
      return result.Vpcs;
    } catch (err: unknown) {
      return [];
    }
  }, []);

  const describeRegions = useCallback(async () => {
    try {
      const result = await ec2.send(new DescribeRegionsCommand({}));
      setState((prev) => ({ ...prev, regions: result.Regions || [] }));
      return result.Regions;
    } catch (err: unknown) {
      return [];
    }
  }, []);

  const describeAvailabilityZones = useCallback(async () => {
    try {
      const result = await ec2.send(new DescribeAvailabilityZonesCommand({}));
      setState((prev) => ({ ...prev, availabilityZones: result.AvailabilityZones || [] }));
      return result.AvailabilityZones;
    } catch (err: unknown) {
      return [];
    }
  }, []);

  const createTags = useCallback(
    async (resources: string[], tags: Array<{ Key: string; Value: string }>) => {
      try {
        await ec2.send(new CreateTagsCommand({ Resources: resources, Tags: tags }));
        await describeInstances();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to create tags");
        throw err;
      }
    },
    [describeInstances, setError],
  );

  const deleteTags = useCallback(
    async (resources: string[], tags: Array<{ Key: string; Value: string }>) => {
      try {
        await ec2.send(new DeleteTagsCommand({ Resources: resources, Tags: tags }));
        await describeInstances();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to delete tags");
        throw err;
      }
    },
    [describeInstances, setError],
  );

  const getConsoleOutput = useCallback(async (instanceId: string) => {
    try {
      const result = await ec2.send(new GetConsoleOutputCommand({ InstanceId: instanceId }));
      return {
        output: result.Output ? Buffer.from(result.Output, "base64").toString("utf-8") : null,
        timestamp: result.Timestamp,
      };
    } catch (err: unknown) {
      return { output: null, timestamp: null };
    }
  }, []);

  return {
    ...state,
    describeInstances,
    launchInstances,
    startInstances,
    stopInstances,
    rebootInstances,
    terminateInstances,
    describeImages,
    describeInstanceTypes,
    describeKeyPairs,
    describeSecurityGroups,
    describeSubnets,
    describeVpcs,
    describeRegions,
    describeAvailabilityZones,
    createTags,
    deleteTags,
    getConsoleOutput,
  };
}
