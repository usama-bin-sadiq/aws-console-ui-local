import { NextResponse } from "next/server";
import {
  GetDatabasesCommand,
  GetTablesCommand,
  GetCrawlersCommand,
  GetJobsCommand,
  CreateDatabaseCommand,
  CreateCrawlerCommand,
  CreateJobCommand,
  DeleteDatabaseCommand,
  DeleteJobCommand,
  DeleteCrawlerCommand,
  StartJobRunCommand,
  StartCrawlerCommand,
  GetCrawlerCommand,
} from "@aws-sdk/client-glue";
import { glue } from "@/lib/aws-clients";

export async function GET() {
  try {
    const [dbRes, tableRes, crawlerRes, jobRes] = await Promise.all([
      glue.send(new GetDatabasesCommand({})),
      glue.send(new GetTablesCommand({ DatabaseName: "default" })).catch(() => ({ TableList: [] })),
      glue.send(new GetCrawlersCommand({})).catch(() => ({ CrawlerNames: [] })),
      glue.send(new GetJobsCommand({})).catch(() => ({ Jobs: [] })),
    ]);
    return NextResponse.json({
      databases: dbRes.DatabaseList || [],
      tables: tableRes.TableList || [],
      crawlers: (crawlerRes as any).CrawlerNames || (crawlerRes as any).Crawlers || [],
      jobs: jobRes.Jobs || [],
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "createJob") {
      await glue.send(
        new CreateJobCommand({
          Name: body.name,
          Role: body.role || "arn:aws:iam::000000000000:role/glue-role",
          Command: body.command || { Name: "glueetl", ScriptLocation: "s3://bucket/script.py" },
        })
      );
      return NextResponse.json({ success: true });
    }
    if (body.action === "startJobRun") {
      const res = await glue.send(new StartJobRunCommand({ JobName: body.jobName }));
      return NextResponse.json({ jobRunId: res.JobRunId });
    }
    if (body.action === "createCrawler") {
      await glue.send(
        new CreateCrawlerCommand({
          Name: body.name,
          Role: body.role || "arn:aws:iam::000000000000:role/glue-crawler-role",
          DatabaseName: body.databaseName || "default",
          Targets: { S3Targets: [{ Path: body.s3Path || "s3://bucket/" }] },
        })
      );
      return NextResponse.json({ success: true });
    }
    if (body.action === "startCrawler") {
      await glue.send(new StartCrawlerCommand({ Name: body.name }));
      return NextResponse.json({ success: true });
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
    } else if (type === "crawler") {
      await glue.send(new DeleteCrawlerCommand({ Name: name }));
    } else {
      await glue.send(new DeleteDatabaseCommand({ Name: name }));
    }
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
