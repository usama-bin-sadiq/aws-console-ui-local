import { NextResponse } from "next/server";
import { DescribeCacheClustersCommand, ElastiCacheClient } from "@aws-sdk/client-elasticache";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request): Promise<NextResponse> {
    const denied = await requirePermission(request, "GET");
    if (denied) return denied;
    try {
        const elasticacheClient = getUserClientFromRequest(ElastiCacheClient, request);
        const response = await elasticacheClient.send(new DescribeCacheClustersCommand({ MaxRecords: 100, ShowCacheNodeInfo: true }));
        return NextResponse.json({ clusters: response.CacheClusters ?? [] });
    } catch (error: unknown) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to list ElastiCache clusters" }, { status: 502 });
    }
}
