import { NextResponse } from "next/server";
import {
  DescribeConfigurationRecordersCommand,
  DescribeConfigRulesCommand,
  PutConfigRuleCommand,
  DeleteConfigRuleCommand,
} from "@aws-sdk/client-config-service";
import { configService } from "@/lib/aws-clients";

export async function GET() {
  try {
    const [recorderRes, rulesRes] = await Promise.all([
      configService.send(new DescribeConfigurationRecordersCommand({})),
      configService.send(new DescribeConfigRulesCommand({})),
    ]);
    return NextResponse.json({
      recorders: recorderRes.ConfigurationRecorders || [],
      rules: rulesRes.ConfigRules || [],
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
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
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    await configService.send(new DeleteConfigRuleCommand({ ConfigRuleName: searchParams.get("ruleName")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
