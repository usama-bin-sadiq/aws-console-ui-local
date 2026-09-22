import { NextResponse } from "next/server";
import {
  AthenaClient,
  ListWorkGroupsCommand,
  ListDataCatalogsCommand,
  StartQueryExecutionCommand,
  GetQueryExecutionCommand,
  GetQueryResultsCommand,
  ListNamedQueriesCommand,
  CreateNamedQueryCommand,
  ListQueryExecutionsCommand,
} from "@aws-sdk/client-athena";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const athenaClient = getUserClientFromRequest(AthenaClient, request);
    const [wgRes, catRes, nqRes] = await Promise.all([
      athenaClient.send(new ListWorkGroupsCommand({})),
      athenaClient.send(new ListDataCatalogsCommand({})),
      athenaClient.send(new ListNamedQueriesCommand({})).catch(() => ({ NamedQueryIds: [] })),
    ]);
    const namedQueries = (nqRes.NamedQueryIds || []).map((id: string) => ({ NamedQueryId: id, Name: id }));
    return NextResponse.json({
      workgroups: wgRes.WorkGroups || [],
      catalogs: catRes.DataCatalogsSummary || [],
      namedQueries,
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const athenaClient = getUserClientFromRequest(AthenaClient, request);
    const body = await request.json();
    if (body.action === "getQueryState") {
      const res = await athenaClient.send(new GetQueryExecutionCommand({ QueryExecutionId: body.queryExecutionId }));
      return NextResponse.json({ execution: res.QueryExecution });
    }
    if (body.action === "getResults") {
      const res = await athenaClient.send(new GetQueryResultsCommand({ QueryExecutionId: body.queryExecutionId }));
      return NextResponse.json({ results: res.ResultSet });
    }
    if (body.action === "createNamedQuery") {
      await athenaClient.send(
        new CreateNamedQueryCommand({
          Name: body.name,
          Database: body.database || "default",
          QueryString: body.queryString,
        })
      );
      return NextResponse.json({ success: true });
    }
    if (body.action === "listQueryExecutions") {
      const res = await athenaClient.send(new ListQueryExecutionsCommand({ WorkGroup: body.workGroup || "primary" }));
      return NextResponse.json({ executions: res.QueryExecutionIds || [] });
    }
    const res = await athenaClient.send(
      new StartQueryExecutionCommand({ QueryString: body.queryString, WorkGroup: body.workGroup || "primary" })
    );
    return NextResponse.json({ queryExecutionId: res.QueryExecutionId });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
