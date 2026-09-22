import { NextResponse } from "next/server";
import {
  ECSClient,
  ListClustersCommand,
  DescribeClustersCommand,
  CreateClusterCommand,
  DeleteClusterCommand,
  CreateServiceCommand,
  UpdateServiceCommand,
  DeleteServiceCommand,
  ListServicesCommand,
  DescribeServicesCommand,
  RegisterTaskDefinitionCommand,
  ListTaskDefinitionsCommand,
  DescribeTaskDefinitionCommand,
  DeleteTaskDefinitionsCommand,
  ListTasksCommand,
  DescribeTasksCommand,
} from "@aws-sdk/client-ecs";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const ecsClient = getUserClientFromRequest(ECSClient, request);
    const listRes = await ecsClient.send(new ListClustersCommand({}));
    const clusterArns = listRes.clusterArns || [];
    if (clusterArns.length === 0) {
      return NextResponse.json({ clusters: [] });
    }
    const descRes = await ecsClient.send(new DescribeClustersCommand({ clusters: clusterArns }));
    return NextResponse.json({ clusters: descRes.clusters || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const ecsClient = getUserClientFromRequest(ECSClient, request);
    const body = await request.json();

    // Services
    if (body.action === "createService") {
      const res = await ecsClient.send(new CreateServiceCommand({
        cluster: body.cluster,
        serviceName: body.serviceName,
        taskDefinition: body.taskDefinition,
        desiredCount: body.desiredCount || 1,
      }));
      return NextResponse.json({ service: res.service });
    }
    if (body.action === "updateService") {
      const res = await ecsClient.send(new UpdateServiceCommand({
        cluster: body.cluster,
        service: body.serviceName,
        desiredCount: body.desiredCount,
        taskDefinition: body.taskDefinition,
        forceNewDeployment: body.forceNewDeployment,
      }));
      return NextResponse.json({ service: res.service });
    }
    if (body.action === "deleteService") {
      await ecsClient.send(new DeleteServiceCommand({
        cluster: body.cluster,
        service: body.serviceName,
        force: body.force,
      }));
      return NextResponse.json({ success: true });
    }
    if (body.action === "listServices") {
      const res = await ecsClient.send(new ListServicesCommand({ cluster: body.cluster }));
      const serviceArns = res.serviceArns || [];
      if (serviceArns.length === 0) {
        return NextResponse.json({ services: [] });
      }
      const descRes = await ecsClient.send(new DescribeServicesCommand({
        cluster: body.cluster,
        services: serviceArns,
      }));
      return NextResponse.json({ services: descRes.services || [] });
    }

    // Task Definitions
    if (body.action === "registerTaskDefinition") {
      const res = await ecsClient.send(new RegisterTaskDefinitionCommand({
        family: body.family,
        containerDefinitions: body.containerDefinitions || [],
        networkMode: body.networkMode,
        requiresCompatibilities: body.requiresCompatibilities,
        cpu: body.cpu,
        memory: body.memory,
        executionRoleArn: body.executionRoleArn,
        taskRoleArn: body.taskRoleArn,
      }));
      return NextResponse.json({ taskDefinition: res.taskDefinition });
    }
    if (body.action === "listTaskDefinitions") {
      const res = await ecsClient.send(new ListTaskDefinitionsCommand({
        familyPrefix: body.familyPrefix,
        status: body.status || "ACTIVE",
      }));
      return NextResponse.json({ taskDefinitionArns: res.taskDefinitionArns || [] });
    }
    if (body.action === "describeTaskDefinition") {
      const res = await ecsClient.send(new DescribeTaskDefinitionCommand({
        taskDefinition: body.taskDefinition,
      }));
      return NextResponse.json({ taskDefinition: res.taskDefinition });
    }
    if (body.action === "deleteTaskDefinitions") {
      await ecsClient.send(new DeleteTaskDefinitionsCommand({
        taskDefinitions: body.taskDefinitions || [body.taskDefinition],
      }));
      return NextResponse.json({ success: true });
    }

    // Tasks
    if (body.action === "listTasks") {
      const res = await ecsClient.send(new ListTasksCommand({
        cluster: body.cluster,
        desiredStatus: body.desiredStatus,
        serviceName: body.serviceName,
      }));
      return NextResponse.json({ taskArns: res.taskArns || [] });
    }
    if (body.action === "describeTasks") {
      const res = await ecsClient.send(new DescribeTasksCommand({
        cluster: body.cluster,
        tasks: body.tasks || [],
      }));
      return NextResponse.json({ tasks: res.tasks || [] });
    }

    // Default: createCluster
    const res = await ecsClient.send(new CreateClusterCommand({ clusterName: body.clusterName }));
    return NextResponse.json({ cluster: res.cluster });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const ecsClient = getUserClientFromRequest(ECSClient, request);
    const { searchParams } = new URL(request.url);
    const cluster = searchParams.get("cluster")!;
    await ecsClient.send(new DeleteClusterCommand({ cluster }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
