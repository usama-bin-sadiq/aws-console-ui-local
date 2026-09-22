import { NextResponse } from "next/server";
import {
  ListStateMachinesCommand,
  CreateStateMachineCommand,
  DeleteStateMachineCommand,
  StartExecutionCommand,
  StopExecutionCommand,
  DescribeExecutionCommand,
  ListExecutionsCommand,
  GetExecutionHistoryCommand,
} from "@aws-sdk/client-sfn";
import { SFNClient } from "@aws-sdk/client-sfn";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const sfnClient = getUserClientFromRequest(SFNClient, request);
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const stateMachineArn = searchParams.get("stateMachineArn");

    if (action === "listExecutions" && stateMachineArn) {
      const res = await sfnClient.send(
        new ListExecutionsCommand({ stateMachineArn })
      );
      return NextResponse.json({ executions: res.executions || [] });
    }

    if (action === "describeExecution" && stateMachineArn) {
      const res = await sfnClient.send(
        new DescribeExecutionCommand({ executionArn: stateMachineArn })
      );
      return NextResponse.json({ execution: res });
    }

    if (action === "getExecutionHistory" && stateMachineArn) {
      const res = await sfnClient.send(
        new GetExecutionHistoryCommand({ executionArn: stateMachineArn, reverseOrder: true })
      );
      return NextResponse.json({ events: res.events || [] });
    }

    const res = await sfnClient.send(new ListStateMachinesCommand({}));
    return NextResponse.json({ stateMachines: res.stateMachines || [] });
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
    const sfnClient = getUserClientFromRequest(SFNClient, request);
    const body = await request.json();
    const action = body.action || body;

    if (action === "startExecution" || body.action === "startExecution") {
      const res = await sfnClient.send(
        new StartExecutionCommand({
          stateMachineArn: body.stateMachineArn,
          input: body.input || "{}",
          name: body.executionName || undefined,
        })
      );
      return NextResponse.json({ executionArn: res.executionArn });
    }

    if (action === "stopExecution" || body.action === "stopExecution") {
      const res = await sfnClient.send(
        new StopExecutionCommand({
          executionArn: body.executionArn,
          error: body.error || "Stopped by user",
          cause: body.cause || "Stopped via AWS Console",
        })
      );
      return NextResponse.json({ executionArn: body.executionArn, stopDate: res.stopDate });
    }

    if (action === "describeExecution" || body.action === "describeExecution") {
      const res = await sfnClient.send(
        new DescribeExecutionCommand({ executionArn: body.executionArn })
      );
      return NextResponse.json({ execution: res });
    }

    if (action === "listExecutions" || body.action === "listExecutions") {
      const res = await sfnClient.send(
        new ListExecutionsCommand({ stateMachineArn: body.stateMachineArn })
      );
      return NextResponse.json({ executions: res.executions || [] });
    }

    const res = await sfnClient.send(
      new CreateStateMachineCommand({
        name: body.name,
        definition: body.definition || '{"Comment":"A simple state machine","StartAt":"HelloWorld","States":{"HelloWorld":{"Type":"Pass","End":true}}}',
        roleArn: body.roleArn,
        type: body.type || "STANDARD",
      })
    );
    return NextResponse.json({ stateMachineArn: res.stateMachineArn });
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
    const sfnClient = getUserClientFromRequest(SFNClient, request);
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    await sfnClient.send(
      new DeleteStateMachineCommand({
        stateMachineArn: searchParams.get("arn")!,
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
