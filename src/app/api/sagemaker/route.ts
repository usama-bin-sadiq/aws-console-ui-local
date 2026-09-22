import { NextResponse } from "next/server";
import {
  SageMakerClient,
  ListNotebookInstancesCommand,
  ListEndpointsCommand,
  CreateNotebookInstanceCommand,
  CreateEndpointCommand,
  DeleteNotebookInstanceCommand,
  DeleteEndpointCommand,
  StartNotebookInstanceCommand,
  StopNotebookInstanceCommand,
} from "@aws-sdk/client-sagemaker";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const sagemakerClient = getUserClientFromRequest(SageMakerClient, request);
    const [nbRes, epRes] = await Promise.all([
      sagemakerClient.send(new ListNotebookInstancesCommand({})),
      sagemakerClient.send(new ListEndpointsCommand({})),
    ]);
    return NextResponse.json({
      notebookInstances: nbRes.NotebookInstances || [],
      endpoints: epRes.Endpoints || [],
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const sagemakerClient = getUserClientFromRequest(SageMakerClient, request);
    const body = await request.json();
    if (body.action === "startNotebook") {
      await sagemakerClient.send(new StartNotebookInstanceCommand({ NotebookInstanceName: body.name }));
      return NextResponse.json({ success: true });
    }
    if (body.action === "stopNotebook") {
      await sagemakerClient.send(new StopNotebookInstanceCommand({ NotebookInstanceName: body.name }));
      return NextResponse.json({ success: true });
    }
    if (body.action === "createEndpoint") {
      await sagemakerClient.send(new CreateEndpointCommand({
        EndpointName: body.endpointName,
        EndpointConfigName: body.endpointConfigName,
      }));
      return NextResponse.json({ success: true });
    }
    await sagemakerClient.send(new CreateNotebookInstanceCommand({
      NotebookInstanceName: body.notebookInstanceName,
      InstanceType: body.instanceType || "ml.t2.medium",
      RoleArn: body.roleArn || "arn:aws:iam::000000000000:role/sagemaker-role",
    }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const sagemakerClient = getUserClientFromRequest(SageMakerClient, request);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const name = searchParams.get("name")!;
    if (type === "endpoint") {
      await sagemakerClient.send(new DeleteEndpointCommand({ EndpointName: name }));
    } else {
      await sagemakerClient.send(new DeleteNotebookInstanceCommand({ NotebookInstanceName: name }));
    }
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
