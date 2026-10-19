import { NextRequest, NextResponse } from "next/server";
import { getRecentlyVisitedAsync, addRecentlyVisitedAsync } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId") || "default";
    const limit = parseInt(searchParams.get("limit") || "5");

    const recentlyVisited = await getRecentlyVisitedAsync(userId, limit);

    return NextResponse.json({ recentlyVisited });
  } catch (error) {
    console.error("Error fetching recently visited:", error);
    return NextResponse.json({ error: "Failed to fetch recently visited" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId = "default", serviceId, serviceName, serviceHref } = body;

    if (!serviceId || !serviceName || !serviceHref) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await addRecentlyVisitedAsync(userId, serviceId, serviceName, serviceHref);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding recently visited:", error);
    return NextResponse.json({ error: "Failed to add recently visited" }, { status: 500 });
  }
}
