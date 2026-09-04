import { NextResponse } from "next/server";
import { ListDetectorsCommand, CreateDetectorCommand, DeleteDetectorCommand } from "@aws-sdk/client-guardduty";
import { guardduty } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await guardduty.send(new ListDetectorsCommand({}));
    return NextResponse.json({ detectors: (res.DetectorIds || []).map((id) => ({ DetectorId: id })) });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const res = await guardduty.send(new CreateDetectorCommand({ Enable: true }));
    return NextResponse.json({ detectorId: res.DetectorId });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    await guardduty.send(new DeleteDetectorCommand({ DetectorId: searchParams.get("detectorId")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
