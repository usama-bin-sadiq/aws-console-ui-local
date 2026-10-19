/**
 * EC2LoadBalancerTable — ALB/NLB/CLB list.
 */

import React, { useState } from "react";
import Table from "@cloudscape-design/components/table";
import Pagination from "@cloudscape-design/components/pagination";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";

export interface EC2LoadBalancerTableProps {
  readonly balancers?: Array<Record<string, unknown>>;
  readonly loading?: boolean;
  readonly onRefresh?: () => void;
}

export function EC2LoadBalancerTable({
  balancers = [],
  loading = false,
  onRefresh,
}: EC2LoadBalancerTableProps): React.ReactElement {
  const columnDefinitions: any[] = [
    {
      id: "dns",
      header: "DNS Name",
      cell: (item: Record<string, unknown>) => String(item.DNSName || item.dns || "-"),
    },
    {
      id: "type",
      header: "Type",
      cell: (item: Record<string, unknown>) => String(item.Type || item.type || "-"),
    },
    {
      id: "arn",
      header: "ARN",
      cell: (item: Record<string, unknown>) => String(item.LoadBalancerArn || item.arn || "-"),
    },
    {
      id: "state",
      header: "State",
      cell: (item: Record<string, unknown>) =>
        String((item.State as Record<string, unknown>)?.Code || "-"),
    },
  ];

  return (
    <SpaceBetween size="m" direction="vertical">
      <Table
        items={balancers}
        columnDefinitions={columnDefinitions}
        loading={loading}
        empty={<div>No load balancers found</div>}
        header={<h2>Load Balancers</h2>}
        pagination={<Pagination currentPageIndex={1} pagesCount={1} />}
      />
      <Button onClick={onRefresh}>Refresh</Button>
    </SpaceBetween>
  );
}
