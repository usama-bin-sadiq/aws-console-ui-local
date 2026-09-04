import { NextResponse } from "next/server";
import { DescribeVpnConnectionsCommand, CreateVpnConnectionCommand, DeleteVpnConnectionCommand } from "@aws-sdk/client-ec2";
import { ec2 } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await ec2.send(new DescribeVpnConnectionsCommand({}));
    return NextResponse.json({ vpnConnections: res.VpnConnections || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await ec2.send(new CreateVpnConnectionCommand({
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
  try {
    const { searchParams } = new URL(request.url);
    await ec2.send(new DeleteVpnConnectionCommand({ VpnConnectionId: searchParams.get("vpnConnectionId")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
