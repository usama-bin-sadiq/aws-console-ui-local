import { NextResponse } from "next/server";
import { ListWorkGroupsCommand, ListDataCatalogsCommand, StartQueryExecutionCommand, GetQueryExecutionCommand, GetQueryResultsCommand } from "@aws-sdk/client-athena";
import { athena } from "@/lib/aws-clients";

export async function GET() {
  try {
    const [wgRes, catRes] = await Promise.all([
      athena.send(new ListWorkGroupsCommand({})),
      athena.send(new ListDataCatalogsCommand({})),
    ]);
    return NextResponse.json({ workgroups: wgRes.WorkGroups || [], catalogs: catRes.DataCatalogsSummary || [] });
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
    const res = await athena.send(new StartQueryExecutionCommand({ QueryString: body.queryString, WorkGroup: body.workGroup || "primary" }));
    return NextResponse.json({ queryExecutionId: res.QueryExecutionId });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
