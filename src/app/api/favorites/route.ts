import { NextRequest, NextResponse } from "next/server";
import { getFavoritesAsync, addFavoriteAsync, removeFavoriteAsync } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId") || "default";
    
    const favorites = await getFavoritesAsync(userId);
    
    return NextResponse.json({ favorites });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return NextResponse.json(
      { error: "Failed to fetch favorites" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId = "default", serviceId, serviceName, serviceHref } = body;

    if (!serviceId || !serviceName || !serviceHref) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await addFavoriteAsync(userId, serviceId, serviceName, serviceHref);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding favorite:", error);
    return NextResponse.json(
      { error: "Failed to add favorite" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId") || "default";
    const serviceId = searchParams.get("serviceId");

    if (!serviceId) {
      return NextResponse.json(
        { error: "Missing serviceId" },
        { status: 400 }
      );
    }

    await removeFavoriteAsync(userId, serviceId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing favorite:", error);
    return NextResponse.json(
      { error: "Failed to remove favorite" },
      { status: 500 }
    );
  }
}