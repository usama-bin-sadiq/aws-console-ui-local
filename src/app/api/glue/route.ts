import { NextResponse } from "next/server";
import { GetDatabasesCommand, GetJobsCommand, CreateDatabaseCommand, CreateJobCommand, DeleteDatabaseCommand, DeleteJobCommand, StartJobRunCommand } from "@aws-sdk/client-glue";
import { glue } from "@/lib/aws-clients";

export async function GET() {
  try {
    const [dbRes, jobRes] = await Promise.all([
      glue.send(new GetDatabasesCommand({})),
      glue.send(new GetJobsCommand({})),
    ]);
    return NextResponse.json({ databases: dbRes.DatabaseList || [], jobs: jobRes.Jobs || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "createJob") {
      await glue.send(new CreateJobCommand({ Name: body.name, Role: body.role || "arn:aws:iam::000000000000:role/glue-role", Command: body.command || { Name: "glueetl", ScriptLocation: "s3://bucket/script.py" } }));
      return NextResponse.json({ success: true });
    }
    if (body.action === "startJobRun") {
      const res = await glue.send(new StartJobRunCommand({ JobName: body.jobName }));
      return NextResponse.json({ jobRunId: res.JobRunId });
    }
    await glue.send(new CreateDatabaseCommand({ DatabaseInput: { Name: body.name } }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const name = searchParams.get("name")!;
    if (type === "job") {
      await glue.send(new DeleteJobCommand({ JobName: name }));
    } else {
      await glue.send(new DeleteDatabaseCommand({ Name: name }));
    }
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
