// Amazon Lex V2 — bot, locale, slot type and bot version workflows.
// Commands: @aws-sdk/client-lex-models-v2 (ListBots, DescribeBot, CreateBot,
// DeleteBot, ListBotVersions, ListBotLocales, DescribeBotLocale, CreateBotLocale,
// UpdateBotLocale, BuildBotLocale, ListSlotTypes, CreateSlotType, ListIntents,
// ListExports, ListImports)
import { NextResponse } from "next/server";
import {
  LexModelsV2Client,
  ListBotsCommand,
  DescribeBotCommand,
  CreateBotCommand,
  DeleteBotCommand,
  ListBotVersionsCommand,
  ListBotLocalesCommand,
  DescribeBotLocaleCommand,
  CreateBotLocaleCommand,
  UpdateBotLocaleCommand,
  BuildBotLocaleCommand,
  ListSlotTypesCommand,
  CreateSlotTypeCommand,
  ListIntentsCommand,
} from "@aws-sdk/client-lex-models-v2";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";

function unavailable(error: unknown) {
  const adapter = getAdapterStatus();
  return handleAdapterError(error, adapter.mode, adapter.endpoint);
}

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const client = getUserClientFromRequest(LexModelsV2Client, request);
    const res = await client.send(new ListBotsCommand({ maxResults: 100 }));
    const bots = res.botSummaries || [];
    return NextResponse.json({ items: bots, bots, count: bots.length });
  } catch (error: unknown) {
    return unavailable(error);
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const client = getUserClientFromRequest(LexModelsV2Client, request);
    const body = await request.json();

    switch (body.action) {
      case "describeBot": {
        const res = await client.send(new DescribeBotCommand({ botId: body.botId }));
        const { $metadata, ...bot } = res;
        return NextResponse.json({ bot });
      }
      case "createBot": {
        const res = await client.send(
          new CreateBotCommand({
            botName: body.botName || body.name,
            roleArn: body.roleArn || "arn:aws:iam::000000000000:role/lex-bot-role",
            dataPrivacy: body.dataPrivacy || { childDirected: false },
            idleSessionTTLInSeconds: body.idleSessionTTLInSeconds || 300,
            description: body.description,
            botTags: body.botTags,
            testBotAliasTags: body.testBotAliasTags,
          }),
        );
        const { $metadata, ...bot } = res;
        return NextResponse.json({ bot });
      }
      case "listBotVersions": {
        const res = await client.send(
          new ListBotVersionsCommand({
            botId: body.botId,
            maxResults: body.maxResults,
            nextToken: body.nextToken,
          }),
        );
        const versions = res.botVersionSummaries || [];
        return NextResponse.json({ items: versions, versions, nextToken: res.nextToken });
      }
      case "listBotLocales": {
        if (!body.botId || !body.botVersion) {
          return NextResponse.json({ error: "botId and botVersion are required" }, { status: 400 });
        }
        const res = await client.send(
          new ListBotLocalesCommand({
            botId: body.botId,
            botVersion: body.botVersion,
            maxResults: body.maxResults,
            nextToken: body.nextToken,
          }),
        );
        const locales = res.botLocaleSummaries || [];
        return NextResponse.json({ items: locales, locales, nextToken: res.nextToken });
      }
      case "describeBotLocale": {
        const res = await client.send(
          new DescribeBotLocaleCommand({
            botId: body.botId,
            botVersion: body.botVersion,
            localeId: body.localeId || "en_US",
          }),
        );
        const { $metadata, ...botLocale } = res;
        return NextResponse.json({ botLocale });
      }
      case "createBotLocale": {
        const res = await client.send(
          new CreateBotLocaleCommand({
            botId: body.botId,
            botVersion: body.botVersion,
            localeId: body.localeId || "en_US",
            nluIntentConfidenceThreshold:
              body.nluIntentConfidenceThreshold ?? body.nluConfidenceThreshold ?? 0.4,
            description: body.description,
            voiceSettings: body.voiceSettings,
          }),
        );
        const { $metadata, ...botLocale } = res;
        return NextResponse.json({ botLocale });
      }
      case "updateBotLocale": {
        const res = await client.send(
          new UpdateBotLocaleCommand({
            botId: body.botId,
            botVersion: body.botVersion,
            localeId: body.localeId || "en_US",
            nluIntentConfidenceThreshold:
              body.nluIntentConfidenceThreshold ?? body.nluConfidenceThreshold ?? 0.4,
            description: body.description,
            voiceSettings: body.voiceSettings,
          }),
        );
        const { $metadata, ...botLocale } = res;
        return NextResponse.json({ botLocale });
      }
      case "buildBotLocale": {
        const res = await client.send(
          new BuildBotLocaleCommand({
            botId: body.botId,
            botVersion: body.botVersion,
            localeId: body.localeId || "en_US",
          }),
        );
        return NextResponse.json({ botLocaleStatus: res.botLocaleStatus });
      }
      case "listSlotTypes": {
        if (!body.botId || !body.botVersion) {
          return NextResponse.json({ error: "botId and botVersion are required" }, { status: 400 });
        }
        const res = await client.send(
          new ListSlotTypesCommand({
            botId: body.botId,
            botVersion: body.botVersion,
            localeId: body.localeId || "en_US",
            maxResults: body.maxResults,
            nextToken: body.nextToken,
          }),
        );
        const slotTypes = res.slotTypeSummaries || [];
        return NextResponse.json({ items: slotTypes, slotTypes, nextToken: res.nextToken });
      }
      case "createSlotType": {
        const res = await client.send(
          new CreateSlotTypeCommand({
            botId: body.botId,
            botVersion: body.botVersion,
            localeId: body.localeId || "en_US",
            slotTypeName: body.slotTypeName || body.name,
            slotTypeValues: body.slotTypeValues || body.values || [],
            valueSelectionSetting: body.valueSelectionSetting || {
              slotResolutionStrategy: "ORIGINAL_VALUE",
            },
            parentSlotTypeSignature: body.parentSlotTypeSignature,
            description: body.description,
            externalSourceSetting: body.externalSourceSetting,
          }),
        );
        const { $metadata, ...slotType } = res;
        return NextResponse.json({ slotType });
      }
      case "listIntents": {
        if (!body.botId || !body.botVersion) {
          return NextResponse.json({ error: "botId and botVersion are required" }, { status: 400 });
        }
        const res = await client.send(
          new ListIntentsCommand({
            botId: body.botId,
            botVersion: body.botVersion,
            localeId: body.localeId || "en_US",
            maxResults: body.maxResults,
            nextToken: body.nextToken,
          }),
        );
        const intents = res.intentSummaries || [];
        return NextResponse.json({ items: intents, intents, nextToken: res.nextToken });
      }
      default:
        return NextResponse.json(
          {
            error: `Unsupported action "${body.action}". Supported: describeBot, createBot, listBotVersions, listBotLocales, describeBotLocale, createBotLocale, updateBotLocale, buildBotLocale, listSlotTypes, createSlotType, listIntents`,
          },
          { status: 400 },
        );
    }
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const client = getUserClientFromRequest(LexModelsV2Client, request);
    const { searchParams } = new URL(request.url);
    const botId = searchParams.get("botId");
    if (!botId) {
      return NextResponse.json({ error: "Missing ?botId=" }, { status: 400 });
    }
    await client.send(
      new DeleteBotCommand({ botId, skipResourceInUseCheck: searchParams.get("force") === "true" }),
    );
    return NextResponse.json({ success: true, botId });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
