import { NextResponse } from "next/server";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";
import {
  ListDetectorsCommand,
  CreateDetectorCommand,
  DeleteDetectorCommand,
  ListFindingsCommand,
  UpdateFindingsFeedbackCommand,
  ArchiveFindingsCommand,
  UnarchiveFindingsCommand,
} from "@aws-sdk/client-guardduty";
import { GuardDutyClient } from "@aws-sdk/client-guardduty";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const guarddutyClient = getUserClientFromRequest(GuardDutyClient, request);
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "listFindings") {
      let detectorId = searchParams.get("detectorId") || undefined;
      if (!detectorId) {
        const detectorsRes = await guarddutyClient.send(
          new ListDetectorsCommand({ MaxResults: 1 }),
        );
        detectorId = detectorsRes.DetectorIds?.[0];
        if (!detectorId) {
          return NextResponse.json({
            findings: [],
            items: [],
            message: "No GuardDuty detector configured",
          });
        }
      }
      const res = await guarddutyClient.send(
        new ListFindingsCommand({ DetectorId: detectorId, FindingCriteria: {} }),
      );
      return NextResponse.json({
        findings: res.FindingIds ? res.FindingIds.map((id: any) => ({ Id: id })) : [],
      });
    }

    const res = await guarddutyClient.send(new ListDetectorsCommand({}));
    return NextResponse.json({
      detectors: (res.DetectorIds || []).map((id: string) => ({ DetectorId: id })),
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
    const guarddutyClient = getUserClientFromRequest(GuardDutyClient, request);
    const body: Record<string, any> = await request.json().catch(() => ({}));

    if (body.action === "archiveFinding") {
      await guarddutyClient.send(
        new ArchiveFindingsCommand({
          DetectorId: body.detectorId || "default",
          FindingIds: [body.findingId],
        }),
      );
      return NextResponse.json({ success: true });
    }

    if (body.action === "unarchiveFinding") {
      await guarddutyClient.send(
        new UnarchiveFindingsCommand({
          DetectorId: body.detectorId || "default",
          FindingIds: [body.findingId],
        }),
      );
      return NextResponse.json({ success: true });
    }

    if (body.action === "updateFindingFeedback") {
      await guarddutyClient.send(
        new UpdateFindingsFeedbackCommand({
          DetectorId: body.detectorId || "default",
          FindingIds: [body.findingId],
          Feedback: body.feedback || "USEFUL",
        }),
      );
      return NextResponse.json({ success: true });
    }

    // Default action: enable GuardDuty (create detector). Body is optional and
    // may carry findingPublishingFrequency; detectorId in the body is ignored
    // because CreateDetector does not accept one.
    const res = await guarddutyClient.send(
      new CreateDetectorCommand({
        Enable: true,
        ...(body.findingPublishingFrequency
          ? { FindingPublishingFrequency: body.findingPublishingFrequency }
          : {}),
      }),
    );
    return NextResponse.json({ detectorId: res.DetectorId || body.detectorId });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const guarddutyClient = getUserClientFromRequest(GuardDutyClient, request);
    const { searchParams } = new URL(request.url);
    await guarddutyClient.send(
      new DeleteDetectorCommand({ DetectorId: searchParams.get("detectorId")! }),
    );
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
