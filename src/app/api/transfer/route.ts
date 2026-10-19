import { NextResponse } from "next/server";
import {
  ListServersCommand,
  CreateServerCommand,
  DeleteServerCommand,
  CreateUserCommand,
  TransferClient,
} from "@aws-sdk/client-transfer";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const transferClient = getUserClientFromRequest(TransferClient, request);
    const res = await transferClient.send(new ListServersCommand({}));
    return NextResponse.json({ servers: res.Servers || [] });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const transferClient = getUserClientFromRequest(TransferClient, request);
    const body = await request.json();
    if (body.action === "createUser") {
      const res = await transferClient.send(
        new CreateUserCommand({
          ServerId: body.serverId,
          UserName: body.userName,
          Role: body.role || "arn:aws:iam::000000000000:role/transfer-role",
        }),
      );
      return NextResponse.json({ user: res.UserName });
    }
    const res = await transferClient.send(
      new CreateServerCommand({
        Protocols: body.protocols || ["SFTP"],
        EndpointType: body.endpointType || "PUBLIC",
      }),
    );
    return NextResponse.json({ serverId: res.ServerId });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const transferClient = getUserClientFromRequest(TransferClient, request);
    const { searchParams } = new URL(request.url);
    await transferClient.send(new DeleteServerCommand({ ServerId: searchParams.get("serverId")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
