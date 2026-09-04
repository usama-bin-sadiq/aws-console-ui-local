import { NextResponse } from "next/server";
import {
  ListNotebookInstancesCommand,
  ListEndpointsCommand,
  CreateNotebookInstanceCommand,
  CreateEndpointCommand,
  DeleteNotebookInstanceCommand,
  DeleteEndpointCommand,
  StartNotebookInstanceCommand,
  StopNotebookInstanceCommand,
} from "@aws-sdk/client-sagemaker";
import { sagemaker } from "@/lib/aws-clients";

export async function GET() {
  try {
    const [nbRes, epRes] = await Promise.all([
      sagemaker.send(new ListNotebookInstancesCommand({})),
      sagemaker.send(new ListEndpointsCommand({})),
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
  try {
    const body = await request.json();
    if (body.action === "startNotebook") {
      await sagemaker.send(new StartNotebookInstanceCommand({ NotebookInstanceName: body.name }));
      return NextResponse.json({ success: true });
    }
    if (body.action === "stopNotebook") {
      await sagemaker.send(new StopNotebookInstanceCommand({ NotebookInstanceName: body.name }));
      return NextResponse.json({ success: true });
    }
    if (body.action === "createEndpoint") {
      await sagemaker.send(new CreateEndpointCommand({
        EndpointName: body.endpointName,
        EndpointConfigName: body.endpointConfigName,
      }));
      return NextResponse.json({ success: true });
    }
    await sagemaker.send(new CreateNotebookInstanceCommand({
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
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const name = searchParams.get("name")!;
    if (type === "endpoint") {
      await sagemaker.send(new DeleteEndpointCommand({ EndpointName: name }));
    } else {
      await sagemaker.send(new DeleteNotebookInstanceCommand({ NotebookInstanceName: name }));
    }
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
