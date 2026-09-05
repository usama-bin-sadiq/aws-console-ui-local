import { NextResponse } from "next/server";
import { DescribeCacheClustersCommand } from "@aws-sdk/client-elasticache";
import { elasticache } from "@/lib/aws-clients";

export async function GET(): Promise<NextResponse> {
    try {
        const response = await elasticache.send(new DescribeCacheClustersCommand({ MaxRecords: 100, ShowCacheNodeInfo: true }));
        return NextResponse.json({ clusters: response.CacheClusters ?? [] });
    } catch (error: unknown) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to list ElastiCache clusters" }, { status: 502 });
    }
}
