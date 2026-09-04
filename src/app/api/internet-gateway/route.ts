import { NextResponse } from "next/server";
import {
  DescribeInternetGatewaysCommand,
  CreateInternetGatewayCommand,
  DeleteInternetGatewayCommand,
  AttachInternetGatewayCommand,
} from "@aws-sdk/client-ec2";
import { ec2 } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await ec2.send(new DescribeInternetGatewaysCommand({}));
    return NextResponse.json({ internetGateways: res.InternetGateways || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "attach") {
      await ec2.send(new AttachInternetGatewayCommand({ InternetGatewayId: body.igwId, VpcId: body.vpcId }));
      return NextResponse.json({ success: true });
    }
    // default: create
    const res = await ec2.send(new CreateInternetGatewayCommand({}));
    return NextResponse.json({ internetGateway: res.InternetGateway });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    await ec2.send(new DeleteInternetGatewayCommand({ InternetGatewayId: searchParams.get("igwId")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
