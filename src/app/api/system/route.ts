import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const res = await fetch("http://localhost:4566/_ministack/health");
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({ provider: "ministack", ...data });
    }
  } catch {}
  try {
    const res = await fetch("http://localhost:4566/_localstack/health");
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({ provider: "localstack", ...data });
    }
  } catch {}
  return NextResponse.json({ provider: "unknown", status: "unreachable" }, { status: 503 });
}
