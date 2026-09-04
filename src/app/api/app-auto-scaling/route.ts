import { NextResponse } from "next/server";
import {
  DescribeScalableTargetsCommand,
  RegisterScalableTargetCommand,
  DeregisterScalableTargetCommand,
} from "@aws-sdk/client-application-auto-scaling";
import { applicationAutoscaling } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await applicationAutoscaling.send(
      new DescribeScalableTargetsCommand({ ServiceNamespace: "ecs" })
    );
    return NextResponse.json({ scalableTargets: res.ScalableTargets || [] });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await applicationAutoscaling.send(
      new RegisterScalableTargetCommand({
        ServiceNamespace: body.namespace || "ecs",
        ResourceId: body.resourceId,
        ScalableDimension: body.scalableDimension || "ecs:service:DesiredCount",
        MinCapacity: body.minCapacity || 1,
        MaxCapacity: body.maxCapacity || 10,
      })
    );
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    await applicationAutoscaling.send(
      new DeregisterScalableTargetCommand({
        ServiceNamespace: searchParams.get("namespace") || "ecs",
        ResourceId: searchParams.get("resourceId")!,
        ScalableDimension:
          searchParams.get("dimension") || "ecs:service:DesiredCount",
      })
    );
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
