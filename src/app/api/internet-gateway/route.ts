// VERIFICATION GATE: Phase 4 VPC Full — IGW CRUD + Attach/Detach
// Commands: @aws-sdk/client-ec2 (DescribeInternetGateways, CreateInternetGateway,
// DeleteInternetGateway, AttachInternetGateway, DetachInternetGateway)
import { NextResponse } from "next/server";
import {
  EC2Client,
  DescribeInternetGatewaysCommand,
  CreateInternetGatewayCommand,
  DeleteInternetGatewayCommand,
  AttachInternetGatewayCommand,
  DetachInternetGatewayCommand,
} from "@aws-sdk/client-ec2";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const ec2Client = getUserClientFromRequest(EC2Client, request);
    const res = await ec2Client.send(new DescribeInternetGatewaysCommand({}));
    return NextResponse.json({ internetGateways: res.InternetGateways || [] });
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
    if (body.action === "attach") {
      await ec2Client.send(
        new AttachInternetGatewayCommand({ InternetGatewayId: body.igwId, VpcId: body.vpcId }),
      );
      return NextResponse.json({ success: true });
    }
    if (body.action === "detach") {
      await ec2Client.send(
        new DetachInternetGatewayCommand({ InternetGatewayId: body.igwId, VpcId: body.vpcId }),
      );
      return NextResponse.json({ success: true });
    }
    // default: create
    const res = await ec2Client.send(new CreateInternetGatewayCommand({}));
    return NextResponse.json({ internetGateway: res.InternetGateway });
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
      new DeleteInternetGatewayCommand({ InternetGatewayId: searchParams.get("igwId")! }),
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
