// Amazon Connect — instance, queue, contact flow, routing profile and user workflows.
// Commands: @aws-sdk/client-connect (ListInstances, DescribeInstance, ListQueues,
// ListContactFlows, ListRoutingProfiles, ListUsers, ListHoursOfOperations,
// ListPrompts, ListLexicons)
import { NextResponse } from "next/server";
import {
  ConnectClient,
  ListInstancesCommand,
  DescribeInstanceCommand,
  ListQueuesCommand,
  ListContactFlowsCommand,
  ListRoutingProfilesCommand,
  ListUsersCommand,
  ListHoursOfOperationsCommand,
  ListPromptsCommand,
} from "@aws-sdk/client-connect";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";

function unavailable(error: unknown) {
  const adapter = getAdapterStatus();
  return handleAdapterError(error, adapter.mode, adapter.endpoint);
}

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const client = getUserClientFromRequest(ConnectClient, request);
    const res = await client.send(new ListInstancesCommand({}));
    const instances = res.InstanceSummaryList || [];
    return NextResponse.json({ items: instances, instances, count: instances.length });
  } catch (error: unknown) {
    return unavailable(error);
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const client = getUserClientFromRequest(ConnectClient, request);
    const body = await request.json();
    const InstanceId = body.instanceId;

    if (body.action !== "describeInstance" && !InstanceId) {
      return NextResponse.json(
        { error: "instanceId is required for this action" },
        { status: 400 },
      );
    }

    switch (body.action) {
      case "describeInstance": {
        const res = await client.send(
          new DescribeInstanceCommand({ InstanceId: body.instanceIdRequired || InstanceId }),
        );
        return NextResponse.json({ instance: res.Instance });
      }
      case "listQueues": {
        const res = await client.send(
          new ListQueuesCommand({ InstanceId, MaxResults: body.maxResults }),
        );
        return NextResponse.json({
          items: res.QueueSummaryList || [],
          queues: res.QueueSummaryList || [],
        });
      }
      case "listContactFlows": {
        const res = await client.send(
          new ListContactFlowsCommand({ InstanceId, ContactFlowTypes: body.contactFlowTypes }),
        );
        return NextResponse.json({
          items: res.ContactFlowSummaryList || [],
          contactFlows: res.ContactFlowSummaryList || [],
        });
      }
      case "listRoutingProfiles": {
        const res = await client.send(
          new ListRoutingProfilesCommand({ InstanceId, MaxResults: body.maxResults }),
        );
        return NextResponse.json({
          items: res.RoutingProfileSummaryList || [],
          routingProfiles: res.RoutingProfileSummaryList || [],
        });
      }
      case "listUsers": {
        const res = await client.send(
          new ListUsersCommand({ InstanceId, MaxResults: body.maxResults }),
        );
        return NextResponse.json({
          items: res.UserSummaryList || [],
          users: res.UserSummaryList || [],
        });
      }
      case "listHoursOfOperations": {
        const res = await client.send(
          new ListHoursOfOperationsCommand({ InstanceId, MaxResults: body.maxResults }),
        );
        return NextResponse.json({
          items: res.HoursOfOperationSummaryList || [],
          hoursOfOperations: res.HoursOfOperationSummaryList || [],
        });
      }
      case "listPrompts": {
        const res = await client.send(
          new ListPromptsCommand({ InstanceId, MaxResults: body.maxResults }),
        );
        return NextResponse.json({
          items: res.PromptSummaryList || [],
          prompts: res.PromptSummaryList || [],
        });
      }
      default:
        return NextResponse.json(
          {
            error: `Unsupported action "${body.action}". Supported: describeInstance, listQueues, listContactFlows, listRoutingProfiles, listUsers, listHoursOfOperations, listPrompts`,
          },
          { status: 400 },
        );
    }
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
