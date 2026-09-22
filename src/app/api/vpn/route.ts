import { NextResponse } from "next/server";
import { DescribeVpnConnectionsCommand, CreateVpnConnectionCommand, DeleteVpnConnectionCommand, EC2Client } from "@aws-sdk/client-ec2";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const ec2Client = getUserClientFromRequest(EC2Client, request);
    const res = await ec2Client.send(new DescribeVpnConnectionsCommand({}));
    return NextResponse.json({ vpnConnections: res.VpnConnections || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const ec2Client = getUserClientFromRequest(EC2Client, request);
    const body = await request.json();
    const res = await ec2Client.send(new CreateVpnConnectionCommand({
      Type: "ipsec.1",
      CustomerGatewayId: body.customerGatewayId || "cgw-default",
      VpnGatewayId: body.vpnGatewayId || "vgw-default",
    }));
    return NextResponse.json({ vpnConnection: res.VpnConnection });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const ec2Client = getUserClientFromRequest(EC2Client, request);
    const { searchParams } = new URL(request.url);
    await ec2Client.send(new DeleteVpnConnectionCommand({ VpnConnectionId: searchParams.get("vpnConnectionId")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
