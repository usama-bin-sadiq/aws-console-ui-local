import { NextResponse } from "next/server";
import {
  ListThingsCommand,
  CreateThingCommand,
  DeleteThingCommand,
  ListTopicRulesCommand,
  CreateTopicRuleCommand,
  DeleteTopicRuleCommand,
  ListCertificatesCommand,
  ListPoliciesCommand,
  CreatePolicyCommand,
  DeletePolicyCommand,
} from "@aws-sdk/client-iot";
import { PublishCommand, IoTDataPlaneClient } from "@aws-sdk/client-iot-data-plane";
import { IoTClient } from "@aws-sdk/client-iot";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const iotDataClient = getUserClientFromRequest(IoTDataPlaneClient, request);
    const iotClient = getUserClientFromRequest(IoTClient, request);
    const [thingsRes, rulesRes, certsRes, policiesRes] = await Promise.all([
      iotClient.send(new ListThingsCommand({})),
      iotClient.send(new ListTopicRulesCommand({})),
      iotClient.send(new ListCertificatesCommand({})),
      iotClient.send(new ListPoliciesCommand({})),
    ]);
    return NextResponse.json({
      things: thingsRes.things || [],
      rules: rulesRes.rules || [],
      certificates: certsRes.certificates || [],
      policies: policiesRes.policies || [],
    });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const iotDataClient = getUserClientFromRequest(IoTDataPlaneClient, request);
    const iotClient = getUserClientFromRequest(IoTClient, request);
    const body = await request.json();
    if (body.action === "createTopicRule") {
      await iotClient.send(
        new CreateTopicRuleCommand({
          ruleName: body.ruleName,
          topicRulePayload: body.topicRulePayload,
        }),
      );
      return NextResponse.json({ success: true });
    }
    if (body.action === "createPolicy") {
      await iotClient.send(
        new CreatePolicyCommand({
          policyName: body.policyName,
          policyDocument: body.policyDocument || "{}",
        }),
      );
      return NextResponse.json({ success: true });
    }
    if (body.action === "publish") {
      await iotDataClient.send(
        new PublishCommand({
          topic: body.topic,
          payload: Buffer.from(body.payload || ""),
        }),
      );
      return NextResponse.json({ success: true });
    }
    const res = await iotClient.send(new CreateThingCommand({ thingName: body.thingName }));
    return NextResponse.json({ thing: res });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const iotDataClient = getUserClientFromRequest(IoTDataPlaneClient, request);
    const iotClient = getUserClientFromRequest(IoTClient, request);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const name = searchParams.get("name")!;
    if (type === "policy") {
      await iotClient.send(new DeletePolicyCommand({ policyName: name }));
      return NextResponse.json({ success: true });
    }
    if (type === "rule") {
      await iotClient.send(new DeleteTopicRuleCommand({ ruleName: name }));
      return NextResponse.json({ success: true });
    }
    await iotClient.send(new DeleteThingCommand({ thingName: name }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
