import { NextResponse } from "next/server";
import { DescribeVolumesCommand, CreateVolumeCommand, DeleteVolumeCommand } from "@aws-sdk/client-ec2";
import { ec2 } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await ec2.send(new DescribeVolumesCommand({}));
    return NextResponse.json({ volumes: res.Volumes || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await ec2.send(new CreateVolumeCommand({
      AvailabilityZone: body.az || "us-east-1a",
      Size: body.size || 20,
      VolumeType: body.volumeType || "gp3",
    }));
    return NextResponse.json({ volume: res });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    await ec2.send(new DeleteVolumeCommand({ VolumeId: searchParams.get("volumeId")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
