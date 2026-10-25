import { NextResponse } from "next/server";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";
import {
  DescribeInstancesCommand,
  StartInstancesCommand,
  StopInstancesCommand,
  TerminateInstancesCommand,
  RebootInstancesCommand,
  RunInstancesCommand,
  ModifyInstanceAttributeCommand,
  DescribeInstanceStatusCommand,
  CreateTagsCommand,
  DeleteTagsCommand,
  GetConsoleOutputCommand,
  GetConsoleScreenshotCommand,
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
  DescribeAddressesCommand,
  AllocateAddressCommand,
  ReleaseAddressCommand,
  AssociateAddressCommand,
  DisassociateAddressCommand,
  CreateImageCommand,
  DeregisterImageCommand,
  DescribeSnapshotsCommand,
  CreateSnapshotCommand,
  DeleteSnapshotCommand,
  DescribeVolumesCommand,
  CreateVolumeCommand,
  DeleteVolumeCommand,
  ModifyVolumeCommand,
  AttachVolumeCommand,
  DetachVolumeCommand,
  DescribeNetworkInterfacesCommand,
  CreateNetworkInterfaceCommand,
  DeleteNetworkInterfaceCommand,
  AttachNetworkInterfaceCommand,
  DetachNetworkInterfaceCommand,
} from "@aws-sdk/client-ec2";
import { EC2Client } from "@aws-sdk/client-ec2";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

function extractInstanceName(tags?: Array<{ Key?: string; Value?: string }>): string | undefined {
  return tags?.find((t) => t.Key === "Name")?.Value;
}

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const ec2Client = getUserClientFromRequest(EC2Client, request);
    const res = await ec2Client.send(new DescribeInstancesCommand({}));
    const instances = [];
    for (const reservation of res.Reservations || []) {
      for (const instance of reservation.Instances || []) {
        instances.push({
          ...instance,
          Name: extractInstanceName(instance.Tags),
        });
      }
    }
    return NextResponse.json({ instances });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const ec2Client = getUserClientFromRequest(EC2Client, request);
    const body = await request.json();

    if (body.action === "start") {
      const res = await ec2Client.send(
        new StartInstancesCommand({ InstanceIds: body.instanceIds }),
      );
      return NextResponse.json({ success: true, StartingInstances: res.StartingInstances });
    }

    if (body.action === "stop") {
      const res = await ec2Client.send(new StopInstancesCommand({ InstanceIds: body.instanceIds }));
      return NextResponse.json({ success: true, StoppingInstances: res.StoppingInstances });
    }

    if (body.action === "terminate") {
      const res = await ec2Client.send(
        new TerminateInstancesCommand({ InstanceIds: body.instanceIds }),
      );
      return NextResponse.json({ success: true, TerminatingInstances: res.TerminatingInstances });
    }

    if (body.action === "reboot") {
      await ec2Client.send(new RebootInstancesCommand({ InstanceIds: body.instanceIds }));
      return NextResponse.json({ success: true });
    }

    if (body.action === "launch") {
      const params: Record<string, unknown> = {
        ImageId: body.imageId,
        InstanceType: body.instanceType,
        MinCount: body.minCount ?? 1,
        MaxCount: body.maxCount ?? 1,
        KeyName: body.keyName || undefined,
        SubnetId: body.subnetId || undefined,
        SecurityGroupIds: body.securityGroupIds || undefined,
        IamInstanceProfile: body.iamInstanceProfile ? { Arn: body.iamInstanceProfile } : undefined,
        UserData: body.userData ? Buffer.from(body.userData).toString("base64") : undefined,
        TagSpecifications: body.tags?.length
          ? [
              {
                ResourceType: "instance",
                Tags: body.tags,
              },
            ]
          : undefined,
        BlockDeviceMappings: body.blockDeviceMappings || undefined,
        Monitoring: body.monitoring ? { Enabled: true } : undefined,
        DisableApiTermination: body.disableApiTermination ?? false,
        InstanceInitiatedShutdownBehavior: body.shutdownBehavior || "stop",
        NetworkInterfaces: body.networkInterfaces || undefined,
      };
      const res = await ec2Client.send(
        new RunInstancesCommand(
          params as unknown as import("@aws-sdk/client-ec2").RunInstancesCommandInput,
        ),
      );
      return NextResponse.json({
        success: true,
        instances: res.Instances?.map((i) => ({
          InstanceId: i.InstanceId,
          State: i.State,
          LaunchTime: i.LaunchTime,
        })),
      });
    }

    if (body.action === "modifyAttribute") {
      try {
        await ec2Client.send(
          new ModifyInstanceAttributeCommand({
            InstanceId: body.instanceId,
            ...body.attributes,
          }),
        );
        return NextResponse.json({ success: true });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to modify attribute";
        return NextResponse.json({ error: message }, { status: 500 });
      }
    }

    if (body.action === "describeStatus") {
      const res = await ec2Client.send(
        new DescribeInstanceStatusCommand({
          InstanceIds: body.instanceIds,
        }),
      );
      return NextResponse.json({ instanceStatuses: res.InstanceStatuses || [] });
    }

    if (body.action === "createTags") {
      await ec2Client.send(
        new CreateTagsCommand({
          Resources: body.resources,
          Tags: body.tags,
        }),
      );
      return NextResponse.json({ success: true });
    }

    if (body.action === "deleteTags") {
      await ec2Client.send(
        new DeleteTagsCommand({
          Resources: body.resources,
          Tags: body.tags,
        }),
      );
      return NextResponse.json({ success: true });
    }

    if (body.action === "getConsoleOutput") {
      const res = await ec2Client.send(
        new GetConsoleOutputCommand({
          InstanceId: body.instanceId,
        }),
      );
      return NextResponse.json({
        Output: res.Output ? Buffer.from(res.Output, "base64").toString("utf-8") : null,
        Timestamp: res.Timestamp,
      });
    }

    if (body.action === "describeImages") {
      const res = await ec2Client.send(
        new DescribeImagesCommand({
          Owners: body.owners || ["amazon"],
          Filters: body.filters || undefined,
          ImageIds: body.imageIds || undefined,
        }),
      );
      return NextResponse.json({ images: res.Images || [] });
    }

    if (body.action === "describeInstanceTypes") {
      const res = await ec2Client.send(
        new DescribeInstanceTypesCommand({
          Filters: body.filters || undefined,
          MaxResults: body.maxResults || 50,
          NextToken: body.nextToken || undefined,
        }),
      );
      return NextResponse.json({
        instanceTypes: res.InstanceTypes || [],
        nextToken: res.NextToken,
      });
    }

    if (body.action === "describeKeyPairs") {
      const res = await ec2Client.send(
        new DescribeKeyPairsCommand({
          Filters: body.filters || undefined,
        }),
      );
      return NextResponse.json({ keyPairs: res.KeyPairs || [] });
    }

    if (body.action === "createKeyPair") {
      const res = await ec2Client.send(
        new CreateKeyPairCommand({
          KeyName: body.keyName,
          KeyType: body.keyType || "rsa",
          TagSpecifications: body.tags
            ? [
                {
                  ResourceType: "key-pair",
                  Tags: body.tags,
                },
              ]
            : undefined,
        }),
      );
      return NextResponse.json({
        success: true,
        keyPair: {
          KeyName: res.KeyName,
          KeyFingerprint: res.KeyFingerprint,
          KeyMaterial: res.KeyMaterial,
        },
      });
    }

    if (body.action === "deleteKeyPair") {
      await ec2Client.send(new DeleteKeyPairCommand({ KeyName: body.keyName }));
      return NextResponse.json({ success: true });
    }

    if (body.action === "describeSecurityGroups") {
      const res = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: body.filters || undefined,
          GroupIds: body.groupIds || undefined,
        }),
      );
      return NextResponse.json({ securityGroups: res.SecurityGroups || [] });
    }

    if (body.action === "describeSubnets") {
      const res = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: body.filters || undefined,
          SubnetIds: body.subnetIds || undefined,
        }),
      );
      return NextResponse.json({ subnets: res.Subnets || [] });
    }

    if (body.action === "describeVpcs") {
      const res = await ec2Client.send(
        new DescribeVpcsCommand({
          Filters: body.filters || undefined,
          VpcIds: body.vpcIds || undefined,
        }),
      );
      return NextResponse.json({ vpcs: res.Vpcs || [] });
    }

    if (body.action === "describeRegions") {
      const res = await ec2Client.send(new DescribeRegionsCommand({}));
      return NextResponse.json({ regions: res.Regions || [] });
    }

    if (body.action === "describeAvailabilityZones") {
      const res = await ec2Client.send(
        new DescribeAvailabilityZonesCommand({
          Filters: body.filters || undefined,
        }),
      );
      return NextResponse.json({ availabilityZones: res.AvailabilityZones || [] });
    }

    if (body.action === "getConsoleScreenshot") {
      const res = await ec2Client.send(
        new GetConsoleScreenshotCommand({
          InstanceId: body.instanceId,
        }),
      );
      return NextResponse.json({
        ImageData: res.ImageData ? Buffer.from(res.ImageData).toString("base64") : null,
      });
    }

    if (body.action === "allocateAddress") {
      const res = await ec2Client.send(
        new AllocateAddressCommand({
          Domain: body.domain || "vpc",
          NetworkBorderGroup: body.networkBorderGroup,
          CustomerOwnedIpv4Pool: body.customerOwnedIpv4Pool,
          PublicIpv4Pool: body.publicIpv4Pool,
          TagSpecifications: body.tags?.length
            ? [
                {
                  ResourceType: "elastic-ip",
                  Tags: body.tags,
                },
              ]
            : undefined,
        }),
      );
      return NextResponse.json({
        success: true,
        allocationId: res.AllocationId,
        publicIp: res.PublicIp,
        domain: res.Domain,
      });
    }

    if (body.action === "releaseAddress") {
      await ec2Client.send(
        new ReleaseAddressCommand({
          AllocationId: body.allocationId,
        }),
      );
      return NextResponse.json({ success: true });
    }

    if (body.action === "associateAddress") {
      const res = await ec2Client.send(
        new AssociateAddressCommand({
          AllocationId: body.allocationId,
          InstanceId: body.instanceId,
          NetworkInterfaceId: body.networkInterfaceId,
          PrivateIpAddress: body.privateIpAddress,
          AllowReassociation: body.allowReassociation ?? false,
        }),
      );
      return NextResponse.json({
        success: true,
        associationId: res.AssociationId,
      });
    }

    if (body.action === "disassociateAddress") {
      await ec2Client.send(
        new DisassociateAddressCommand({
          AssociationId: body.associationId,
        }),
      );
      return NextResponse.json({ success: true });
    }

    if (body.action === "describeAddresses") {
      const res = await ec2Client.send(
        new DescribeAddressesCommand({
          AllocationIds: body.allocationIds || undefined,
          Filters: body.filters || undefined,
        }),
      );
      return NextResponse.json({ addresses: res.Addresses || [] });
    }

    if (body.action === "createImage") {
      const res = await ec2Client.send(
        new CreateImageCommand({
          InstanceId: body.instanceId,
          Name: body.name,
          Description: body.description,
          NoReboot: body.noReboot ?? false,
          BlockDeviceMappings: body.blockDeviceMappings || undefined,
          TagSpecifications: body.tags?.length
            ? [
                {
                  ResourceType: "image",
                  Tags: body.tags,
                },
              ]
            : undefined,
        }),
      );
      return NextResponse.json({
        success: true,
        imageId: res.ImageId,
      });
    }

    if (body.action === "deregisterImage") {
      await ec2Client.send(
        new DeregisterImageCommand({
          ImageId: body.imageId,
        }),
      );
      return NextResponse.json({ success: true });
    }

    if (body.action === "describeSnapshots") {
      const res = await ec2Client.send(
        new DescribeSnapshotsCommand({
          SnapshotIds: body.snapshotIds || undefined,
          OwnerIds: body.ownerIds || ["self"],
          Filters: body.filters || undefined,
          MaxResults: body.maxResults || 100,
          NextToken: body.nextToken || undefined,
        }),
      );
      return NextResponse.json({
        snapshots: res.Snapshots || [],
        nextToken: res.NextToken,
      });
    }

    if (body.action === "createSnapshot") {
      const res = await ec2Client.send(
        new CreateSnapshotCommand({
          VolumeId: body.volumeId,
          Description: body.description,
          TagSpecifications: body.tags?.length
            ? [
                {
                  ResourceType: "snapshot",
                  Tags: body.tags,
                },
              ]
            : undefined,
        }),
      );
      return NextResponse.json({
        success: true,
        snapshotId: res.SnapshotId,
        state: res.State,
      });
    }

    if (body.action === "deleteSnapshot") {
      await ec2Client.send(
        new DeleteSnapshotCommand({
          SnapshotId: body.snapshotId,
        }),
      );
      return NextResponse.json({ success: true });
    }

    if (body.action === "describeVolumes") {
      const res = await ec2Client.send(
        new DescribeVolumesCommand({
          VolumeIds: body.volumeIds || undefined,
          Filters: body.filters || undefined,
          MaxResults: body.maxResults || 100,
          NextToken: body.nextToken || undefined,
        }),
      );
      return NextResponse.json({
        volumes: res.Volumes || [],
        nextToken: res.NextToken,
      });
    }

    if (body.action === "createVolume") {
      const res = await ec2Client.send(
        new CreateVolumeCommand({
          AvailabilityZone: body.availabilityZone,
          Size: body.size,
          VolumeType: body.volumeType || "gp3",
          Iops: body.iops,
          Throughput: body.throughput,
          Encrypted: body.encrypted ?? false,
          KmsKeyId: body.kmsKeyId,
          SnapshotId: body.snapshotId,
          TagSpecifications: body.tags?.length
            ? [
                {
                  ResourceType: "volume",
                  Tags: body.tags,
                },
              ]
            : undefined,
        }),
      );
      return NextResponse.json({
        success: true,
        volumeId: res.VolumeId,
        state: res.State,
      });
    }

    if (body.action === "deleteVolume") {
      await ec2Client.send(
        new DeleteVolumeCommand({
          VolumeId: body.volumeId,
        }),
      );
      return NextResponse.json({ success: true });
    }

    if (body.action === "modifyVolume") {
      const res = await ec2Client.send(
        new ModifyVolumeCommand({
          VolumeId: body.volumeId,
          Size: body.size,
          VolumeType: body.volumeType,
          Iops: body.iops,
          Throughput: body.throughput,
        }),
      );
      return NextResponse.json({
        success: true,
        volumeModification: res.VolumeModification,
      });
    }

    if (body.action === "attachVolume") {
      const res = await ec2Client.send(
        new AttachVolumeCommand({
          VolumeId: body.volumeId,
          InstanceId: body.instanceId,
          Device: body.device,
        }),
      );
      return NextResponse.json({
        success: true,
        state: res.State,
      });
    }

    if (body.action === "detachVolume") {
      await ec2Client.send(
        new DetachVolumeCommand({
          VolumeId: body.volumeId,
          InstanceId: body.instanceId,
          Device: body.device,
          Force: body.force ?? false,
        }),
      );
      return NextResponse.json({ success: true });
    }

    if (body.action === "describeNetworkInterfaces") {
      const res = await ec2Client.send(
        new DescribeNetworkInterfacesCommand({
          NetworkInterfaceIds: body.networkInterfaceIds || undefined,
          Filters: body.filters || undefined,
          MaxResults: body.maxResults || 100,
          NextToken: body.nextToken || undefined,
        }),
      );
      return NextResponse.json({
        networkInterfaces: res.NetworkInterfaces || [],
        nextToken: res.NextToken,
      });
    }

    if (body.action === "createNetworkInterface") {
      const res = await ec2Client.send(
        new CreateNetworkInterfaceCommand({
          SubnetId: body.subnetId,
          Description: body.description,
          Groups: body.groups || undefined,
          PrivateIpAddress: body.privateIpAddress,
          PrivateIpAddresses: body.privateIpAddresses || undefined,
          SecondaryPrivateIpAddressCount: body.secondaryPrivateIpAddressCount,
          Ipv6AddressCount: body.ipv6AddressCount,
          Ipv6Addresses: body.ipv6Addresses || undefined,
          TagSpecifications: body.tags?.length
            ? [
                {
                  ResourceType: "network-interface",
                  Tags: body.tags,
                },
              ]
            : undefined,
        }),
      );
      return NextResponse.json({
        success: true,
        networkInterface: res.NetworkInterface,
      });
    }

    if (body.action === "deleteNetworkInterface") {
      await ec2Client.send(
        new DeleteNetworkInterfaceCommand({
          NetworkInterfaceId: body.networkInterfaceId,
        }),
      );
      return NextResponse.json({ success: true });
    }

    if (body.action === "attachNetworkInterface") {
      const res = await ec2Client.send(
        new AttachNetworkInterfaceCommand({
          NetworkInterfaceId: body.networkInterfaceId,
          InstanceId: body.instanceId,
          DeviceIndex: body.deviceIndex,
          NetworkCardIndex: body.networkCardIndex,
        }),
      );
      return NextResponse.json({
        success: true,
        attachmentId: res.AttachmentId,
      });
    }

    if (body.action === "detachNetworkInterface") {
      await ec2Client.send(
        new DetachNetworkInterfaceCommand({
          AttachmentId: body.attachmentId,
          Force: body.force ?? false,
        }),
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
