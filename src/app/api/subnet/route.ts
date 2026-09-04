import { NextResponse } from "next/server";
import { DescribeSubnetsCommand, CreateSubnetCommand, DeleteSubnetCommand } from "@aws-sdk/client-ec2";
import { ec2 } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await ec2.send(new DescribeSubnetsCommand({}));
    return NextResponse.json({ subnets: res.Subnets || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await ec2.send(new CreateSubnetCommand({ VpcId: body.vpcId, CidrBlock: body.cidrBlock }));
    return NextResponse.json({ subnet: res.Subnet });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    await ec2.send(new DeleteSubnetCommand({ SubnetId: searchParams.get("subnetId")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
