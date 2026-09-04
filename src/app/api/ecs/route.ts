import { NextResponse } from "next/server";
import {
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
import { ecs } from "@/lib/aws-clients";

export async function GET() {
  try {
    const listRes = await ecs.send(new ListClustersCommand({}));
    const clusterArns = listRes.clusterArns || [];
    if (clusterArns.length === 0) {
      return NextResponse.json({ clusters: [] });
    }
    const descRes = await ecs.send(new DescribeClustersCommand({ clusters: clusterArns }));
    return NextResponse.json({ clusters: descRes.clusters || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Services
    if (body.action === "createService") {
      const res = await ecs.send(new CreateServiceCommand({
        cluster: body.cluster,
        serviceName: body.serviceName,
        taskDefinition: body.taskDefinition,
        desiredCount: body.desiredCount || 1,
      }));
      return NextResponse.json({ service: res.service });
    }
    if (body.action === "updateService") {
      const res = await ecs.send(new UpdateServiceCommand({
        cluster: body.cluster,
        service: body.serviceName,
        desiredCount: body.desiredCount,
        taskDefinition: body.taskDefinition,
        forceNewDeployment: body.forceNewDeployment,
      }));
      return NextResponse.json({ service: res.service });
    }
    if (body.action === "deleteService") {
      await ecs.send(new DeleteServiceCommand({
        cluster: body.cluster,
        service: body.serviceName,
        force: body.force,
      }));
      return NextResponse.json({ success: true });
    }
    if (body.action === "listServices") {
      const res = await ecs.send(new ListServicesCommand({ cluster: body.cluster }));
      const serviceArns = res.serviceArns || [];
      if (serviceArns.length === 0) {
        return NextResponse.json({ services: [] });
      }
      const descRes = await ecs.send(new DescribeServicesCommand({
        cluster: body.cluster,
        services: serviceArns,
      }));
      return NextResponse.json({ services: descRes.services || [] });
    }

    // Task Definitions
    if (body.action === "registerTaskDefinition") {
      const res = await ecs.send(new RegisterTaskDefinitionCommand({
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
      const res = await ecs.send(new ListTaskDefinitionsCommand({
        familyPrefix: body.familyPrefix,
        status: body.status || "ACTIVE",
      }));
      return NextResponse.json({ taskDefinitionArns: res.taskDefinitionArns || [] });
    }
    if (body.action === "describeTaskDefinition") {
      const res = await ecs.send(new DescribeTaskDefinitionCommand({
        taskDefinition: body.taskDefinition,
      }));
      return NextResponse.json({ taskDefinition: res.taskDefinition });
    }
    if (body.action === "deleteTaskDefinitions") {
      await ecs.send(new DeleteTaskDefinitionsCommand({
        taskDefinitions: body.taskDefinitions || [body.taskDefinition],
      }));
      return NextResponse.json({ success: true });
    }

    // Tasks
    if (body.action === "listTasks") {
      const res = await ecs.send(new ListTasksCommand({
        cluster: body.cluster,
        desiredStatus: body.desiredStatus,
        serviceName: body.serviceName,
      }));
      return NextResponse.json({ taskArns: res.taskArns || [] });
    }
    if (body.action === "describeTasks") {
      const res = await ecs.send(new DescribeTasksCommand({
        cluster: body.cluster,
        tasks: body.tasks || [],
      }));
      return NextResponse.json({ tasks: res.tasks || [] });
    }

    // Default: createCluster
    const res = await ecs.send(new CreateClusterCommand({ clusterName: body.clusterName }));
    return NextResponse.json({ cluster: res.cluster });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cluster = searchParams.get("cluster")!;
    await ecs.send(new DeleteClusterCommand({ cluster }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
