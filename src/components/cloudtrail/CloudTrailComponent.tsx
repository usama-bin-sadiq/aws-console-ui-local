/**
 * CloudTrailComponent — Trail list.
 */

import React, { useState } from "react";
import Table from "@cloudscape-design/components/table";
import Pagination from "@cloudscape-design/components/pagination";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";

export interface CloudTrailComponentProps {
  readonly trails?: Array<Record<string, unknown>>;
  readonly loading?: boolean;
  readonly onRefresh?: () => void;
}

export function CloudTrailComponent({
  trails = [],
  loading = false,
  onRefresh,
}: CloudTrailComponentProps): React.ReactElement {
  const columnDefinitions: any[] = [
    {
      id: "name",
      header: "Trail Name",
      cell: (item: Record<string, unknown>) => String(item.Name || item.name || "-"),
    },
    {
      id: "region",
      header: "Region",
      cell: (item: Record<string, unknown>) => String(item.HomeRegion || item.region || "-"),
    },
  ];
  return (
    <SpaceBetween size="m" direction="vertical">
      <Table
        items={trails}
        columnDefinitions={columnDefinitions}
        loading={loading}
        empty={<div>No trails found</div>}
        header={<h2>CloudTrail Trails</h2>}
        pagination={<Pagination currentPageIndex={1} pagesCount={1} />}
      />
      <Button onClick={onRefresh}>Refresh</Button>
    </SpaceBetween>
  );
}
