import { NextResponse } from "next/server";
import { ListServersCommand, CreateServerCommand, DeleteServerCommand, CreateUserCommand } from "@aws-sdk/client-transfer";
import { transfer } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await transfer.send(new ListServersCommand({}));
    return NextResponse.json({ servers: res.Servers || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "createUser") {
      const res = await transfer.send(new CreateUserCommand({ ServerId: body.serverId, UserName: body.userName, Role: body.role || "arn:aws:iam::000000000000:role/transfer-role" }));
      return NextResponse.json({ user: res.UserName });
    }
    const res = await transfer.send(new CreateServerCommand({ Protocols: body.protocols || ["SFTP"], EndpointType: body.endpointType || "PUBLIC" }));
    return NextResponse.json({ serverId: res.ServerId });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    await transfer.send(new DeleteServerCommand({ ServerId: searchParams.get("serverId")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
