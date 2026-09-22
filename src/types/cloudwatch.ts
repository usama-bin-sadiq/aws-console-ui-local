/**
 * CloudWatch Types — Aligned with PRD §9.2.8, §15.10 / F-013
 */
export interface CloudWatchAlarmConfig {
  AlarmName?: string;
  AlarmDescription?: string;
  MetricName?: string;
  Namespace?: string;
  Statistic?: 'Average' | 'Sum' | 'Minimum' | 'Maximum';
  Period?: number;
  Threshold?: number;
  ComparisonOperator?:
    | 'GreaterThanOrEqualToThreshold'
    | 'GreaterThanThreshold'
    | 'LessThanThreshold'
    | 'LessThanOrEqualToThreshold'
    | 'LessThanLowerOrGreaterThanUpperThreshold'
    | 'GreaterThanUpperThreshold';
  EvaluationPeriods?: number;
  TreatMissingData?: 'missing' | 'ignore' | 'breaching' | 'notBreaching';
}

export interface CloudWatchAlarm {
  AlarmName: string;
  AlarmArn?: string;
  AlarmDescription?: string;
  AlarmState?: 'OK' | 'ALARM' | 'INSUFFICIENT_DATA';
  MetricName?: string;
  Namespace?: string;
  Statistic?: string;
  Period?: number;
  Threshold?: number;
  ComparisonOperator?: string;
  EvaluationPeriods?: number;
  TreatMissingData?: 'missing' | 'notBreaching' | 'breaching' | 'ignore';
  ActionsEnabled?: boolean;
  Actions?: string[];
  AlarmActions?: string[];
  OKActions?: string[];
  InsufficientDataActions?: string[];
}

export interface CloudWatchMetric {
  Namespace?: string;
  MetricName?: string;
  Dimensions?: Array<{ Name?: string; Value?: string }>;
}

export interface CloudWatchLogGroup {
  logGroupName?: string;
  creationTime?: number;
  retentionInDays?: number;
  metricFilterCount?: number;
  storedBytes?: number;
  arn?: string;
}

export interface CloudWatchLogStream {
  logStreamName?: string;
  creationTime?: number;
  firstEventTimestamp?: number;
  lastEventTimestamp?: number;
  lastIngestionTime?: number;
  uploadSequenceToken?: string;
  arn?: string;
}

export interface CloudWatchInsightsQuery {
  queryString?: string;
  logGroupNames?: string[];
  startTime?: number;
  endTime?: number;
  limit?: number;
  queryId?: string;
  status?: 'Scheduled' | 'Running' | 'Complete' | 'Failed' | 'Cancelled';
  results?: Array<Record<string, unknown>>;
}

export interface CloudWatchAlarmAction {
  id?: string;
  actionName?: string;
  arn?: string;
}
