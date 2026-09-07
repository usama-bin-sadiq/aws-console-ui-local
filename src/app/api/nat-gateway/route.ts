import { NextResponse } from "next/server";
import { DescribeNatGatewaysCommand, CreateNatGatewayCommand, DeleteNatGatewayCommand } from "@aws-sdk/client-ec2";
import { ec2 } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await ec2.send(new DescribeNatGatewaysCommand({}));
    return NextResponse.json({ natGateways: res.NatGateways || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await ec2.send(new CreateNatGatewayCommand({
      SubnetId: body.subnetId,
      ConnectivityType: body.connectivityType || "private",
      AllocationId: body.allocationId || undefined,
    }));
    return NextResponse.json({ natGateway: res.NatGateway });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    await ec2.send(new DeleteNatGatewayCommand({ NatGatewayId: searchParams.get("natGatewayId")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
