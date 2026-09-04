/**
 * CloudWatch Constants — Aligned with PRD §9.2.8, §15.10 / F-013
 */
export const CLOUDWATCH_DEFAULT_STATISTIC = 'Average';

export const CLOUDWATCH_STATISTICS = [
  { value: 'Average', label: 'Average' },
  { value: 'Sum', label: 'Sum' },
  { value: 'Minimum', label: 'Minimum' },
  { value: 'Maximum', label: 'Maximum' },
  { value: 'SampleCount', label: 'Sample Count' },
] as const;

export const CLOUDWATCH_NAMESPACES = [
  'AWS/EC2',
  'AWS/Lambda',
  'AWS/RDS',
  'AWS/DynamoDB',
  'AWS/EBS',
  'AWS/S3',
  'AWS/ApplicationELB',
  'AWS/NetworkELB',
  'AWS/CloudFront',
  'AWS/ECS',
  'AWS/EKS',
  'CWAgent',
  'AWS/Logs',
] as string[];

export const CLOUDWATCH_PERIODS = [
  { value: 60, label: '1 minute' },
  { value: 300, label: '5 minutes' },
  { value: 900, label: '15 minutes' },
  { value: 3600, label: '1 hour' },
] as const;

export const CLOUDWATCH_COMPARISON_OPERATORS = [
  { value: 'GreaterThanThreshold', label: 'Greater than' },
  { value: 'GreaterThanOrEqualToThreshold', label: 'Greater than or equal to' },
  { value: 'LessThanThreshold', label: 'Less than' },
  { value: 'LessThanOrEqualToThreshold', label: 'Less than or equal to' },
] as const;

export const CLOUDWATCH_EVALUATION_PERIODS = [
  1, 2, 3, 4, 5, 10,
] as number[];
