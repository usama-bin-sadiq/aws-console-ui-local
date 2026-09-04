import { NextResponse } from "next/server";
import { ListApplicationsCommand, CreateApplicationCommand, DeleteApplicationCommand } from "@aws-sdk/client-codedeploy";
import { codedeploy } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await codedeploy.send(new ListApplicationsCommand({}));
    return NextResponse.json({ applications: (res.applications || []).map((name) => ({ applicationName: name })) });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await codedeploy.send(new CreateApplicationCommand({ applicationName: body.name, computePlatform: body.platform || "Server" }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    await codedeploy.send(new DeleteApplicationCommand({ applicationName: searchParams.get("appName")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
