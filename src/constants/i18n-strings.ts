/**
 * Phase 22 — i18n Foundation: Hardcoded English strings extracted
 * from edited components. Every string below must be translated
 * when full i18n is implemented (PRD §20).
 *
 * Key:
 *  - Component: file path
 *  - Context: UI label / message / button text
 *  - Key: proposed translation key (kebab-case)
 *  - Priority: P0 (critical UI) / P1 (secondary)
 */

export interface I18nStringEntry {
  component: string;
  context: string;
  key: string;
  priority: "P0" | "P1";
}

export const I18N_STRINGS_TO_TRANSLATE: I18nStringEntry[] = [
  // AppShell
  { component: "AppShell", context: "Skip link text", key: "a11y.skip-to-main", priority: "P0" },
  {
    component: "AppShell",
    context: "Search placeholder",
    key: "search.placeholder",
    priority: "P0",
  },
  { component: "AppShell", context: "Terminal button label", key: "nav.terminal", priority: "P1" },
  { component: "AppShell", context: "Region dropdown label", key: "nav.region", priority: "P1" },
  { component: "AppShell", context: "Theme toggle label", key: "nav.theme-toggle", priority: "P1" },

  // ConfirmModal
  {
    component: "ConfirmModal",
    context: "Close modal aria label",
    key: "modal.close",
    priority: "P0",
  },
  { component: "ConfirmModal", context: "Cancel button", key: "button.cancel", priority: "P0" },
  {
    component: "ConfirmModal",
    context: "Warning alert text pattern",
    key: "confirm.warning",
    priority: "P0",
  },
  {
    component: "ConfirmModal",
    context: "Confirm input aria label",
    key: "confirm.type-resource",
    priority: "P0",
  },

  // EC2 page
  {
    component: "EC2Page",
    context: "Launch instances button",
    key: "ec2.launch-instances",
    priority: "P0",
  },
  {
    component: "EC2Page",
    context: "Refresh button aria label",
    key: "button.refresh",
    priority: "P0",
  },
  {
    component: "EC2Page",
    context: "Instance actions dropdown label",
    key: "ec2.bulk-actions",
    priority: "P1",
  },
  {
    component: "EC2Page",
    context: "Table empty message — no instances",
    key: "ec2.empty.no-instances",
    priority: "P0",
  },
  {
    component: "EC2Page",
    context: "Table empty message — filtered",
    key: "ec2.empty.filtered",
    priority: "P0",
  },
  {
    component: "EC2Page",
    context: "Modal title pattern",
    key: "ec2.confirm.title-pattern",
    priority: "P0",
  },

  // Lambda page
  {
    component: "LambdaPage",
    context: "Create function button",
    key: "lambda.create-function",
    priority: "P0",
  },
  {
    component: "LambdaPage",
    context: "Refresh button aria label",
    key: "button.refresh",
    priority: "P0",
  },
  {
    component: "LambdaPage",
    context: "Bulk actions dropdown label",
    key: "lambda.bulk-actions",
    priority: "P1",
  },
  {
    component: "LambdaPage",
    context: "Table empty message — no functions",
    key: "lambda.empty.no-functions",
    priority: "P0",
  },
  {
    component: "LambdaPage",
    context: "Table empty message — filtered",
    key: "lambda.empty.filtered",
    priority: "P0",
  },
  {
    component: "LambdaPage",
    context: "Invoke payload label",
    key: "lambda.invoke.payload",
    priority: "P0",
  },
  {
    component: "LambdaPage",
    context: "Invoke result label",
    key: "lambda.invoke.result",
    priority: "P0",
  },

  // S3 page
  {
    component: "S3BucketsPage",
    context: "Create bucket button",
    key: "s3.create-bucket",
    priority: "P0",
  },
  {
    component: "S3BucketsPage",
    context: "Refresh button aria label",
    key: "button.refresh",
    priority: "P0",
  },
  {
    component: "S3BucketsPage",
    context: "Link aria label — view bucket",
    key: "s3.view-bucket",
    priority: "P0",
  },
  {
    component: "S3BucketsPage",
    context: "Table empty title",
    key: "s3.empty.title",
    priority: "P0",
  },
  {
    component: "S3BucketsPage",
    context: "Table empty description",
    key: "s3.empty.description",
    priority: "P0",
  },

  // IAM page
  { component: "IAMPage", context: "Create User button", key: "iam.create-user", priority: "P0" },
  { component: "IAMPage", context: "Create Role button", key: "iam.create-role", priority: "P0" },
  { component: "IAMPage", context: "View button", key: "button.view", priority: "P0" },
  {
    component: "IAMPage",
    context: "Attach Policy button",
    key: "iam.attach-policy",
    priority: "P0",
  },
  { component: "IAMPage", context: "Delete button", key: "button.delete", priority: "P0" },
  { component: "IAMPage", context: "Detach button", key: "iam.detach-policy", priority: "P0" },
  {
    component: "IAMPage",
    context: "Modal header — Create IAM User",
    key: "iam.modal.create-user",
    priority: "P0",
  },
  {
    component: "IAMPage",
    context: "Modal header — Create IAM Role",
    key: "iam.modal.create-role",
    priority: "P0",
  },
  {
    component: "IAMPage",
    context: "Modal header — Attach Policy",
    key: "iam.modal.attach-policy",
    priority: "P0",
  },
  { component: "IAMPage", context: "Table empty — users", key: "iam.empty.users", priority: "P0" },
  { component: "IAMPage", context: "Table empty — roles", key: "iam.empty.roles", priority: "P0" },
  {
    component: "IAMPage",
    context: "Table empty — policies",
    key: "iam.empty.policies",
    priority: "P0",
  },
  { component: "IAMPage", context: "No groups assigned", key: "iam.empty.groups", priority: "P1" },
  {
    component: "IAMPage",
    context: "No attached policies",
    key: "iam.empty.policies-attached",
    priority: "P1",
  },

  // DynamoDB page
  {
    component: "DynamoDBPage",
    context: "Table headers / actions",
    key: "dynamodb.table-columns",
    priority: "P0",
  },

  // VPC page
  { component: "VPCPage", context: "Create VPC button", key: "vpc.create-vpc", priority: "P0" },

  // RDS page
  {
    component: "RDSPage",
    context: "Launch instance / database buttons",
    key: "rds.create-db",
    priority: "P0",
  },

  // Notifications
  {
    component: "NotificationProvider",
    context: "Notification dismiss action",
    key: "notification.dismiss",
    priority: "P1",
  },
];
