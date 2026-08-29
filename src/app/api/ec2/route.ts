import { NextResponse } from "next/server";
import { DescribeInstancesCommand, StartInstancesCommand, StopInstancesCommand, TerminateInstancesCommand } from "@aws-sdk/client-ec2";
import { ec2 } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await ec2.send(new DescribeInstancesCommand({}));
    const instances = [];
    for (const reservation of res.Reservations || []) {
      for (const instance of reservation.Instances || []) {
        instances.push(instance);
      }
    }
    return NextResponse.json({ instances });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "start") {
      await ec2.send(new StartInstancesCommand({ InstanceIds: body.instanceIds }));
      return NextResponse.json({ success: true });
    }
    if (body.action === "stop") {
      await ec2.send(new StopInstancesCommand({ InstanceIds: body.instanceIds }));
      return NextResponse.json({ success: true });
    }
    if (body.action === "terminate") {
      await ec2.send(new TerminateInstancesCommand({ InstanceIds: body.instanceIds }));
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
