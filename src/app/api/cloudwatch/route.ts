import { NextResponse } from "next/server";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  PutMetricAlarmCommand,
  DeleteAlarmsCommand,
  ListMetricsCommand,
  type MetricAlarm,
  type Metric,
} from "@aws-sdk/client-cloudwatch";
import {
  CloudWatchLogsClient,
  CreateLogGroupCommand,
  DeleteLogGroupCommand,
  DescribeLogGroupsCommand,
  DescribeLogStreamsCommand,
  StartQueryCommand,
  GetQueryResultsCommand,
  GetLogEventsCommand,
  PutRetentionPolicyCommand,
  DeleteRetentionPolicyCommand,
  type LogGroup,
} from "@aws-sdk/client-cloudwatch-logs";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const cloudwatchClient = getUserClientFromRequest(CloudWatchClient, request);
    const cloudwatchLogsClient = getUserClientFromRequest(CloudWatchLogsClient, request);
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const alarmNamesParam = searchParams.get("alarmNames");
    const logGroupName = searchParams.get("logGroupName");
    const namespace = searchParams.get("namespace");
    const metricName = searchParams.get("metricName");

    // Alarms
    if (
      action === "describeAlarms" ||
      (!action && !searchParams.has("logGroup") && !searchParams.has("metric"))
    ) {
      const alarmNames = alarmNamesParam ? alarmNamesParam.split(",") : undefined;
      const res = await cloudwatchClient.send(
        new DescribeAlarmsCommand({ AlarmNames: alarmNames || undefined }),
      );
      return NextResponse.json({
        alarms: res.MetricAlarms || [],
        state:
          res.MetricAlarms?.map((a: any) => ({
            AlarmName: a.AlarmName,
            AlarmState: a.StateValue,
          })) || [],
      });
    }

    // Metrics
    if (action === "listMetrics" || searchParams.has("metric")) {
      const res = await cloudwatchClient.send(
        new ListMetricsCommand({
          Namespace: namespace || undefined,
          MetricName: metricName || undefined,
        }),
      );
      return NextResponse.json({ metrics: res.Metrics || [] });
    }

    // Log Groups
    if (action === "describeLogGroups" || searchParams.has("logGroup")) {
      const res = await cloudwatchLogsClient.send(new DescribeLogGroupsCommand({}));
      return NextResponse.json({ logGroups: res.logGroups || [] });
    }

    // Log Streams
    if (action === "describeLogStreams" || searchParams.has("stream")) {
      const res = await cloudwatchLogsClient.send(
        new DescribeLogStreamsCommand({ logGroupName: logGroupName || undefined }),
      );
      return NextResponse.json({ logStreams: res.logStreams || [] });
    }

    // Insights Query Results
    if (action === "getQueryResults") {
      const queryId = searchParams.get("queryId");
      if (!queryId) {
        return NextResponse.json({ error: "queryId required" }, { status: 400 });
      }
      const res = await cloudwatchLogsClient.send(new GetQueryResultsCommand({ queryId }));
      return NextResponse.json({ results: res.results || [] });
    }

    // Log Events
    if (action === "getLogEvents") {
      const logGroupNameParam = searchParams.get("logGroupName");
      const logStreamName = searchParams.get("logStreamName");
      if (!logGroupNameParam || !logStreamName) {
        return NextResponse.json(
          { error: "logGroupName and logStreamName required" },
          { status: 400 },
        );
      }
      const limit = Number(searchParams.get("limit")) || 100;
      const nextToken = searchParams.get("nextToken") || undefined;
      const res = await cloudwatchLogsClient.send(
        new GetLogEventsCommand({
          logGroupName: logGroupNameParam,
          logStreamName,
          limit,
          nextToken,
        }),
      );
      return NextResponse.json({
        events: (res.events || []).map((e) => ({ timestamp: e.timestamp, message: e.message })),
        nextForwardToken: res.nextForwardToken || null,
      });
    }

    // Default: return alarms + metrics + log groups
    const [alarmsRes, metricsRes, logGroupsRes] = await Promise.all([
      cloudwatchClient.send(new DescribeAlarmsCommand({})).catch(() => ({ MetricAlarms: [] })),
      cloudwatchClient.send(new ListMetricsCommand({})).catch(() => ({ Metrics: [] })),
      cloudwatchLogsClient.send(new DescribeLogGroupsCommand({})).catch(() => ({ logGroups: [] })),
    ]);
    return NextResponse.json({
      alarms: (alarmsRes as { MetricAlarms?: MetricAlarm[] }).MetricAlarms || [],
      metrics: (metricsRes as { Metrics?: Metric[] }).Metrics || [],
      logGroups: (logGroupsRes as { logGroups?: LogGroup[] }).logGroups || [],
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
    const cloudwatchClient = getUserClientFromRequest(CloudWatchClient, request);
    const cloudwatchLogsClient = getUserClientFromRequest(CloudWatchLogsClient, request);
    const body = await request.json();
    const { action } = body;

    // Alarm creation / update
    if (action === "createAlarm" || action === "updateAlarm") {
      const params = {
        AlarmName: body.AlarmName || body.alarmName,
        AlarmDescription: body.AlarmDescription || body.alarmDescription,
        MetricName: body.MetricName || body.metricName,
        Namespace: body.Namespace || body.namespace,
        Statistic: body.Statistic || body.statistic || "Average",
        Period: body.Period || body.period || 300,
        Threshold: body.Threshold || body.threshold || 80,
        ComparisonOperator:
          body.ComparisonOperator || body.comparisonOperator || "GreaterThanThreshold",
        EvaluationPeriods: body.EvaluationPeriods || body.evaluationPeriods || 1,
        TreatMissingData: body.TreatMissingData || body.treatMissingData,
        ActionsEnabled: body.ActionsEnabled !== undefined ? body.ActionsEnabled : true,
        AlarmActions: body.AlarmActions || body.alarmActions || [],
        OKActions: body.OKActions || body.okActions || [],
        InsufficientDataActions: body.InsufficientDataActions || body.insufficientDataActions || [],
      };
      await cloudwatchClient.send(new PutMetricAlarmCommand(params));
      return NextResponse.json({ success: true, alarmName: params.AlarmName });
    }

    // Log group creation
    if (action === "createLogGroup") {
      await cloudwatchLogsClient.send(
        new CreateLogGroupCommand({ logGroupName: body.logGroupName || body.name }),
      );
      return NextResponse.json({ success: true, logGroupName: body.logGroupName || body.name });
    }

    // Log group retention policy
    if (action === "putRetentionPolicy") {
      const logGroupNameRP = body.logGroupName;
      if (!logGroupNameRP) {
        return NextResponse.json({ error: "logGroupName required" }, { status: 400 });
      }
      if (body.retentionInDays === 0 || body.retentionInDays === undefined) {
        await cloudwatchLogsClient.send(
          new DeleteRetentionPolicyCommand({ logGroupName: logGroupNameRP }),
        );
      } else {
        await cloudwatchLogsClient.send(
          new PutRetentionPolicyCommand({
            logGroupName: logGroupNameRP,
            retentionInDays: body.retentionInDays,
          }),
        );
      }
      return NextResponse.json({ success: true });
    }

    // Insights query start
    if (action === "startQuery") {
      const res = await cloudwatchLogsClient.send(
        new StartQueryCommand({
          logGroupNames:
            body.logGroupNames && body.logGroupNames.length > 0
              ? body.logGroupNames
              : body.logGroupName
                ? [body.logGroupName]
                : ["/aws/ec2/default"],
          startTime: body.startTime || Date.now() - 3600000,
          endTime: body.endTime || Date.now(),
          queryString: body.queryString || body.query,
          limit: body.limit || 100,
        }),
      );
      return NextResponse.json({
        queryId: res.queryId,
        status: (res as { status?: string }).status || "Scheduled",
      });
    }

    // Default alarm creation
    await cloudwatchClient.send(
      new PutMetricAlarmCommand({
        ...body,
        Statistic: body.Statistic || "Average",
        Period: body.Period || 300,
      }),
    );
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function PUT(request: Request) {
  const denied = await requirePermission(request, "PUT");
  if (denied) return denied;

  try {
    const cloudwatchClient = getUserClientFromRequest(CloudWatchClient, request);
    const body = await request.json();
    const { action } = body;

    if (action === "updateAlarm" || action === "createAlarm") {
      const params = {
        AlarmName: body.AlarmName || body.alarmName,
        AlarmDescription: body.AlarmDescription || body.alarmDescription,
        MetricName: body.MetricName || body.metricName,
        Namespace: body.Namespace || body.namespace,
        Statistic: body.Statistic || body.statistic || "Average",
        Period: body.Period || body.period || 300,
        Threshold: body.Threshold || body.threshold || 80,
        ComparisonOperator:
          body.ComparisonOperator || body.comparisonOperator || "GreaterThanThreshold",
        EvaluationPeriods: body.EvaluationPeriods || body.evaluationPeriods || 1,
        TreatMissingData: body.TreatMissingData || body.treatMissingData,
        ActionsEnabled: body.ActionsEnabled !== undefined ? body.ActionsEnabled : true,
        AlarmActions: body.AlarmActions || body.alarmActions || [],
        OKActions: body.OKActions || body.okActions || [],
        InsufficientDataActions: body.InsufficientDataActions || body.insufficientDataActions || [],
      };
      await cloudwatchClient.send(new PutMetricAlarmCommand(params));
      return NextResponse.json({ success: true, alarmName: params.AlarmName });
    }

    return NextResponse.json({ error: "Unknown PUT action" }, { status: 400 });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const cloudwatchClient = getUserClientFromRequest(CloudWatchClient, request);
    const cloudwatchLogsClient = getUserClientFromRequest(CloudWatchLogsClient, request);
    const { searchParams } = new URL(request.url);
    const alarmNamesParam = searchParams.get("alarmNames");
    const logGroupName = searchParams.get("logGroupName");

    if (alarmNamesParam) {
      const alarmNames = alarmNamesParam.split(",");
      await cloudwatchClient.send(new DeleteAlarmsCommand({ AlarmNames: alarmNames }));
      return NextResponse.json({ success: true, deletedAlarms: alarmNames });
    }

    if (logGroupName) {
      await cloudwatchLogsClient.send(new DeleteLogGroupCommand({ logGroupName }));
      return NextResponse.json({ success: true, deletedLogGroup: logGroupName });
    }

    return NextResponse.json({ error: "alarmNames or logGroupName required" }, { status: 400 });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
