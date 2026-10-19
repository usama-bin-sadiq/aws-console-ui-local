import { NextResponse } from "next/server";
import { DescribeImagesCommand, DeregisterImageCommand, EC2Client } from "@aws-sdk/client-ec2";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const ec2Client = getUserClientFromRequest(EC2Client, request);
    const res = await ec2Client.send(new DescribeImagesCommand({ Owners: ["self"] }));
    return NextResponse.json({ images: res.Images || [] });
  } catch (error: unknown) {
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
    await ec2Client.send(new DeregisterImageCommand({ ImageId: searchParams.get("imageId")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
