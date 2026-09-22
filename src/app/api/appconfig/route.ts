import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/data-isolation";

// @aws-sdk/client-appconfig is not installed in this project.
// Install it to enable full AppConfig support.

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  return NextResponse.json({
    applications: [],
    message: "AppConfig requires @aws-sdk/client-appconfig package",
  });
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  return NextResponse.json({ error: "AppConfig not yet configured" }, { status: 501 });
}
