import { NextResponse } from "next/server";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";
import {
  EventBridgeClient,
  ListEventBusesCommand,
  CreateEventBusCommand,
  DeleteEventBusCommand,
  ListRulesCommand,
  PutRuleCommand,
  PutTargetsCommand,
  DeleteRuleCommand,
  EnableRuleCommand,
  DisableRuleCommand,
  ListTargetsByRuleCommand,
} from "@aws-sdk/client-eventbridge";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const eventbridgeClient = getUserClientFromRequest(EventBridgeClient, request);
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const eventBusName = searchParams.get("eventBusName") || "default";

    if (action === "listRules") {
      const rulesRes = await eventbridgeClient.send(
        new ListRulesCommand({ EventBusName: eventBusName })
      );
      return NextResponse.json({ rules: rulesRes.Rules || [] });
    }

    if (action === "listTargets" && searchParams.get("ruleName")) {
      const res = await eventbridgeClient.send(
        new ListTargetsByRuleCommand({
          Rule: searchParams.get("ruleName")!,
          EventBusName: eventBusName,
        })
      );
      return NextResponse.json({ targets: res.Targets || [] });
    }

    const [busRes, rulesRes] = await Promise.all([
      eventbridgeClient.send(new ListEventBusesCommand({})),
      eventbridgeClient.send(
        new ListRulesCommand({ EventBusName: eventBusName })
      ).catch(() => ({ Rules: [] })),
    ]);
    return NextResponse.json({
      eventBuses: busRes.EventBuses || [],
      rules: rulesRes.Rules || [],
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const eventbridgeClient = getUserClientFromRequest(EventBridgeClient, request);
    const body = await request.json();
    const action = (body && typeof body === "object" && body.action) ? body.action : ((typeof body === "string") ? body : (body && body.name ? "createEventBus" : undefined));

    if (action === "createEventBus" || body.action === "createEventBus") {
      const res = await eventbridgeClient.send(
        new CreateEventBusCommand({ Name: body.name })
      );
      return NextResponse.json({ eventBusArn: res.EventBusArn });
    }

    if (action === "createRule" || body.action === "createRule") {
      const res = await eventbridgeClient.send(
        new PutRuleCommand({
          Name: body.name,
          EventBusName: body.eventBusName || "default",
          EventPattern: body.eventPattern ? JSON.stringify(body.eventPattern) : undefined,
          ScheduleExpression: body.scheduleExpression,
          State: body.state || "ENABLED",
        })
      );
      return NextResponse.json({ ruleArn: res.RuleArn });
    }

    if (action === "putTargets" || body.action === "putTargets") {
      const res = await eventbridgeClient.send(
        new PutTargetsCommand({
          Rule: body.ruleName,
          EventBusName: body.eventBusName || "default",
          Targets: body.targets || [],
        })
      );
      return NextResponse.json({ failedEntryCount: res.FailedEntryCount || 0 });
    }

    if (action === "deleteRule" || body.action === "deleteRule") {
      await eventbridgeClient.send(
        new DeleteRuleCommand({
          Name: body.ruleName,
          EventBusName: body.eventBusName || "default",
        })
      );
      return NextResponse.json({ success: true });
    }

    if (action === "enableRule" || body.action === "enableRule") {
      await eventbridgeClient.send(
        new EnableRuleCommand({
          Name: body.ruleName,
          EventBusName: body.eventBusName || "default",
        })
      );
      return NextResponse.json({ success: true });
    }

    if (action === "disableRule" || body.action === "disableRule") {
      await eventbridgeClient.send(
        new DisableRuleCommand({
          Name: body.ruleName,
          EventBusName: body.eventBusName || "default",
        })
      );
      return NextResponse.json({ success: true });
    }

    if (action === "listTargets" || body.action === "listTargets") {
      const res = await eventbridgeClient.send(
        new ListTargetsByRuleCommand({
          Rule: body.ruleName,
          EventBusName: body.eventBusName || "default",
        })
      );
      return NextResponse.json({ targets: res.Targets || [] });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const eventbridgeClient = getUserClientFromRequest(EventBridgeClient, request);
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const busName = searchParams.get("busName");
    const ruleName = searchParams.get("ruleName");
    const eventBusName = searchParams.get("eventBusName") || "default";

    if (action === "deleteRule") {
      await eventbridgeClient.send(
        new DeleteRuleCommand({
          Name: searchParams.get("ruleName")!,
          EventBusName: eventBusName,
        })
      );
      return NextResponse.json({ success: true });
    }

    await eventbridgeClient.send(
      new DeleteEventBusCommand({ Name: busName! })
    );
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
