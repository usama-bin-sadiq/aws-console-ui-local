import { NextResponse } from "next/server";

export async function GET() {
  const endpointUrl = process.env.AWS_ENDPOINT_URL || "http://localhost:4566";

  // Try Ministack first
  try {
    const ministackResponse = await fetch(`${endpointUrl}/_ministack/health`, {
      signal: AbortSignal.timeout(2000),
    });

    if (ministackResponse.ok) {
      return NextResponse.json({
        provider: "ministack",
        status: "healthy",
      });
    }
  } catch (error) {
    // Ministack not available, try LocalStack
  }

  // Try LocalStack
  try {
    const localstackResponse = await fetch(
      `${endpointUrl}/_localstack/health`,
      {
        signal: AbortSignal.timeout(2000),
      }
    );

    if (localstackResponse.ok) {
      const data = await localstackResponse.json();
      return NextResponse.json({
        provider: "localstack",
        status: "healthy",
        services: data.services || {},
      });
    }
  } catch (error) {
    // LocalStack not available
  }

  // Neither provider is available
  return NextResponse.json(
    {
      provider: "unknown",
      status: "unreachable",
      error: "Could not reach Ministack or LocalStack",
    },
    { status: 503 }
  );
}
