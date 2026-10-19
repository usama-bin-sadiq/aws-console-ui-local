import { NextResponse } from "next/server";
import {
  DescribeNatGatewaysCommand,
  CreateNatGatewayCommand,
  DeleteNatGatewayCommand,
  EC2Client,
} from "@aws-sdk/client-ec2";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const ec2Client = getUserClientFromRequest(EC2Client, request);
    const res = await ec2Client.send(new DescribeNatGatewaysCommand({}));
    return NextResponse.json({ natGateways: res.NatGateways || [] });
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
      new CreateNatGatewayCommand({
        SubnetId: body.subnetId,
        ConnectivityType: body.connectivityType || "private",
        AllocationId: body.allocationId || undefined,
      }),
    );
    return NextResponse.json({ natGateway: res.NatGateway });
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
    await ec2Client.send(
      new DeleteNatGatewayCommand({ NatGatewayId: searchParams.get("natGatewayId")! }),
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
