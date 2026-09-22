import { NextResponse } from "next/server";
import {
  Route53Client,
  ListHostedZonesCommand,
  ListResourceRecordSetsCommand,
  ChangeResourceRecordSetsCommand,
  CreateHostedZoneCommand,
  DeleteHostedZoneCommand,
  CreateHealthCheckCommand,
  ListHealthChecksCommand,
  UpdateHealthCheckCommand,
  DeleteHealthCheckCommand,
} from "@aws-sdk/client-route-53";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const route53Client = getUserClientFromRequest(Route53Client, request);
    const { searchParams } = new URL(request.url);
    const healthOnly = searchParams.get("healthOnly");
    if (healthOnly === "true") {
      const res = await route53Client.send(new ListHealthChecksCommand({}));
      return NextResponse.json({ healthChecks: res.HealthChecks || [], adapterClient: "route53" });
    }
    const zonesRes = await route53Client.send(new ListHostedZonesCommand({}));
    const zones = [];
    for (const zone of zonesRes.HostedZones || []) {
      const records = await route53Client.send(new ListResourceRecordSetsCommand({
        HostedZoneId: zone.Id,
      }));
      zones.push({ ...zone, records: records.ResourceRecordSets || [] });
    }
    return NextResponse.json({ zones, adapterClient: "route53" });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const route53Client = getUserClientFromRequest(Route53Client, request);
    const body = await request.json();
    if (body.action === "createZone") {
      const res = await route53Client.send(new CreateHostedZoneCommand({
        Name: body.name,
        CallerReference: body.callerReference || Date.now().toString(),
        VPC: body.vpc ? { VPCRegion: body.vpc.vpcRegion || "us-east-1", VPCId: body.vpc.vpcId || "vpc-default" } : undefined,
      }));
      return NextResponse.json({ zone: res.HostedZone, adapterClient: "route53" });
    }
    if (body.action === "createRecord") {
      await route53Client.send(new ChangeResourceRecordSetsCommand({
        HostedZoneId: body.hostedZoneId,
        ChangeBatch: {
          Changes: [{
            Action: "CREATE",
            ResourceRecordSet: body.resourceRecordSet,
          }],
        },
      }));
      return NextResponse.json({ success: true, adapterClient: "route53" });
    }
    if (body.action === "createHealthCheck") {
      const res = await route53Client.send(new CreateHealthCheckCommand({
        CallerReference: body.callerReference || Date.now().toString(),
        HealthCheckConfig: body.healthCheckConfig || {
          IPAddress: body.ipAddress || "127.0.0.1",
          Port: body.port || 80,
          Type: body.type || "HTTP",
          ResourcePath: body.resourcePath || "/",
          FullyQualifiedDomainName: body.fqdn || "example.com",
        },
      }));
      return NextResponse.json({ healthCheck: res.HealthCheck, adapterClient: "route53" });
    }
    if (body.action === "updateHealthCheck") {
      const res = await route53Client.send(new UpdateHealthCheckCommand({
        HealthCheckId: body.healthCheckId,
        FullyQualifiedDomainName: body.fqdn,
        IPAddress: body.ipAddress,
        Port: body.port,
        ResourcePath: body.resourcePath,
      }));
      return NextResponse.json({ healthCheck: res.HealthCheck, adapterClient: "route53" });
    }
    return NextResponse.json({ error: "Unknown action. Supported: createZone, createRecord, createHealthCheck, updateHealthCheck", adapterClient: "route53" }, { status: 400 });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const route53Client = getUserClientFromRequest(Route53Client, request);
    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get("zoneId");
    const healthCheckId = searchParams.get("healthCheckId");
    if (healthCheckId) {
      await route53Client.send(new DeleteHealthCheckCommand({ HealthCheckId: healthCheckId }));
      return NextResponse.json({ success: true, adapterClient: "route53" });
    }
    await route53Client.send(new DeleteHostedZoneCommand({ Id: zoneId! }));
    return NextResponse.json({ success: true, adapterClient: "route53" });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
