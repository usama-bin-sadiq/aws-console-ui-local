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
import { GlueClient } from "@aws-sdk/client-glue";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const glueClient = getUserClientFromRequest(GlueClient, request);
    const [dbRes, tableRes, crawlerRes, jobRes] = await Promise.all([
      glueClient.send(new GetDatabasesCommand({})),
      glueClient
        .send(new GetTablesCommand({ DatabaseName: "default" }))
        .catch(() => ({ TableList: [] })),
      glueClient.send(new GetCrawlersCommand({})).catch(() => ({ CrawlerNames: [] })),
      glueClient.send(new GetJobsCommand({})).catch(() => ({ Jobs: [] })),
    ]);
    return NextResponse.json({
      databases: dbRes.DatabaseList || [],
      tables: tableRes.TableList || [],
      crawlers: (crawlerRes as any).CrawlerNames || (crawlerRes as any).Crawlers || [],
      jobs: jobRes.Jobs || [],
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
    const glueClient = getUserClientFromRequest(GlueClient, request);
    const body = await request.json();
    if (body.action === "createJob") {
      await glueClient.send(
        new CreateJobCommand({
          Name: body.name,
          Role: body.role || "arn:aws:iam::000000000000:role/glue-role",
          Command: body.command || { Name: "glueetl", ScriptLocation: "s3://bucket/script.py" },
        }),
      );
      return NextResponse.json({ success: true });
    }
    if (body.action === "startJobRun") {
      const res = await glueClient.send(new StartJobRunCommand({ JobName: body.jobName }));
      return NextResponse.json({ jobRunId: res.JobRunId });
    }
    if (body.action === "createCrawler") {
      await glueClient.send(
        new CreateCrawlerCommand({
          Name: body.name,
          Role: body.role || "arn:aws:iam::000000000000:role/glue-crawler-role",
          DatabaseName: body.databaseName || "default",
          Targets: { S3Targets: [{ Path: body.s3Path || "s3://bucket/" }] },
        }),
      );
      return NextResponse.json({ success: true });
    }
    if (body.action === "startCrawler") {
      await glueClient.send(new StartCrawlerCommand({ Name: body.name }));
      return NextResponse.json({ success: true });
    }
    await glueClient.send(new CreateDatabaseCommand({ DatabaseInput: { Name: body.name } }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const glueClient = getUserClientFromRequest(GlueClient, request);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const name = searchParams.get("name")!;
    if (type === "job") {
      await glueClient.send(new DeleteJobCommand({ JobName: name }));
    } else if (type === "crawler") {
      await glueClient.send(new DeleteCrawlerCommand({ Name: name }));
    } else {
      await glueClient.send(new DeleteDatabaseCommand({ Name: name }));
    }
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
