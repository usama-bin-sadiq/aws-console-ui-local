import { NextResponse } from "next/server";
import {
  ListClustersCommand,
  DescribeClusterCommand,
  CreateClusterCommand,
  DeleteClusterCommand,
  ListNodegroupsCommand,
  DescribeNodegroupCommand,
  CreateNodegroupCommand,
  DeleteNodegroupCommand,
  UpdateNodegroupConfigCommand,
} from "@aws-sdk/client-eks";
import { EKSClient } from "@aws-sdk/client-eks";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const eksClient = getUserClientFromRequest(EKSClient, request);
    const listRes = await eksClient.send(new ListClustersCommand({}));
    const names = listRes.clusters || [];
    if (names.length === 0) return NextResponse.json({ clusters: [] });
    const details = await Promise.all(
      names.map((name) => eksClient.send(new DescribeClusterCommand({ name })).then((r) => r.cluster))
    );
    return NextResponse.json({ clusters: details.filter(Boolean) });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const eksClient = getUserClientFromRequest(EKSClient, request);
    const body = await request.json();

    if (body.action === "createNodegroup") {
      const res = await eksClient.send(new CreateNodegroupCommand({
        clusterName: body.clusterName,
        nodegroupName: body.nodegroupName,
        scalingConfig: body.scalingConfig || { minSize: 1, maxSize: 2, desiredSize: 1 },
        instanceTypes: body.instanceTypes || ["t3.medium"],
        subnets: body.subnets || [],
        nodeRole: body.nodeRole || "arn:aws:iam::000000000000:role/eks-node-role",
      }));
      return NextResponse.json({ nodegroup: res.nodegroup });
    }
    if (body.action === "deleteNodegroup") {
      await eksClient.send(new DeleteNodegroupCommand({
        clusterName: body.clusterName,
        nodegroupName: body.nodegroupName,
      }));
      return NextResponse.json({ success: true });
    }
    if (body.action === "updateNodegroupConfig") {
      const res = await eksClient.send(new UpdateNodegroupConfigCommand({
        clusterName: body.clusterName,
        nodegroupName: body.nodegroupName,
        scalingConfig: body.scalingConfig,
      }));
      return NextResponse.json({ update: res.update });
    }
    if (body.action === "listNodegroups") {
      const res = await eksClient.send(new ListNodegroupsCommand({ clusterName: body.clusterName }));
      return NextResponse.json({ nodegroups: res.nodegroups || [] });
    }
    if (body.action === "describeNodegroup") {
      const res = await eksClient.send(new DescribeNodegroupCommand({
        clusterName: body.clusterName,
        nodegroupName: body.nodegroupName,
      }));
      return NextResponse.json({ nodegroup: res.nodegroup });
    }

    const res = await eksClient.send(new CreateClusterCommand({
      name: body.name,
      version: body.version || "1.29",
      roleArn: body.roleArn || "arn:aws:iam::000000000000:role/eks-role",
      resourcesVpcConfig: body.resourcesVpcConfig || { subnetIds: [], securityGroupIds: [] },
    }));
    return NextResponse.json({ cluster: res.cluster });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const eksClient = getUserClientFromRequest(EKSClient, request);
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name")!;
    await eksClient.send(new DeleteClusterCommand({ name }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
