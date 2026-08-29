import { NextRequest, NextResponse } from "next/server";
import { getWidgetConfig, updateWidgetConfig, resetWidgetConfig } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId") || "default";
    
    const widgets = getWidgetConfig(userId);
    
    return NextResponse.json({ widgets });
  } catch (error) {
    console.error("Error fetching widgets:", error);
    return NextResponse.json(
      { error: "Failed to fetch widgets" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId = "default", widgetId, updates } = body;

    if (!widgetId || !updates) {
      return NextResponse.json(
        { error: "Missing widgetId or updates" },
        { status: 400 }
      );
    }

    updateWidgetConfig(userId, widgetId, updates);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating widget:", error);
    return NextResponse.json(
      { error: "Failed to update widget" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId = "default" } = body;

    if (action === "reset") {
      resetWidgetConfig(userId);
      const widgets = getWidgetConfig(userId);
      return NextResponse.json({ widgets });
    }

    return NextResponse.json(
      { error: "Unknown action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error performing widget action:", error);
    return NextResponse.json(
      { error: "Failed to perform action" },
      { status: 500 }
    );
  }
}
