// Amazon Comprehend — custom classifier listing + NLP analysis workflows.
// Commands: @aws-sdk/client-comprehend (ListDocumentClassifiers,
// DescribeDocumentClassificationJob, StartDocumentClassificationJob,
// ClassifyDocument, DetectSentiment, DetectEntities, DetectKeyPhrases,
// DetectDominantLanguage, DetectPiiEntities, DetectTargetedSentiment)
import { NextResponse } from "next/server";
import {
  ComprehendClient,
  ListDocumentClassifiersCommand,
  DescribeDocumentClassificationJobCommand,
  StartDocumentClassificationJobCommand,
  ClassifyDocumentCommand,
  DetectSentimentCommand,
  DetectEntitiesCommand,
  DetectKeyPhrasesCommand,
  DetectDominantLanguageCommand,
  DetectPiiEntitiesCommand,
  DetectTargetedSentimentCommand,
} from "@aws-sdk/client-comprehend";
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
    const client = getUserClientFromRequest(ComprehendClient, request);
    const res = await client.send(new ListDocumentClassifiersCommand({}));
    const classifiers = res.DocumentClassifierPropertiesList || [];
    return NextResponse.json({
      items: classifiers,
      classifiers,
      count: classifiers.length,
    });
  } catch (error: unknown) {
    return unavailable(error);
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const client = getUserClientFromRequest(ComprehendClient, request);
    const body = await request.json();
    const languageCode = body.languageCode || "en";
    const text = body.text || "";

    switch (body.action) {
      case "detectSentiment": {
        const res = await client.send(
          new DetectSentimentCommand({ Text: text, LanguageCode: languageCode }),
        );
        return NextResponse.json({
          sentiment: res.Sentiment,
          sentimentScore: res.SentimentScore,
        });
      }
      case "detectEntities": {
        const res = await client.send(
          new DetectEntitiesCommand({ Text: text, LanguageCode: languageCode }),
        );
        return NextResponse.json({ items: res.Entities || [], entities: res.Entities || [] });
      }
      case "detectKeyPhrases": {
        const res = await client.send(
          new DetectKeyPhrasesCommand({ Text: text, LanguageCode: languageCode }),
        );
        return NextResponse.json({ items: res.KeyPhrases || [], keyPhrases: res.KeyPhrases || [] });
      }
      case "detectLanguage": {
        const res = await client.send(new DetectDominantLanguageCommand({ Text: text }));
        return NextResponse.json({ items: res.Languages || [], languages: res.Languages || [] });
      }
      case "detectPiiEntities": {
        const res = await client.send(
          new DetectPiiEntitiesCommand({ Text: text, LanguageCode: languageCode }),
        );
        return NextResponse.json({ items: res.Entities || [], entities: res.Entities || [] });
      }
      case "detectTargetedSentiment": {
        const res = await client.send(
          new DetectTargetedSentimentCommand({ Text: text, LanguageCode: languageCode }),
        );
        return NextResponse.json({ items: res.Entities || [], entities: res.Entities || [] });
      }
      case "classifyDocument": {
        if (!body.endpointArn) {
          return NextResponse.json(
            { error: "classifyDocument requires endpointArn (deployed classifier endpoint)" },
            { status: 400 },
          );
        }
        const res = await client.send(
          new ClassifyDocumentCommand({
            Text: text,
            EndpointArn: body.endpointArn,
            Bytes: body.bytes,
            DocumentReaderConfig: body.documentReaderConfig,
          }),
        );
        return NextResponse.json({
          items: res.Classes || [],
          classes: res.Classes || [],
          labels: res.Labels || [],
          documentMetadata: res.DocumentMetadata,
          errors: res.Errors || [],
          warnings: res.Warnings || [],
        });
      }
      case "describeClassifierJob": {
        const res = await client.send(
          new DescribeDocumentClassificationJobCommand({ JobId: body.jobId }),
        );
        return NextResponse.json({ job: res.DocumentClassificationJobProperties });
      }
      case "startClassifierJob": {
        const res = await client.send(
          new StartDocumentClassificationJobCommand({
            DataAccessRoleArn:
              body.dataAccessRoleArn || "arn:aws:iam::000000000000:role/comprehend-role",
            DocumentClassifierArn: body.documentClassifierArn,
            InputDataConfig: body.inputDataConfig,
            OutputDataConfig: body.outputDataConfig,
          }),
        );
        return NextResponse.json({ jobId: res.JobId, job: res.JobId });
      }
      default:
        return NextResponse.json(
          {
            error: `Unsupported action "${body.action}". Supported: detectSentiment, detectEntities, detectKeyPhrases, detectLanguage, detectPiiEntities, detectTargetedSentiment, classifyDocument, describeClassifierJob, startClassifierJob`,
          },
          { status: 400 },
        );
    }
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
