import { NextResponse } from "next/server";
import {
  DescribeAutoScalingGroupsCommand,
  CreateAutoScalingGroupCommand,
  UpdateAutoScalingGroupCommand,
  DeleteAutoScalingGroupCommand,
  DescribeLaunchConfigurationsCommand,
  CreateLaunchConfigurationCommand,
  DescribePoliciesCommand,
  PutScalingPolicyCommand,
  DeletePolicyCommand,
  DescribeScheduledActionsCommand,
  PutScheduledUpdateGroupActionCommand,
  DeleteScheduledActionCommand,
} from "@aws-sdk/client-auto-scaling";
import { autoscaling } from "@/lib/aws-clients";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const groupName = searchParams.get("groupName");

    if (action === "launchConfigurations") {
      const res = await autoscaling.send(
        new DescribeLaunchConfigurationsCommand({})
      );
      return NextResponse.json({
        launchConfigurations: res.LaunchConfigurations || [],
      });
    }

    if (action === "scalingPolicies" && groupName) {
      const res = await autoscaling.send(
        new DescribePoliciesCommand({
          AutoScalingGroupName: groupName,
        })
      );
      return NextResponse.json({ scalingPolicies: res.ScalingPolicies || [] });
    }

    if (action === "scheduledActions" && groupName) {
      const res = await autoscaling.send(
        new DescribeScheduledActionsCommand({
          AutoScalingGroupName: groupName,
        })
      );
      const output = res as { ScheduledActions?: any[]; scheduledActions?: any[] };
      return NextResponse.json({
        scheduledActions: output.ScheduledActions || output.scheduledActions || [],
      });
    }

    const res = await autoscaling.send(
      new DescribeAutoScalingGroupsCommand({})
    );
    return NextResponse.json({
      autoScalingGroups: res.AutoScalingGroups || [],
    });
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

    if (body.action === "updateGroup") {
      await autoscaling.send(
        new UpdateAutoScalingGroupCommand({
          AutoScalingGroupName: body.groupName,
          MinSize: body.minSize,
          MaxSize: body.maxSize,
          DesiredCapacity: body.desiredCapacity,
        })
      );
      return NextResponse.json({ success: true });
    }

    if (body.action === "createLaunchConfiguration") {
      await autoscaling.send(
        new CreateLaunchConfigurationCommand({
          LaunchConfigurationName: body.launchConfigurationName || "my-launch-config",
          ImageId: body.imageId || "ami-123456",
          InstanceType: body.instanceType || "t3.micro",
        })
      );
      return NextResponse.json({ success: true });
    }

    if (body.action === "createScalingPolicy") {
      await autoscaling.send(
        new PutScalingPolicyCommand({
          AutoScalingGroupName: body.groupName,
          PolicyName: body.policyName || "ScaleUp",
          PolicyType: body.policyType || "SimpleScaling",
          AdjustmentType: body.adjustmentType || "ChangeInCapacity",
          ScalingAdjustment: body.scalingAdjustment || 1,
        })
      );
      return NextResponse.json({ success: true });
    }

    if (body.action === "createScheduledAction") {
      await autoscaling.send(
        new PutScheduledUpdateGroupActionCommand({
          AutoScalingGroupName: body.groupName,
          ScheduledActionName: body.scheduledActionName || "scheduled-action",
          StartTime: body.startTime,
          Recurrence: body.recurrence || "0 0 * * ? *",
          MinSize: body.minSize,
          MaxSize: body.maxSize,
          DesiredCapacity: body.desiredCapacity,
        })
      );
      return NextResponse.json({ success: true });
    }

    await autoscaling.send(
      new CreateAutoScalingGroupCommand({
        AutoScalingGroupName: body.groupName,
        MinSize: body.minSize || 1,
        MaxSize: body.maxSize || 3,
        DesiredCapacity: body.desiredCapacity || 1,
        AvailabilityZones: body.availabilityZones || ["us-east-1a"],
        LaunchConfigurationName: body.launchConfigurationName,
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
    const groupName = searchParams.get("groupName");
    const policyName = searchParams.get("policyName");
    const actionName = searchParams.get("scheduledActionName");

    if (policyName && groupName) {
      await autoscaling.send(
        new DeletePolicyCommand({
          AutoScalingGroupName: groupName,
          PolicyName: policyName,
        })
      );
      return NextResponse.json({ success: true });
    }

    if (actionName && groupName) {
      await autoscaling.send(
        new DeleteScheduledActionCommand({
          AutoScalingGroupName: groupName,
          ScheduledActionName: actionName,
        })
      );
      return NextResponse.json({ success: true });
    }

    if (groupName) {
      await autoscaling.send(
        new DeleteAutoScalingGroupCommand({
          AutoScalingGroupName: groupName,
          ForceDelete: true,
        })
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "groupName required" }, { status: 400 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
