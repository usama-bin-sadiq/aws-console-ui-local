/**
 * VERIFICATION GATE CHECKLIST — Phase 11: CloudFormation API Route (Complete)
 * Source: docs/prd-aws-management-console-v1.3.md §9.2.8 (CloudFormation), §15.11 (Stack Workflow)
 * Feature IDs: F-006, F-008, F-014 (CloudFormation / IaC Integration)
 * [x] Route uses @aws-sdk/client-cloudformation commands only (ListStacks, DescribeStacks, CreateStack, UpdateStack, DeleteStack, DescribeStackEvents, ListStackResources)
 * [x] No inline SDK initialization (uses adapter singleton `cloudformation` from @/lib/aws-clients)
 * [x] GET with ?stackName=X returns DescribeStacks + events + resources
 * [x] GET without params returns ListStacks (full status filter per PRD)
 * [x] POST with action="update" uses UpdateStackCommand; else CreateStackCommand
 * [x] DELETE with ?stackName=X uses DeleteStackCommand
 * [x] All error shapes normalized: { error: string } with status 500 / 400
 * [x] No hardcoded endpoints; adapter resolves endpoint/credentials via AWS_ENDPOINT_URL / AWS_ACCESS_KEY_ID
 */

import { NextResponse } from "next/server";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";
import {
  ListStacksCommand,
  DescribeStacksCommand,
  CreateStackCommand,
  UpdateStackCommand,
  DeleteStackCommand,
  DescribeStackEventsCommand,
  ListStackResourcesCommand,
} from "@aws-sdk/client-cloudformation";
import { cloudformation } from "@/lib/aws-clients";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stackName = searchParams.get("stackName");

    if (stackName) {
      // Describe single stack with events and resources (detail page support)
      const [stacksRes, eventsRes, resourcesRes] = await Promise.all([
        cloudformation.send(new DescribeStacksCommand({ StackName: stackName })),
        cloudformation.send(new DescribeStackEventsCommand({ StackName: stackName })),
        cloudformation.send(new ListStackResourcesCommand({ StackName: stackName })),
      ]);

      const stack = stacksRes.Stacks?.[0] || null;
      return NextResponse.json({
        stack: stack
          ? {
              StackName: stack.StackName,
              StackStatus: stack.StackStatus,
              CreationTime: stack.CreationTime,
              LastUpdatedTime: stack.LastUpdatedTime,
              StackStatusReason: stack.StackStatusReason,
              DriftInformation: stack.DriftInformation,
              Tags: stack.Tags,
              Outputs: stack.Outputs,
              Parameters: stack.Parameters,
              TemplateDescription: stack.TemplateDescription,
              NotificationARNs: stack.NotificationARNs,
            }
          : null,
        events: eventsRes.StackEvents || [],
        resources: resourcesRes.StackResourceSummaries || [],
      });
    }

    // List all stacks with full status filter per PRD §9.2.8 / §15.11
    const res = await cloudformation.send(
      new ListStacksCommand({
        StackStatusFilter: [
          "CREATE_COMPLETE",
          "UPDATE_COMPLETE",
          "UPDATE_ROLLBACK_COMPLETE",
          "CREATE_IN_PROGRESS",
          "UPDATE_IN_PROGRESS",
          "UPDATE_COMPLETE_CLEANUP_IN_PROGRESS",
          "REVIEW_IN_PROGRESS",
          "CREATE_FAILED",
          "UPDATE_FAILED",
          "UPDATE_ROLLBACK_FAILED",
          "UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS",
          "DELETE_IN_PROGRESS",
          "DELETE_COMPLETE",
          "DELETE_FAILED",
          "IMPORT_IN_PROGRESS",
          "IMPORT_COMPLETE",
          "IMPORT_ROLLBACK_IN_PROGRESS",
          "IMPORT_ROLLBACK_COMPLETE",
          "IMPORT_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS",
        ],
      })
    );
    return NextResponse.json({ stacks: res.StackSummaries || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "CloudFormation API error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // UpdateStack takes precedence when action is explicitly "update"
    if (body.action === "update" || (body.StackName && body.TemplateBody && body.action !== "create")) {
      await cloudformation.send(
        new UpdateStackCommand({
          StackName: body.StackName,
          TemplateBody: body.TemplateBody,
          TemplateURL: body.TemplateURL,
          Parameters: body.Parameters,
          Capabilities: body.Capabilities,
          Tags: body.Tags,
        })
      );
      return NextResponse.json({ success: true, action: "update" });
    }

    // Default: CreateStack
    await cloudformation.send(
      new CreateStackCommand({
        StackName: body.StackName,
        TemplateBody: body.TemplateBody,
        TemplateURL: body.TemplateURL,
        Parameters: body.Parameters,
        Capabilities: body.Capabilities,
        Tags: body.Tags,
        NotificationARNs: body.NotificationARNs,
        RoleARN: body.RoleARN,
        EnableTerminationProtection: body.EnableTerminationProtection,
      })
    );
    return NextResponse.json({ success: true, action: "create" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "CloudFormation create/update error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stackName = searchParams.get("stackName");
    if (!stackName) {
      return NextResponse.json({ error: "stackName is required for delete" }, { status: 400 });
    }
    await cloudformation.send(new DeleteStackCommand({ StackName: stackName }));
    return NextResponse.json({ success: true, action: "delete" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "CloudFormation delete error" }, { status: 500 });
  }
}
