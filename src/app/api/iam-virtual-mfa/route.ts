import { NextResponse } from "next/server";
import {
  ListVirtualMFADevicesCommand,
  CreateVirtualMFADeviceCommand,
  DeleteVirtualMFADeviceCommand,
} from "@aws-sdk/client-iam";
import { iam } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await iam.send(new ListVirtualMFADevicesCommand({}));
    return NextResponse.json({ mfaDevices: res.VirtualMFADevices || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await iam.send(new CreateVirtualMFADeviceCommand({ VirtualMFADeviceName: body.name }));
    return NextResponse.json({ device: res.VirtualMFADevice });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    await iam.send(new DeleteVirtualMFADeviceCommand({ SerialNumber: searchParams.get("serialNumber")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
