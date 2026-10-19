import { NextResponse } from "next/server";
import {
  ListIdentitiesCommand,
  VerifyEmailIdentityCommand,
  SendEmailCommand,
  DeleteIdentityCommand,
  GetAccountSendingEnabledCommand,
  GetSendQuotaCommand,
  GetSendStatisticsCommand,
  GetIdentityDkimAttributesCommand,
  GetIdentityVerificationAttributesCommand,
  SetIdentityDkimEnabledCommand,
  SetIdentityFeedbackForwardingEnabledCommand,
  CreateTemplateCommand,
  GetTemplateCommand,
  UpdateTemplateCommand,
  DeleteTemplateCommand,
} from "@aws-sdk/client-ses";
import { SESClient } from "@aws-sdk/client-ses";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const sesClient = getUserClientFromRequest(SESClient, request);
    const res = await sesClient.send(new ListIdentitiesCommand({ IdentityType: "EmailAddress" }));
    return NextResponse.json({ identities: res.Identities || [] });
  } catch (error) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const sesClient = getUserClientFromRequest(SESClient, request);
    const body = await request.json();
    if (body.action === "send") {
      await sesClient.send(
        new SendEmailCommand({
          Source: body.source,
          Destination: body.destination,
          Message: body.message,
        }),
      );
      return NextResponse.json({ success: true });
    }
    if (body.action === "getAccount") {
      const res = await sesClient.send(new GetAccountSendingEnabledCommand({}));
      return NextResponse.json({ account: res });
    }
    if (body.action === "getSendQuota") {
      const res = await sesClient.send(new GetSendQuotaCommand({}));
      return NextResponse.json({ sendQuota: res });
    }
    if (body.action === "getSendStatistics") {
      const res = await sesClient.send(new GetSendStatisticsCommand({}));
      return NextResponse.json({
        items: res.SendDataPoints || [],
        sendStatistics: res.SendDataPoints || [],
      });
    }
    if (body.action === "getIdentityDkimAttributes") {
      const identities: string[] = body.identities?.length
        ? body.identities
        : (await sesClient.send(new ListIdentitiesCommand({}))).Identities || [];
      const res = await sesClient.send(
        new GetIdentityDkimAttributesCommand({ Identities: identities }),
      );
      const dkimAttributes = res.DkimAttributes || {};
      return NextResponse.json({
        dkimAttributes,
        items: Object.entries(dkimAttributes).map(([identity, attrs]) => ({ identity, ...attrs })),
      });
    }
    if (body.action === "getIdentityVerificationAttributes") {
      const identities: string[] = body.identities?.length
        ? body.identities
        : (await sesClient.send(new ListIdentitiesCommand({}))).Identities || [];
      const res = await sesClient.send(
        new GetIdentityVerificationAttributesCommand({ Identities: identities }),
      );
      const verificationAttributes = res.VerificationAttributes || {};
      return NextResponse.json({
        verificationAttributes,
        items: Object.entries(verificationAttributes).map(([identity, attrs]) => ({
          identity,
          ...attrs,
        })),
      });
    }
    if (body.action === "setIdentityDkimEnabled") {
      await sesClient.send(
        new SetIdentityDkimEnabledCommand({
          Identity: body.identity ?? body.emailAddress,
          DkimEnabled: body.dkimEnabled ?? false,
        }),
      );
      return NextResponse.json({ success: true });
    }
    if (body.action === "setIdentityFeedbackForwardingEnabled") {
      await sesClient.send(
        new SetIdentityFeedbackForwardingEnabledCommand({
          Identity: body.identity ?? body.emailAddress,
          ForwardingEnabled: body.forwardingEnabled ?? true,
        }),
      );
      return NextResponse.json({ success: true });
    }
    if (body.action === "createTemplate") {
      await sesClient.send(
        new CreateTemplateCommand({
          Template: body.template ?? {
            TemplateName: body.templateName,
            SubjectPart: body.subjectPart ?? body.subject,
            TextPart: body.textPart,
            HtmlPart: body.htmlPart,
          },
        }),
      );
      return NextResponse.json({
        success: true,
        templateName: body.template?.TemplateName ?? body.templateName,
      });
    }
    if (body.action === "getTemplate") {
      const res = await sesClient.send(new GetTemplateCommand({ TemplateName: body.templateName }));
      return NextResponse.json({ template: res.Template });
    }
    if (body.action === "updateTemplate") {
      await sesClient.send(
        new UpdateTemplateCommand({
          Template: body.template ?? {
            TemplateName: body.templateName,
            SubjectPart: body.subjectPart ?? body.subject,
            TextPart: body.textPart,
            HtmlPart: body.htmlPart,
          },
        }),
      );
      return NextResponse.json({
        success: true,
        templateName: body.template?.TemplateName ?? body.templateName,
      });
    }
    if (body.action === "deleteTemplate") {
      await sesClient.send(new DeleteTemplateCommand({ TemplateName: body.templateName }));
      return NextResponse.json({ success: true });
    }
    // default: verify
    await sesClient.send(new VerifyEmailIdentityCommand({ EmailAddress: body.emailAddress }));
    return NextResponse.json({ success: true });
  } catch (error) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const sesClient = getUserClientFromRequest(SESClient, request);
    const { searchParams } = new URL(request.url);
    const identity = searchParams.get("identity")!;
    await sesClient.send(new DeleteIdentityCommand({ Identity: identity }));
    return NextResponse.json({ success: true });
  } catch (error) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
