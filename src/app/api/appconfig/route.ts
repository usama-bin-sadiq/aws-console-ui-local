import { NextResponse } from "next/server";

// @aws-sdk/client-appconfig is not installed in this project.
// Install it to enable full AppConfig support.

export async function GET() {
  return NextResponse.json({
    applications: [],
    message: "AppConfig requires @aws-sdk/client-appconfig package",
  });
}

export async function POST() {
  return NextResponse.json({ error: "AppConfig not yet configured" }, { status: 501 });
}
