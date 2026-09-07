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
} from "@aws-sdk/client-ec2";
import { ec2 } from "@/lib/aws-clients";

function extractInstanceName(tags?: Array<{ Key?: string; Value?: string }>): string | undefined {
  return tags?.find((t) => t.Key === "Name")?.Value;
}

export async function GET() {
  try {
    const res = await ec2.send(new DescribeInstancesCommand({}));
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
  try {
    const body = await request.json();

    if (body.action === "start") {
      const res = await ec2.send(new StartInstancesCommand({ InstanceIds: body.instanceIds }));
      return NextResponse.json({ success: true, StartingInstances: res.StartingInstances });
    }

    if (body.action === "stop") {
      const res = await ec2.send(new StopInstancesCommand({ InstanceIds: body.instanceIds }));
      return NextResponse.json({ success: true, StoppingInstances: res.StoppingInstances });
    }

    if (body.action === "terminate") {
      const res = await ec2.send(new TerminateInstancesCommand({ InstanceIds: body.instanceIds }));
      return NextResponse.json({ success: true, TerminatingInstances: res.TerminatingInstances });
    }

    if (body.action === "reboot") {
      await ec2.send(new RebootInstancesCommand({ InstanceIds: body.instanceIds }));
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
        TagSpecifications: body.tags?.length ? [{
          ResourceType: "instance",
          Tags: body.tags,
        }] : undefined,
        BlockDeviceMappings: body.blockDeviceMappings || undefined,
        Monitoring: body.monitoring ? { Enabled: true } : undefined,
        DisableApiTermination: body.disableApiTermination ?? false,
        InstanceInitiatedShutdownBehavior: body.shutdownBehavior || "stop",
        NetworkInterfaces: body.networkInterfaces || undefined,
      };
      const res = await ec2.send(new RunInstancesCommand(params as any));
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
        await ec2.send(new ModifyInstanceAttributeCommand({
          InstanceId: body.instanceId,
          ...body.attributes,
        }));
        return NextResponse.json({ success: true });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to modify attribute";
        return NextResponse.json({ error: message }, { status: 500 });
      }
    }

    if (body.action === "describeStatus") {
      const res = await ec2.send(new DescribeInstanceStatusCommand({
        InstanceIds: body.instanceIds,
      }));
      return NextResponse.json({ instanceStatuses: res.InstanceStatuses || [] });
    }

    if (body.action === "createTags") {
      await ec2.send(new CreateTagsCommand({
        Resources: body.resources,
        Tags: body.tags,
      }));
      return NextResponse.json({ success: true });
    }

    if (body.action === "deleteTags") {
      await ec2.send(new DeleteTagsCommand({
        Resources: body.resources,
        Tags: body.tags,
      }));
      return NextResponse.json({ success: true });
    }

    if (body.action === "getConsoleOutput") {
      const res = await ec2.send(new GetConsoleOutputCommand({
        InstanceId: body.instanceId,
      }));
      return NextResponse.json({
        Output: res.Output ? Buffer.from(res.Output, "base64").toString("utf-8") : null,
        Timestamp: res.Timestamp,
      });
    }

    if (body.action === "describeImages") {
      const res = await ec2.send(new DescribeImagesCommand({
        Owners: body.owners || ["amazon"],
        Filters: body.filters || undefined,
        ImageIds: body.imageIds || undefined,
      }));
      return NextResponse.json({ images: res.Images || [] });
    }

    if (body.action === "describeInstanceTypes") {
      const res = await ec2.send(new DescribeInstanceTypesCommand({
        Filters: body.filters || undefined,
        MaxResults: body.maxResults || 50,
        NextToken: body.nextToken || undefined,
      }));
      return NextResponse.json({
        instanceTypes: res.InstanceTypes || [],
        nextToken: res.NextToken,
      });
    }

    if (body.action === "describeKeyPairs") {
      const res = await ec2.send(new DescribeKeyPairsCommand({
        Filters: body.filters || undefined,
      }));
      return NextResponse.json({ keyPairs: res.KeyPairs || [] });
    }

    if (body.action === "createKeyPair") {
      const res = await ec2.send(new CreateKeyPairCommand({
        KeyName: body.keyName,
        KeyType: body.keyType || "rsa",
        TagSpecifications: body.tags ? [{
          ResourceType: "key-pair",
          Tags: body.tags,
        }] : undefined,
      }));
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
      await ec2.send(new DeleteKeyPairCommand({ KeyName: body.keyName }));
      return NextResponse.json({ success: true });
    }

    if (body.action === "describeSecurityGroups") {
      const res = await ec2.send(new DescribeSecurityGroupsCommand({
        Filters: body.filters || undefined,
        GroupIds: body.groupIds || undefined,
      }));
      return NextResponse.json({ securityGroups: res.SecurityGroups || [] });
    }

    if (body.action === "describeSubnets") {
      const res = await ec2.send(new DescribeSubnetsCommand({
        Filters: body.filters || undefined,
        SubnetIds: body.subnetIds || undefined,
      }));
      return NextResponse.json({ subnets: res.Subnets || [] });
    }

    if (body.action === "describeVpcs") {
      const res = await ec2.send(new DescribeVpcsCommand({
        Filters: body.filters || undefined,
        VpcIds: body.vpcIds || undefined,
      }));
      return NextResponse.json({ vpcs: res.Vpcs || [] });
    }

    if (body.action === "describeRegions") {
      const res = await ec2.send(new DescribeRegionsCommand({}));
      return NextResponse.json({ regions: res.Regions || [] });
    }

    if (body.action === "describeAvailabilityZones") {
      const res = await ec2.send(new DescribeAvailabilityZonesCommand({
        Filters: body.filters || undefined,
      }));
      return NextResponse.json({ availabilityZones: res.AvailabilityZones || [] });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
