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
import { guardduty } from "@/lib/aws-clients";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "listFindings") {
      const res = await guardduty.send(new ListFindingsCommand({ DetectorId: searchParams.get("detectorId") || undefined, FindingCriteria: {} }));
      return NextResponse.json({ findings: res.FindingIds ? res.FindingIds.map((id: any) => ({ Id: id })) : [] });
    }

    const res = await guardduty.send(new ListDetectorsCommand({}));
    return NextResponse.json({ detectors: (res.DetectorIds || []).map((id: string) => ({ DetectorId: id })) });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.action === "archiveFinding") {
      await guardduty.send(new ArchiveFindingsCommand({ DetectorId: body.detectorId || "default", FindingIds: [body.findingId] }));
      return NextResponse.json({ success: true });
    }

    if (body.action === "unarchiveFinding") {
      await guardduty.send(new UnarchiveFindingsCommand({ DetectorId: body.detectorId || "default", FindingIds: [body.findingId] }));
      return NextResponse.json({ success: true });
    }

    if (body.action === "updateFindingFeedback") {
      await guardduty.send(new UpdateFindingsFeedbackCommand({ DetectorId: body.detectorId || "default", FindingIds: [body.findingId], Feedback: body.feedback || "USEFUL" }));
      return NextResponse.json({ success: true });
    }

    const res = await guardduty.send(new CreateDetectorCommand({ Enable: true }));
    return NextResponse.json({ detectorId: res.DetectorId });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    await guardduty.send(new DeleteDetectorCommand({ DetectorId: searchParams.get("detectorId")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
