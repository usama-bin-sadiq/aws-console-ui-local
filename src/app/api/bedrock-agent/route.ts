import { NextResponse } from "next/server";
import { ListAgentsCommand, CreateAgentCommand, DeleteAgentCommand, BedrockAgentClient } from "@aws-sdk/client-bedrock-agent";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const bedrockAgentClient = getUserClientFromRequest(BedrockAgentClient, request);
    const res = await bedrockAgentClient.send(new ListAgentsCommand({}));
    return NextResponse.json({ agentSummaries: res.agentSummaries || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const bedrockAgentClient = getUserClientFromRequest(BedrockAgentClient, request);
    const body = await request.json();
    const res = await bedrockAgentClient.send(new CreateAgentCommand({
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
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const bedrockAgentClient = getUserClientFromRequest(BedrockAgentClient, request);
    const { searchParams } = new URL(request.url);
    await bedrockAgentClient.send(new DeleteAgentCommand({ agentId: searchParams.get("agentId")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
