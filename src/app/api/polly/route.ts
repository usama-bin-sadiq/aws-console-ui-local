// Amazon Polly — voice listing, synthesis and lexicon management workflows.
// Commands: @aws-sdk/client-polly (DescribeVoices, SynthesizeSpeech,
// ListSpeechSynthesisTasks, GetSpeechSynthesisTask, ListLexicons, GetLexicon,
// PutLexicon, DeleteLexicon)
import { NextResponse } from "next/server";
import {
  PollyClient,
  DescribeVoicesCommand,
  SynthesizeSpeechCommand,
  ListSpeechSynthesisTasksCommand,
  GetSpeechSynthesisTaskCommand,
  ListLexiconsCommand,
  GetLexiconCommand,
  PutLexiconCommand,
  DeleteLexiconCommand,
} from "@aws-sdk/client-polly";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";

const SUPPORTED_ACTIONS = [
  "describeVoices",
  "synthesize",
  "listSynthesisTasks",
  "getSynthesisTask",
  "listLexicons",
  "getLexicon",
  "putLexicon",
  "deleteLexicon",
].join(", ");

function unavailable(error: unknown) {
  const adapter = getAdapterStatus();
  return handleAdapterError(error, adapter.mode, adapter.endpoint);
}

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const pollyClient = getUserClientFromRequest(PollyClient, request);
    const res = await pollyClient.send(new DescribeVoicesCommand({}));
    const voices = res.Voices || [];
    return NextResponse.json({ items: voices, voices, count: voices.length });
  } catch (error: unknown) {
    return unavailable(error);
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const pollyClient = getUserClientFromRequest(PollyClient, request);
    const body = await request.json();

    switch (body.action) {
      case "describeVoices": {
        const res = await pollyClient.send(
          new DescribeVoicesCommand({ LanguageCode: body.languageCode, Engine: body.engine }),
        );
        const voices = res.Voices || [];
        const filtered = body.voiceId ? voices.filter((v) => v.Id === body.voiceId) : voices;
        return NextResponse.json({ items: filtered, voices: filtered, count: filtered.length });
      }
      case "synthesize": {
        const res = await pollyClient.send(
          new SynthesizeSpeechCommand({
            Text: body.text,
            OutputFormat: body.outputFormat || "mp3",
            VoiceId: body.voiceId || "Joanna",
            Engine: body.engine,
            LanguageCode: body.languageCode,
            SampleRate: body.sampleRate,
          }),
        );
        const bytes = res.AudioStream
          ? await res.AudioStream.transformToByteArray()
          : new Uint8Array(0);
        return NextResponse.json({
          audio: Buffer.from(bytes).toString("base64"),
          contentType: res.ContentType || "audio/mpeg",
          requestCharacters: res.RequestCharacters,
        });
      }
      case "listSynthesisTasks": {
        const res = await pollyClient.send(
          new ListSpeechSynthesisTasksCommand({
            MaxResults: body.maxResults,
            NextToken: body.nextToken,
          }),
        );
        const tasks = res.SynthesisTasks || [];
        return NextResponse.json({ items: tasks, tasks, nextToken: res.NextToken });
      }
      case "getSynthesisTask": {
        const res = await pollyClient.send(
          new GetSpeechSynthesisTaskCommand({ TaskId: body.taskId }),
        );
        return NextResponse.json({ task: res.SynthesisTask });
      }
      case "listLexicons": {
        const res = await pollyClient.send(new ListLexiconsCommand({ NextToken: body.nextToken }));
        const lexicons = res.Lexicons || [];
        return NextResponse.json({
          items: lexicons,
          lexicons,
          names: lexicons.map((l) => l.Name).filter((n): n is string => Boolean(n)),
          nextToken: res.NextToken,
        });
      }
      case "getLexicon": {
        const res = await pollyClient.send(new GetLexiconCommand({ Name: body.name }));
        return NextResponse.json({ lexicon: res.Lexicon, attributes: res.LexiconAttributes });
      }
      case "putLexicon": {
        if (!body.name || !body.content) {
          return NextResponse.json(
            { error: "putLexicon requires name and content (lexicon XML)" },
            { status: 400 },
          );
        }
        await pollyClient.send(new PutLexiconCommand({ Name: body.name, Content: body.content }));
        return NextResponse.json({ success: true, name: body.name });
      }
      case "deleteLexicon": {
        await pollyClient.send(new DeleteLexiconCommand({ Name: body.name }));
        return NextResponse.json({ success: true, name: body.name });
      }
      default:
        return NextResponse.json(
          { error: `Unsupported action "${body.action}". Supported: ${SUPPORTED_ACTIONS}` },
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
    const pollyClient = getUserClientFromRequest(PollyClient, request);
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");
    if (!name) {
      return NextResponse.json({ error: "Missing ?name= lexicon name" }, { status: 400 });
    }
    await pollyClient.send(new DeleteLexiconCommand({ Name: name }));
    return NextResponse.json({ success: true, name });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
