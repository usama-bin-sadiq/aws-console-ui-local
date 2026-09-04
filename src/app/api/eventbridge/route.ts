import { NextResponse } from "next/server";
import {
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";
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
import { eventbridge } from "@/lib/aws-clients";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const eventBusName = searchParams.get("eventBusName") || "default";

    if (action === "listRules") {
      const rulesRes = await eventbridge.send(
        new ListRulesCommand({ EventBusName: eventBusName })
      );
      return NextResponse.json({ rules: rulesRes.Rules || [] });
    }

    if (action === "listTargets" && searchParams.get("ruleName")) {
      const res = await eventbridge.send(
        new ListTargetsByRuleCommand({
          Rule: searchParams.get("ruleName")!,
          EventBusName: eventBusName,
        })
      );
      return NextResponse.json({ targets: res.Targets || [] });
    }

    const [busRes, rulesRes] = await Promise.all([
      eventbridge.send(new ListEventBusesCommand({})),
      eventbridge.send(
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
  try {
    const body = await request.json();
    const action = (body && typeof body === "object" && body.action) ? body.action : ((typeof body === "string") ? body : (body && body.name ? "createEventBus" : undefined));

    if (action === "createEventBus" || body.action === "createEventBus") {
      const res = await eventbridge.send(
        new CreateEventBusCommand({ Name: body.name })
      );
      return NextResponse.json({ eventBusArn: res.EventBusArn });
    }

    if (action === "createRule" || body.action === "createRule") {
      const res = await eventbridge.send(
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
      const res = await eventbridge.send(
        new PutTargetsCommand({
          Rule: body.ruleName,
          EventBusName: body.eventBusName || "default",
          Targets: body.targets || [],
        })
      );
      return NextResponse.json({ failedEntryCount: res.FailedEntryCount || 0 });
    }

    if (action === "deleteRule" || body.action === "deleteRule") {
      await eventbridge.send(
        new DeleteRuleCommand({
          Name: body.ruleName,
          EventBusName: body.eventBusName || "default",
        })
      );
      return NextResponse.json({ success: true });
    }

    if (action === "enableRule" || body.action === "enableRule") {
      await eventbridge.send(
        new EnableRuleCommand({
          Name: body.ruleName,
          EventBusName: body.eventBusName || "default",
        })
      );
      return NextResponse.json({ success: true });
    }

    if (action === "disableRule" || body.action === "disableRule") {
      await eventbridge.send(
        new DisableRuleCommand({
          Name: body.ruleName,
          EventBusName: body.eventBusName || "default",
        })
      );
      return NextResponse.json({ success: true });
    }

    if (action === "listTargets" || body.action === "listTargets") {
      const res = await eventbridge.send(
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
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const busName = searchParams.get("busName");
    const ruleName = searchParams.get("ruleName");
    const eventBusName = searchParams.get("eventBusName") || "default";

    if (action === "deleteRule") {
      await eventbridge.send(
        new DeleteRuleCommand({
          Name: searchParams.get("ruleName")!,
          EventBusName: eventBusName,
        })
      );
      return NextResponse.json({ success: true });
    }

    await eventbridge.send(
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
