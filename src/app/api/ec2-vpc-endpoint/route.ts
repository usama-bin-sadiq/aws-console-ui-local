import { NextResponse } from "next/server";
import {
  EC2Client,
  DescribeVpcEndpointsCommand,
  CreateVpcEndpointCommand,
  DeleteVpcEndpointsCommand,
} from "@aws-sdk/client-ec2";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const ec2Client = getUserClientFromRequest(EC2Client, request);
    const res = await ec2Client.send(new DescribeVpcEndpointsCommand({}));
    return NextResponse.json({ vpcEndpoints: res.VpcEndpoints || [] });
  } catch (error) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const ec2Client = getUserClientFromRequest(EC2Client, request);
    const body = await request.json();
    const res = await ec2Client.send(
      new CreateVpcEndpointCommand({
        VpcId: body.vpcId,
        ServiceName: body.serviceName,
        VpcEndpointType: body.type || "Interface",
      }),
    );
    return NextResponse.json({ vpcEndpoint: res.VpcEndpoint });
  } catch (error) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const ec2Client = getUserClientFromRequest(EC2Client, request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("vpcEndpointId")!;
    await ec2Client.send(new DeleteVpcEndpointsCommand({ VpcEndpointIds: [id] }));
    return NextResponse.json({ success: true });
  } catch (error) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
