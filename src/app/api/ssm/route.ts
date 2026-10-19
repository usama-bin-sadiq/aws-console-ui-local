import { NextResponse } from "next/server";
import {
  DescribeParametersCommand,
  PutParameterCommand,
  GetParameterCommand,
  DeleteParameterCommand,
  SSMClient,
} from "@aws-sdk/client-ssm";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const ssmClient = getUserClientFromRequest(SSMClient, request);
    const res = await ssmClient.send(new DescribeParametersCommand({}));
    return NextResponse.json({ parameters: res.Parameters || [] });
  } catch (error) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const ssmClient = getUserClientFromRequest(SSMClient, request);
    const body = await request.json();
    if (body.action === "get") {
      const res = await ssmClient.send(
        new GetParameterCommand({ Name: body.name, WithDecryption: body.withDecryption || false }),
      );
      return NextResponse.json({ parameter: res.Parameter });
    }
    await ssmClient.send(
      new PutParameterCommand({
        Name: body.name,
        Value: body.value,
        Type: body.type || "String",
        Overwrite: true,
      }),
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const ssmClient = getUserClientFromRequest(SSMClient, request);
    const { searchParams } = new URL(request.url);
    await ssmClient.send(new DeleteParameterCommand({ Name: searchParams.get("name")! }));
    return NextResponse.json({ success: true });
  } catch (error) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
