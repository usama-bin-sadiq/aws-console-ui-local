// Amazon QuickSight — dashboard, analysis, dataset and data source workflows.
// Commands: @aws-sdk/client-quicksight (ListDashboards, DescribeDashboard,
// DeleteDashboard, ListAnalyses, ListDataSets, DescribeDataSet,
// ListDataSources, DescribeDataSource, ListThemes)
import { NextResponse } from "next/server";
import {
  QuickSightClient,
  ListDashboardsCommand,
  DescribeDashboardCommand,
  DeleteDashboardCommand,
  ListAnalysesCommand,
  ListDataSetsCommand,
  DescribeDataSetCommand,
  ListDataSourcesCommand,
  DescribeDataSourceCommand,
  ListThemesCommand,
} from "@aws-sdk/client-quicksight";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";

function accountId(): string {
  return process.env.AWS_ACCOUNT_ID || "000000000000";
}

function unavailable(error: unknown) {
  const adapter = getAdapterStatus();
  return handleAdapterError(error, adapter.mode, adapter.endpoint);
}

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const client = getUserClientFromRequest(QuickSightClient, request);
    const res = await client.send(
      new ListDashboardsCommand({ AwsAccountId: accountId(), MaxResults: 100 }),
    );
    const dashboards = res.DashboardSummaryList || [];
    return NextResponse.json({ items: dashboards, dashboards, count: dashboards.length });
  } catch (error: unknown) {
    return unavailable(error);
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const client = getUserClientFromRequest(QuickSightClient, request);
    const body = await request.json();
    const AwsAccountId = body.awsAccountId || accountId();

    switch (body.action) {
      case "describeDashboard": {
        const res = await client.send(
          new DescribeDashboardCommand({ AwsAccountId, DashboardId: body.dashboardId }),
        );
        return NextResponse.json({ dashboard: res.Dashboard });
      }
      case "listAnalyses": {
        const res = await client.send(
          new ListAnalysesCommand({ AwsAccountId, MaxResults: body.maxResults }),
        );
        return NextResponse.json({
          items: res.AnalysisSummaryList || [],
          analyses: res.AnalysisSummaryList || [],
        });
      }
      case "listDataSets": {
        const res = await client.send(
          new ListDataSetsCommand({ AwsAccountId, MaxResults: body.maxResults }),
        );
        return NextResponse.json({
          items: res.DataSetSummaries || [],
          dataSets: res.DataSetSummaries || [],
        });
      }
      case "describeDataSet": {
        const res = await client.send(
          new DescribeDataSetCommand({ AwsAccountId, DataSetId: body.dataSetId }),
        );
        return NextResponse.json({ dataSet: res.DataSet });
      }
      case "listDataSources": {
        const res = await client.send(
          new ListDataSourcesCommand({ AwsAccountId, MaxResults: body.maxResults }),
        );
        return NextResponse.json({
          items: res.DataSources || [],
          dataSources: res.DataSources || [],
        });
      }
      case "describeDataSource": {
        const res = await client.send(
          new DescribeDataSourceCommand({ AwsAccountId, DataSourceId: body.dataSourceId }),
        );
        return NextResponse.json({ dataSource: res.DataSource });
      }
      case "listThemes": {
        const res = await client.send(
          new ListThemesCommand({ AwsAccountId, MaxResults: body.maxResults }),
        );
        return NextResponse.json({
          items: res.ThemeSummaryList || [],
          themes: res.ThemeSummaryList || [],
        });
      }
      default:
        return NextResponse.json(
          {
            error: `Unsupported action "${body.action}". Supported: describeDashboard, listAnalyses, listDataSets, describeDataSet, listDataSources, describeDataSource, listThemes`,
          },
          { status: 400 },
        );
    }
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const client = getUserClientFromRequest(QuickSightClient, request);
    const { searchParams } = new URL(request.url);
    const dashboardId = searchParams.get("dashboardId");
    if (!dashboardId) {
      return NextResponse.json({ error: "Missing ?dashboardId=" }, { status: 400 });
    }
    await client.send(
      new DeleteDashboardCommand({
        AwsAccountId: searchParams.get("awsAccountId") || accountId(),
        DashboardId: dashboardId,
        VersionNumber: searchParams.get("versionNumber")
          ? Number(searchParams.get("versionNumber"))
          : undefined,
      }),
    );
    return NextResponse.json({ success: true, dashboardId });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
