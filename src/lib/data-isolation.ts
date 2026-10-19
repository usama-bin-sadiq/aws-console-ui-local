/**
 * Data isolation helpers for API routes.
 * Filters resources by the authenticated user.
 */

import { extractUserCredentials } from "@/lib/aws-clients";
import { getSessionFromRequest } from "@/lib/session-store";
import { getUserByUsernameAsync, getUserPermissionsAsync } from "@/lib/db";
import { NextResponse } from "next/server";

export interface UserContext {
  username: string;
  isSuperAdmin: boolean;
  region: string;
}

/**
 * Extracts user context from request headers.
 * Use this in every API route to determine who is making the request.
 * The isSuperAdmin flag is resolved from the database, not from client headers.
 */
export async function getUserContext(request: Request): Promise<UserContext> {
  const session = await getSessionFromRequest(request);
  const { region } = extractUserCredentials(request);
  const username = session?.username || "anonymous";
  const user = username === "anonymous" ? undefined : await getUserByUsernameAsync(username);
  const isSuperAdmin = user?.is_root === 1;
  return { username, isSuperAdmin, region };
}

/**
 * Checks if the user has permission for a given action.
 * Root/super admin users have all permissions.
 * Non-root users need matching permission entries.
 */
export function userHasPermission(
  user: UserContext,
  permissions: string[],
  action: string,
): boolean {
  if (user.isSuperAdmin) return true;
  if (permissions.includes("*")) return true;
  // Check for exact match or wildcard prefix
  return (
    permissions.includes(action) ||
    permissions.some((p) => {
      if (p.endsWith(":*")) return action.startsWith(p.replace(":*", ":"));
      if (p === "*") return true;
      return false;
    })
  );
}

/**
 * Tags a resource with the creating user's identity.
 * Returns a TagSet with an owner tag.
 */
export function ownerTag(username: string): { Key: string; Value: string }[] {
  return [{ Key: "aws-console-owner", Value: username }];
}

/**
 * Checks if a resource belongs to the given user.
 * Resources tagged with aws-console-owner are user-scoped.
 * Resources without the tag are considered shared (visible to all).
 */
export function isOwnedByUser(
  resource: { Tags?: Array<{ Key?: string; Value?: string }> },
  username: string,
): boolean {
  if (!resource.Tags) return true; // No owner tag = shared
  const ownerTag = resource.Tags.find((t) => t.Key === "aws-console-owner");
  if (!ownerTag) return true; // No owner tag = shared
  return ownerTag.Value === username;
}

/**
 * Filters a list of resources to only those owned by the user.
 * Root/super admin sees everything.
 */
export function filterByOwner<T extends { Tags?: Array<{ Key?: string; Value?: string }> }>(
  resources: T[],
  user: UserContext,
): T[] {
  if (user.isSuperAdmin) return resources;
  return resources.filter((r) => isOwnedByUser(r, user.username));
}

// ─── Permission enforcement ───────────────────────────────────────────────────

/**
 * Maps API route paths to their required permission service names.
 * Format: { service:read } for GET, { service:write } for POST/PUT/DELETE.
 */
const ROUTE_PERMISSION_MAP: Record<string, string> = {
  s3: "s3",
  "s3-files": "s3",
  s3control: "s3control",
  ec2: "ec2",
  "ec2-vpc-peering": "ec2",
  "ec2-vpc-endpoint": "ec2",
  lambda: "lambda",
  rds: "rds",
  iam: "iam",
  "iam-access-key": "iam",
  "iam-group": "iam",
  "iam-instance-profile": "iam",
  "iam-password-policy": "iam",
  "iam-saml": "iam",
  "iam-openid-connect": "iam",
  "iam-virtual-mfa": "iam",
  "iam/credential-report": "iam",
  dynamodb: "dynamodb",
  sqs: "sqs",
  sns: "sns",
  cloudwatch: "cloudwatch",
  "cloudwatch-logs": "cloudwatch",
  cloudfront: "cloudfront",
  cloudformation: "cloudformation",
  cloudtrail: "cloudtrail",
  cloudcontrol: "cloudcontrol",
  route53: "route53",
  route53resolver: "route53",
  apigateway: "apigateway",
  apigatewayv2: "apigateway",
  ecs: "ecs",
  eks: "eks",
  efs: "efs",
  elasticache: "elasticache",
  "elastic-ip": "ec2",
  emr: "emr",
  eventbridge: "eventbridge",
  firehose: "firehose",
  glue: "glue",
  guardduty: "guardduty",
  inspector: "inspector",
  iot: "iot",
  "iot-analytics": "iot",
  kinesis: "kinesis",
  kms: "kms",
  memorydb: "memorydb",
  msk: "msk",
  "nat-gateway": "ec2",
  "network-acl": "ec2",
  opensearch: "opensearch",
  organizations: "organizations",
  pinpoint: "pinpoint",
  pipes: "pipes",
  redshift: "redshift",
  "resource-groups": "resourcegroups",
  "resource-groups-tagging": "resourcegroups",
  "route-table": "ec2",
  sagemaker: "sagemaker",
  scheduler: "scheduler",
  "secrets-manager": "secretsmanager",
  "security-group": "ec2",
  "security-hub": "securityhub",
  ses: "ses",
  sesv2: "ses",
  servicediscovery: "servicediscovery",
  sfn: "sfn",
  snapshot: "ec2",
  ssm: "ssm",
  sts: "sts",
  subnet: "ec2",
  system: "system",
  terminal: "terminal",
  transfer: "transfer",
  "transit-gateway": "ec2",
  "verified-access": "verifiedaccess",
  volume: "ec2",
  vpc: "ec2",
  vpn: "ec2",
  wafv2: "wafv2",
  xray: "xray",
  amplify: "amplify",
  "app-auto-scaling": "autoscaling",
  appconfig: "appconfig",
  appsync: "appsync",
  athena: "athena",
  "auto-scaling": "autoscaling",
  backup: "backup",
  batch: "batch",
  bedrock: "bedrock",
  "bedrock-agent": "bedrock",
  "bedrock-runtime": "bedrock",
  cognito: "cognito",
  "code-deploy": "codedeploy",
  codebuild: "codebuild",
  codepipeline: "codepipeline",
  config: "config",
  ami: "ec2",
  "launch-template": "ec2",
};

/**
 * Resolves the permission service name from a request URL path.
 * Returns null if the route has no permission mapping.
 */
function resolvePermissionService(url: string): string | null {
  const pathname = new URL(url).pathname; // e.g. "/api/s3" or "/api/s3-files"
  const segments = pathname.split("/").filter(Boolean); // ["api", "s3-files"]
  if (segments.length < 2) return null;
  const routeKey = segments.slice(1).join("/"); // "s3-files" or "iam/credential-report"
  return ROUTE_PERMISSION_MAP[routeKey] ?? null;
}

/**
 * Checks whether the authenticated user has the required permission for the route.
 * Returns null if allowed, or a NextResponse 403 if denied.
 *
 * MUST be called at the top of every route handler (GET, POST, PUT, DELETE).
 * Does NOT consume request.json() — only reads headers.
 *
 * Usage:
 *   const denied = await requirePermission(request, "GET");
 *   if (denied) return denied;
 */
export async function requirePermission(
  request: Request,
  method: string,
): Promise<NextResponse | null> {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (method !== "GET") {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    if (origin && host) {
      try {
        if (new URL(origin).host !== host) {
          return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
      }
    }
  }

  const user = await getUserContext(request);

  // Root / super admin bypasses all permission checks
  if (user.isSuperAdmin) return null;

  const service = resolvePermissionService(request.url);
  // Unmapped routes are allowed (should not happen if mapping is complete)
  if (!service) return null;

  const permissionType = method === "GET" ? "read" : "write";
  const requiredPermission = `${service}:${permissionType}`;

  // Get permissions from DB
  const permissions = await getUserPermissionsAsync(user.username);

  // Wildcard check
  if (permissions.includes("*")) return null;

  // Check permission using the existing helper
  if (userHasPermission(user, permissions, requiredPermission)) return null;

  return NextResponse.json(
    {
      error: "Forbidden",
      message: `You do not have permission to perform this action. Required: ${requiredPermission}`,
      required: requiredPermission,
    },
    { status: 403 },
  );
}
