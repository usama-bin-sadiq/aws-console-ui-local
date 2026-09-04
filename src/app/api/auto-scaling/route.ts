import { NextResponse } from "next/server";
import {
  DescribeAutoScalingGroupsCommand,
  CreateAutoScalingGroupCommand,
  DeleteAutoScalingGroupCommand,
} from "@aws-sdk/client-auto-scaling";
import { autoscaling } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await autoscaling.send(new DescribeAutoScalingGroupsCommand({}));
    return NextResponse.json({ autoScalingGroups: res.AutoScalingGroups || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await autoscaling.send(new CreateAutoScalingGroupCommand({
      AutoScalingGroupName: body.groupName,
      MinSize: body.minSize || 1,
      MaxSize: body.maxSize || 3,
      DesiredCapacity: body.desiredCapacity || 1,
      AvailabilityZones: ["us-east-1a"],
    }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    await autoscaling.send(new DeleteAutoScalingGroupCommand({
      AutoScalingGroupName: searchParams.get("groupName")!,
      ForceDelete: true,
    }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
