import { NextResponse } from "next/server";
import {
  ListWorkGroupsCommand,
  ListDataCatalogsCommand,
  StartQueryExecutionCommand,
  GetQueryExecutionCommand,
  GetQueryResultsCommand,
  ListNamedQueriesCommand,
  CreateNamedQueryCommand,
  ListQueryExecutionsCommand,
} from "@aws-sdk/client-athena";
import { athena } from "@/lib/aws-clients";

export async function GET() {
  try {
    const [wgRes, catRes, nqRes] = await Promise.all([
      athena.send(new ListWorkGroupsCommand({})),
      athena.send(new ListDataCatalogsCommand({})),
      athena.send(new ListNamedQueriesCommand({})).catch(() => ({ NamedQueryIds: [] })),
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
  try {
    const body = await request.json();
    if (body.action === "getQueryState") {
      const res = await athena.send(new GetQueryExecutionCommand({ QueryExecutionId: body.queryExecutionId }));
      return NextResponse.json({ execution: res.QueryExecution });
    }
    if (body.action === "getResults") {
      const res = await athena.send(new GetQueryResultsCommand({ QueryExecutionId: body.queryExecutionId }));
      return NextResponse.json({ results: res.ResultSet });
    }
    if (body.action === "createNamedQuery") {
      await athena.send(
        new CreateNamedQueryCommand({
          Name: body.name,
          Database: body.database || "default",
          QueryString: body.queryString,
        })
      );
      return NextResponse.json({ success: true });
    }
    if (body.action === "listQueryExecutions") {
      const res = await athena.send(new ListQueryExecutionsCommand({ WorkGroup: body.workGroup || "primary" }));
      return NextResponse.json({ executions: res.QueryExecutionIds || [] });
    }
    const res = await athena.send(
      new StartQueryExecutionCommand({ QueryString: body.queryString, WorkGroup: body.workGroup || "primary" })
    );
    return NextResponse.json({ queryExecutionId: res.QueryExecutionId });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
