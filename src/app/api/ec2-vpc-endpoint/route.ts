import { NextResponse } from "next/server";
import { DescribeVpcEndpointsCommand, CreateVpcEndpointCommand, DeleteVpcEndpointsCommand } from "@aws-sdk/client-ec2";
import { ec2 } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await ec2.send(new DescribeVpcEndpointsCommand({}));
    return NextResponse.json({ vpcEndpoints: res.VpcEndpoints || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await ec2.send(new CreateVpcEndpointCommand({ VpcId: body.vpcId, ServiceName: body.serviceName, VpcEndpointType: body.type || "Interface" }));
    return NextResponse.json({ vpcEndpoint: res.VpcEndpoint });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("vpcEndpointId")!;
    await ec2.send(new DeleteVpcEndpointsCommand({ VpcEndpointIds: [id] }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
