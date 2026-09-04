import { NextResponse } from "next/server";
import {
  ListStateMachinesCommand,
  CreateStateMachineCommand,
  DeleteStateMachineCommand,
  StartExecutionCommand,
  StopExecutionCommand,
  DescribeExecutionCommand,
  ListExecutionsCommand,
} from "@aws-sdk/client-sfn";
import { sfn } from "@/lib/aws-clients";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const stateMachineArn = searchParams.get("stateMachineArn");

    if (action === "listExecutions" && stateMachineArn) {
      const res = await sfn.send(
        new ListExecutionsCommand({ stateMachineArn })
      );
      return NextResponse.json({ executions: res.executions || [] });
    }

    if (action === "describeExecution" && stateMachineArn) {
      const res = await sfn.send(
        new DescribeExecutionCommand({ executionArn: stateMachineArn })
      );
      return NextResponse.json({ execution: res });
    }

    const res = await sfn.send(new ListStateMachinesCommand({}));
    return NextResponse.json({ stateMachines: res.stateMachines || [] });
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
    const action = body.action || body;

    if (action === "startExecution" || body.action === "startExecution") {
      const res = await sfn.send(
        new StartExecutionCommand({
          stateMachineArn: body.stateMachineArn,
          input: body.input || "{}",
          name: body.executionName || undefined,
        })
      );
      return NextResponse.json({ executionArn: res.executionArn });
    }

    if (action === "stopExecution" || body.action === "stopExecution") {
      const res = await sfn.send(
        new StopExecutionCommand({
          executionArn: body.executionArn,
          error: body.error || "Stopped by user",
          cause: body.cause || "Stopped via AWS Console",
        })
      );
      return NextResponse.json({ executionArn: body.executionArn, stopDate: res.stopDate });
    }

    if (action === "describeExecution" || body.action === "describeExecution") {
      const res = await sfn.send(
        new DescribeExecutionCommand({ executionArn: body.executionArn })
      );
      return NextResponse.json({ execution: res });
    }

    if (action === "listExecutions" || body.action === "listExecutions") {
      const res = await sfn.send(
        new ListExecutionsCommand({ stateMachineArn: body.stateMachineArn })
      );
      return NextResponse.json({ executions: res.executions || [] });
    }

    const res = await sfn.send(
      new CreateStateMachineCommand({
        name: body.name,
        definition: body.definition || '{"Comment":"A simple state machine","StartAt":"HelloWorld","States":{"HelloWorld":{"Type":"Pass","End":true}}}',
        roleArn: body.roleArn || "arn:aws:iam::000000000000:role/sfn-role",
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
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    await sfn.send(
      new DeleteStateMachineCommand({
        stateMachineArn: searchParams.get("arn")!,
      })
    );
    return NextResponse.json({ success: true });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
