import { NextResponse } from "next/server";
import { ListAgentsCommand, CreateAgentCommand, DeleteAgentCommand } from "@aws-sdk/client-bedrock-agent";
import { bedrockAgent } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await bedrockAgent.send(new ListAgentsCommand({}));
    return NextResponse.json({ agentSummaries: res.agentSummaries || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await bedrockAgent.send(new CreateAgentCommand({
      agentName: body.agentName,
      foundationModel: body.foundationModel,
      agentResourceRoleArn: body.agentResourceRoleArn || "arn:aws:iam::000000000000:role/bedrock-agent-role",
    }));
    return NextResponse.json({ agent: res.agent });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    await bedrockAgent.send(new DeleteAgentCommand({ agentId: searchParams.get("agentId")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
