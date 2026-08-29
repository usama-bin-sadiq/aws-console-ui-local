import { NextResponse } from "next/server";
import { ListStacksCommand, CreateStackCommand, DeleteStackCommand, DescribeStacksCommand } from "@aws-sdk/client-cloudformation";
import { cloudformation } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await cloudformation.send(new ListStacksCommand({
      StackStatusFilter: [
        "CREATE_COMPLETE", "UPDATE_COMPLETE", "UPDATE_ROLLBACK_COMPLETE",
        "CREATE_IN_PROGRESS", "UPDATE_IN_PROGRESS",
      ],
    }));
    return NextResponse.json({ stacks: res.StackSummaries || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await cloudformation.send(new CreateStackCommand(body));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stackName = searchParams.get("stackName");
    await cloudformation.send(new DeleteStackCommand({ StackName: stackName! }));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
