import { NextResponse } from "next/server";
import { DescribeTransitGatewaysCommand, CreateTransitGatewayCommand, DeleteTransitGatewayCommand } from "@aws-sdk/client-ec2";
import { ec2 } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await ec2.send(new DescribeTransitGatewaysCommand({}));
    return NextResponse.json({ transitGateways: res.TransitGateways || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await ec2.send(new CreateTransitGatewayCommand({ Description: body.description }));
    return NextResponse.json({ transitGateway: res.TransitGateway });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    await ec2.send(new DeleteTransitGatewayCommand({ TransitGatewayId: searchParams.get("tgwId")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
