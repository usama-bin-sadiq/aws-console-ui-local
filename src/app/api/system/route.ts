import { NextResponse } from "next/server";

export async function GET() {
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
