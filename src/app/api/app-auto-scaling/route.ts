import { NextResponse } from "next/server";
import {
  DescribeScalableTargetsCommand,
  RegisterScalableTargetCommand,
  DeregisterScalableTargetCommand,
} from "@aws-sdk/client-application-auto-scaling";
import { ApplicationAutoScalingClient } from "@aws-sdk/client-application-auto-scaling";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const applicationAutoscalingClient = getUserClientFromRequest(
      ApplicationAutoScalingClient,
      request,
    );
    const res = await applicationAutoscalingClient.send(
      new DescribeScalableTargetsCommand({ ServiceNamespace: "ecs" }),
    );
    return NextResponse.json({ scalableTargets: res.ScalableTargets || [] });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const applicationAutoscalingClient = getUserClientFromRequest(
      ApplicationAutoScalingClient,
      request,
    );
    const body = await request.json();
    await applicationAutoscalingClient.send(
      new RegisterScalableTargetCommand({
        ServiceNamespace: body.namespace || "ecs",
        ResourceId: body.resourceId,
        ScalableDimension: body.scalableDimension || "ecs:service:DesiredCount",
        MinCapacity: body.minCapacity || 1,
        MaxCapacity: body.maxCapacity || 10,
      }),
    );
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const applicationAutoscalingClient = getUserClientFromRequest(
      ApplicationAutoScalingClient,
      request,
    );
    const { searchParams } = new URL(request.url);
    await applicationAutoscalingClient.send(
      new DeregisterScalableTargetCommand({
        ServiceNamespace: (searchParams.get("namespace") ||
          "ecs") as import("@aws-sdk/client-application-auto-scaling").ServiceNamespace,
        ResourceId: searchParams.get("resourceId")!,
        ScalableDimension: (searchParams.get("dimension") ||
          "ecs:service:DesiredCount") as import("@aws-sdk/client-application-auto-scaling").ScalableDimension,
      }),
    );
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
