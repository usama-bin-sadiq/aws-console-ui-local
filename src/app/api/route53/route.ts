import { NextResponse } from "next/server";
import { ListHostedZonesCommand, ListResourceRecordSetsCommand, ChangeResourceRecordSetsCommand, CreateHostedZoneCommand, DeleteHostedZoneCommand } from "@aws-sdk/client-route-53";
import { route53 } from "@/lib/aws-clients";

export async function GET() {
  try {
    const zonesRes = await route53.send(new ListHostedZonesCommand({}));
    const zones = [];
    for (const zone of zonesRes.HostedZones || []) {
      const records = await route53.send(new ListResourceRecordSetsCommand({
        HostedZoneId: zone.Id,
      }));
      zones.push({ ...zone, records: records.ResourceRecordSets || [] });
    }
    return NextResponse.json({ zones });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "createZone") {
      const res = await route53.send(new CreateHostedZoneCommand({
        Name: body.name,
        CallerReference: Date.now().toString(),
      }));
      return NextResponse.json({ zone: res.HostedZone });
    }
    if (body.action === "createRecord") {
      await route53.send(new ChangeResourceRecordSetsCommand({
        HostedZoneId: body.hostedZoneId,
        ChangeBatch: {
          Changes: [{
            Action: "CREATE",
            ResourceRecordSet: body.resourceRecordSet,
          }],
        },
      }));
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get("zoneId");
    await route53.send(new DeleteHostedZoneCommand({ Id: zoneId! }));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
