import { NextResponse } from "next/server";
import { DescribeSecurityGroupsCommand, CreateSecurityGroupCommand, DeleteSecurityGroupCommand } from "@aws-sdk/client-ec2";
import { ec2 } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await ec2.send(new DescribeSecurityGroupsCommand({}));
    return NextResponse.json({ securityGroups: res.SecurityGroups || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await ec2.send(new CreateSecurityGroupCommand({ GroupName: body.groupName, Description: body.description, VpcId: body.vpcId }));
    return NextResponse.json({ groupId: res.GroupId });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    await ec2.send(new DeleteSecurityGroupCommand({ GroupId: searchParams.get("groupId")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
