/**
 * CloudWatch Types
 */
export interface CloudWatchAlarmConfig {
  AlarmName?: string;
  MetricName?: string;
  Namespace?: string;
  Statistic?: 'Average' | 'Sum' | 'Minimum' | 'Maximum';
  Threshold?: number;
  ComparisonOperator?: 'GreaterThanOrEqualToThreshold';
  EvaluationPeriods?: number;
}
