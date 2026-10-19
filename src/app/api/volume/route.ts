import { NextResponse } from "next/server";
import {
  EC2Client,
  DescribeVolumesCommand,
  CreateVolumeCommand,
  DeleteVolumeCommand,
  AttachVolumeCommand,
  DetachVolumeCommand,
  ModifyVolumeCommand,
  CreateTagsCommand,
  DescribeInstancesCommand,
} from "@aws-sdk/client-ec2";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const ec2Client = getUserClientFromRequest(EC2Client, request);
    const res = await ec2Client.send(new DescribeVolumesCommand({}));
    return NextResponse.json({ volumes: res.Volumes || [] });
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

    if (body.action === "create") {
      const res = await ec2Client.send(
        new CreateVolumeCommand({
          AvailabilityZone: body.availabilityZone || "us-east-1a",
          Size: body.size || 20,
          VolumeType: body.volumeType || "gp3",
          Iops: body.iops,
          Throughput: body.throughput,
          Encrypted: body.encrypted ?? false,
          KmsKeyId: body.kmsKeyId,
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
      return NextResponse.json({ volume: res });
    }

    if (body.action === "delete") {
      await ec2Client.send(new DeleteVolumeCommand({ VolumeId: body.volumeId }));
      return NextResponse.json({ success: true });
    }

    if (body.action === "attach") {
      const res = await ec2Client.send(
        new AttachVolumeCommand({
          VolumeId: body.volumeId,
          InstanceId: body.instanceId,
          Device: body.device || "/dev/xvdf",
        }),
      );
      return NextResponse.json({ success: true, attachment: res });
    }

    if (body.action === "detach") {
      const res = await ec2Client.send(
        new DetachVolumeCommand({
          VolumeId: body.volumeId,
          Force: body.force ?? false,
        }),
      );
      return NextResponse.json({ success: true, detachment: res });
    }

    if (body.action === "modify") {
      const res = await ec2Client.send(
        new ModifyVolumeCommand({
          VolumeId: body.volumeId,
          Size: body.size,
          VolumeType: body.volumeType,
          Iops: body.iops,
          Throughput: body.throughput,
        }),
      );
      return NextResponse.json({ success: true, modification: res });
    }

    if (body.action === "createTags") {
      await ec2Client.send(
        new CreateTagsCommand({
          Resources: [body.volumeId],
          Tags: body.tags,
        }),
      );
      return NextResponse.json({ success: true });
    }

    if (body.action === "listInstances") {
      const res = await ec2Client.send(new DescribeInstancesCommand({}));
      const instances = [];
      for (const reservation of res.Reservations || []) {
        for (const instance of reservation.Instances || []) {
          if (instance.State?.Name === "running") {
            instances.push({
              InstanceId: instance.InstanceId,
              Name: instance.Tags?.find((t) => t.Key === "Name")?.Value,
            });
          }
        }
      }
      return NextResponse.json({ instances });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
