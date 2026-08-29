import { NextResponse } from "next/server";
import {
  ListStateMachinesCommand,
  CreateStateMachineCommand,
  DeleteStateMachineCommand,
  StartExecutionCommand,
  ListExecutionsCommand,
} from "@aws-sdk/client-sfn";
import { sfn } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await sfn.send(new ListStateMachinesCommand({}));
    return NextResponse.json({ stateMachines: res.stateMachines || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "startExecution") {
      const res = await sfn.send(new StartExecutionCommand({
        stateMachineArn: body.stateMachineArn,
        input: body.input || "{}",
      }));
      return NextResponse.json({ executionArn: res.executionArn });
    }
    if (body.action === "listExecutions") {
      const res = await sfn.send(new ListExecutionsCommand({ stateMachineArn: body.stateMachineArn }));
      return NextResponse.json({ executions: res.executions || [] });
    }
    const res = await sfn.send(new CreateStateMachineCommand({
      name: body.name,
      definition: body.definition || '{"Comment":"","StartAt":"State1","States":{"State1":{"Type":"Pass","End":true}}}',
      roleArn: body.roleArn || "arn:aws:iam::000000000000:role/sfn-role",
    }));
    return NextResponse.json({ stateMachineArn: res.stateMachineArn });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    await sfn.send(new DeleteStateMachineCommand({ stateMachineArn: searchParams.get("arn")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
