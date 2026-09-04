import { NextResponse } from "next/server";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";
import {
  DescribeConfigurationRecordersCommand,
  DescribeConfigurationRecorderStatusCommand,
  PutConfigurationRecorderCommand,
  DeleteConfigurationRecorderCommand,
  StartConfigurationRecorderCommand,
  StopConfigurationRecorderCommand,
  DescribeConfigRulesCommand,
  PutConfigRuleCommand,
  DeleteConfigRuleCommand,
} from "@aws-sdk/client-config-service";
import { configService } from "@/lib/aws-clients";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "describeRecorderStatus") {
      const name = searchParams.get("recorderName") || "default";
      const res = await configService.send(new DescribeConfigurationRecorderStatusCommand({ ConfigurationRecorderNames: [name] }));
      return NextResponse.json({ status: res.ConfigurationRecordersStatus || [] });
    }

    const [recorderRes, rulesRes] = await Promise.all([
      configService.send(new DescribeConfigurationRecordersCommand({})),
      configService.send(new DescribeConfigRulesCommand({})),
    ]);
    return NextResponse.json({
      recorders: recorderRes.ConfigurationRecorders || [],
      rules: rulesRes.ConfigRules || [],
    });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.action === "createRecorder") {
      await configService.send(
        new PutConfigurationRecorderCommand({
          ConfigurationRecorder: {
            name: body.recorderName || "default",
            roleARN: body.roleARN || "arn:aws:iam::123456789012:role/aws-service-role/config.amazonaws.com/AWSServiceRoleForConfig",
            recordingGroup: { allSupported: true, includeGlobalResourceTypes: true },
          },
        })
      );
      return NextResponse.json({ success: true, recorderName: body.recorderName || "default" });
    }

    if (body.action === "startRecorder") {
      const res = await configService.send(new StartConfigurationRecorderCommand({ ConfigurationRecorderName: body.recorderName || "default" }));
      return NextResponse.json({ success: true, recorderName: body.recorderName || "default" });
    }

    if (body.action === "stopRecorder") {
      const res = await configService.send(new StopConfigurationRecorderCommand({ ConfigurationRecorderName: body.recorderName || "default" }));
      return NextResponse.json({ success: true, recorderName: body.recorderName || "default" });
    }

    await configService.send(
      new PutConfigRuleCommand({
        ConfigRule: {
          ConfigRuleName: body.ruleName,
          Source: { Owner: "AWS", SourceIdentifier: body.sourceIdentifier || "REQUIRED_TAGS" },
        },
      })
    );
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "deleteRecorder") {
      const name = searchParams.get("recorderName") || "default";
      await configService.send(new DeleteConfigurationRecorderCommand({ ConfigurationRecorderName: name }));
      return NextResponse.json({ success: true, recorderName: name });
    }

    await configService.send(new DeleteConfigRuleCommand({ ConfigRuleName: searchParams.get("ruleName")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
