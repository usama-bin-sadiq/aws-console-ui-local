import { NextResponse } from "next/server";
import {
  DescribeVpcPeeringConnectionsCommand,
  CreateVpcPeeringConnectionCommand,
  DeleteVpcPeeringConnectionCommand,
} from "@aws-sdk/client-ec2";
import { ec2 } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await ec2.send(new DescribeVpcPeeringConnectionsCommand({}));
    return NextResponse.json({ vpcPeeringConnections: res.VpcPeeringConnections || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await ec2.send(new CreateVpcPeeringConnectionCommand({ VpcId: body.vpcId, PeerVpcId: body.peerVpcId }));
    return NextResponse.json({ vpcPeeringConnection: res.VpcPeeringConnection });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    await ec2.send(new DeleteVpcPeeringConnectionCommand({ VpcPeeringConnectionId: searchParams.get("peeringId")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
