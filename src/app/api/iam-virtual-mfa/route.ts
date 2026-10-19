import { NextResponse } from "next/server";
import {
  IAMClient,
  ListVirtualMFADevicesCommand,
  CreateVirtualMFADeviceCommand,
  DeleteVirtualMFADeviceCommand,
} from "@aws-sdk/client-iam";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const iamClient = getUserClientFromRequest(IAMClient, request);
    const res = await iamClient.send(new ListVirtualMFADevicesCommand({}));
    return NextResponse.json({ mfaDevices: res.VirtualMFADevices || [] });
  } catch (error) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const iamClient = getUserClientFromRequest(IAMClient, request);
    const body = await request.json();
    const res = await iamClient.send(
      new CreateVirtualMFADeviceCommand({ VirtualMFADeviceName: body.name }),
    );
    return NextResponse.json({ device: res.VirtualMFADevice });
  } catch (error) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const iamClient = getUserClientFromRequest(IAMClient, request);
    const { searchParams } = new URL(request.url);
    await iamClient.send(
      new DeleteVirtualMFADeviceCommand({ SerialNumber: searchParams.get("serialNumber")! }),
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
