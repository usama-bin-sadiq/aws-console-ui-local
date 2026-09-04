import { NextResponse } from "next/server";
import { GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import { sts } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await sts.send(new GetCallerIdentityCommand({}));
    return NextResponse.json({
      identity: { Account: res.Account, UserId: res.UserId, Arn: res.Arn },
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
