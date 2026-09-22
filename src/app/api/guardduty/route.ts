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
  GetFindingsCommand,
  UpdateDetectorCommand,
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
      const res = await guarddutyClient.send(new ListFindingsCommand({ DetectorId: searchParams.get("detectorId") || undefined, FindingCriteria: {} }));
      return NextResponse.json({ findings: res.FindingIds ? res.FindingIds.map((id: any) => ({ Id: id })) : [] });
    }

    const res = await guarddutyClient.send(new ListDetectorsCommand({}));
    return NextResponse.json({ detectors: (res.DetectorIds || []).map((id: string) => ({ DetectorId: id })) });
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
    const body = await request.json();

    if (body.action === "archiveFinding") {
      await guarddutyClient.send(new ArchiveFindingsCommand({ DetectorId: body.detectorId || "default", FindingIds: [body.findingId] }));
      return NextResponse.json({ success: true });
    }

    if (body.action === "unarchiveFinding") {
      await guarddutyClient.send(new UnarchiveFindingsCommand({ DetectorId: body.detectorId || "default", FindingIds: [body.findingId] }));
      return NextResponse.json({ success: true });
    }

    if (body.action === "updateFindingFeedback") {
      await guarddutyClient.send(new UpdateFindingsFeedbackCommand({ DetectorId: body.detectorId || "default", FindingIds: [body.findingId], Feedback: body.feedback || "USEFUL" }));
      return NextResponse.json({ success: true });
    }

    const res = await guarddutyClient.send(new CreateDetectorCommand({ Enable: true }));
    return NextResponse.json({ detectorId: res.DetectorId });
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
    await guarddutyClient.send(new DeleteDetectorCommand({ DetectorId: searchParams.get("detectorId")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
