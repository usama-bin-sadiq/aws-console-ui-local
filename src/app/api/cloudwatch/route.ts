import { NextResponse } from "next/server";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";
import {
  DescribeAlarmsCommand,
  PutMetricAlarmCommand,
  DeleteAlarmsCommand,
  ListMetricsCommand,
  GetMetricStatisticsCommand,
} from "@aws-sdk/client-cloudwatch";
import {
  CreateLogGroupCommand,
  DeleteLogGroupCommand,
  DescribeLogGroupsCommand,
  DescribeLogStreamsCommand,
  StartQueryCommand,
  GetQueryResultsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { cloudwatch, cloudwatchLogs } from "@/lib/aws-clients";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const alarmNamesParam = searchParams.get("alarmNames");
    const logGroupName = searchParams.get("logGroupName");
    const namespace = searchParams.get("namespace");
    const metricName = searchParams.get("metricName");

    // Alarms
    if (action === "describeAlarms" || (!action && !searchParams.has("logGroup") && !searchParams.has("metric"))) {
      const alarmNames = alarmNamesParam ? alarmNamesParam.split(",") : undefined;
      const res = await cloudwatch.send(
        new DescribeAlarmsCommand({ AlarmNames: alarmNames || undefined })
      );
      return NextResponse.json({ alarms: res.MetricAlarms || [], state: res.MetricAlarms?.map((a: any) => ({ AlarmName: a.AlarmName, AlarmState: a.StateValue })) || [] });
    }

    // Metrics
    if (action === "listMetrics" || searchParams.has("metric")) {
      const res = await cloudwatch.send(
        new ListMetricsCommand({ Namespace: namespace || undefined, MetricName: metricName || undefined })
      );
      return NextResponse.json({ metrics: res.Metrics || [] });
    }

    // Log Groups
    if (action === "describeLogGroups" || searchParams.has("logGroup")) {
      const res = await cloudwatchLogs.send(new DescribeLogGroupsCommand({}));
      return NextResponse.json({ logGroups: res.logGroups || [] });
    }

    // Log Streams
    if (action === "describeLogStreams" || searchParams.has("stream")) {
      const res = await cloudwatchLogs.send(
        new DescribeLogStreamsCommand({ logGroupName: logGroupName || undefined })
      );
      return NextResponse.json({ logStreams: res.logStreams || [] });
    }

    // Insights Query Results
    if (action === "getQueryResults") {
      const queryId = searchParams.get("queryId");
      if (!queryId) {
        return NextResponse.json({ error: "queryId required" }, { status: 400 });
      }
      const res = await cloudwatchLogs.send(new GetQueryResultsCommand({ queryId }));
      return NextResponse.json({ results: res.results || [] });
    }

    // Default: return alarms + metrics + log groups
    const [alarmsRes, metricsRes, logGroupsRes] = await Promise.all([
      cloudwatch.send(new DescribeAlarmsCommand({})).catch(() => ({ MetricAlarms: [] })),
      cloudwatch.send(new ListMetricsCommand({})).catch(() => ({ Metrics: [] })),
      cloudwatchLogs.send(new DescribeLogGroupsCommand({})).catch(() => ({ logGroups: [] })),
    ]);
    return NextResponse.json({
      alarms: (alarmsRes as any).MetricAlarms || [],
      metrics: (metricsRes as any).Metrics || [],
      logGroups: (logGroupsRes as any).logGroups || [],
    });
  } catch (error: any) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function POST(request: Request) {
  try {
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
        ComparisonOperator: body.ComparisonOperator || body.comparisonOperator || "GreaterThanThreshold",
        EvaluationPeriods: body.EvaluationPeriods || body.evaluationPeriods || 1,
        TreatMissingData: body.TreatMissingData || body.treatMissingData,
        ActionsEnabled: body.ActionsEnabled !== undefined ? body.ActionsEnabled : true,
        AlarmActions: body.AlarmActions || body.alarmActions || [],
        OKActions: body.OKActions || body.okActions || [],
        InsufficientDataActions: body.InsufficientDataActions || body.insufficientDataActions || [],
      };
      await cloudwatch.send(new PutMetricAlarmCommand(params));
      return NextResponse.json({ success: true, alarmName: params.AlarmName });
    }

    // Log group creation
    if (action === "createLogGroup") {
      await cloudwatchLogs.send(
        new CreateLogGroupCommand({ logGroupName: body.logGroupName || body.name })
      );
      return NextResponse.json({ success: true, logGroupName: body.logGroupName || body.name });
    }

    // Insights query start
    if (action === "startQuery") {
      const res = await cloudwatchLogs.send(
        new StartQueryCommand({
          logGroupNames: (body.logGroupNames && body.logGroupNames.length > 0) ? body.logGroupNames : (body.logGroupName ? [body.logGroupName] : ["/aws/ec2/default"]),
          startTime: body.startTime || Date.now() - 3600000,
          endTime: body.endTime || Date.now(),
          queryString: body.queryString || body.query,
          limit: body.limit || 100,
        })
      );
      return NextResponse.json({ queryId: res.queryId, status: (res as any).status || "Scheduled" });
    }

    // Default alarm creation
    await cloudwatch.send(new PutMetricAlarmCommand({ ...body, Statistic: body.Statistic || "Average", Period: body.Period || 300 }));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function PUT(request: Request) {
  try {
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
        ComparisonOperator: body.ComparisonOperator || body.comparisonOperator || "GreaterThanThreshold",
        EvaluationPeriods: body.EvaluationPeriods || body.evaluationPeriods || 1,
        TreatMissingData: body.TreatMissingData || body.treatMissingData,
        ActionsEnabled: body.ActionsEnabled !== undefined ? body.ActionsEnabled : true,
        AlarmActions: body.AlarmActions || body.alarmActions || [],
      };
      await cloudwatch.send(new PutMetricAlarmCommand(params));
      return NextResponse.json({ success: true, alarmName: params.AlarmName });
    }

    return NextResponse.json({ error: "Unknown PUT action" }, { status: 400 });
  } catch (error: any) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const alarmNamesParam = searchParams.get("alarmNames");
    const logGroupName = searchParams.get("logGroupName");

    if (alarmNamesParam) {
      const alarmNames = alarmNamesParam.split(",");
      await cloudwatch.send(new DeleteAlarmsCommand({ AlarmNames: alarmNames }));
      return NextResponse.json({ success: true, deletedAlarms: alarmNames });
    }

    if (logGroupName) {
      await cloudwatchLogs.send(new DeleteLogGroupCommand({ logGroupName }));
      return NextResponse.json({ success: true, deletedLogGroup: logGroupName });
    }

    return NextResponse.json({ error: "alarmNames or logGroupName required" }, { status: 400 });
  } catch (error: any) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
