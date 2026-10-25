/**
 * CognitoComponent — User pool list.
 */

import React from "react";
import Table from "@cloudscape-design/components/table";
import Pagination from "@cloudscape-design/components/pagination";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";

export interface CognitoComponentProps {
  readonly pools?: Array<Record<string, unknown>>;
  readonly loading?: boolean;
  readonly onRefresh?: () => void;
}

export function CognitoComponent({
  pools = [],
  loading = false,
  onRefresh,
}: CognitoComponentProps): React.ReactElement {
  const columnDefinitions: any[] = [
    {
      id: "name",
      header: "Pool Name",
      cell: (item: Record<string, unknown>) => String(item.PoolName || item.name || "-"),
    },
    {
      id: "id",
      header: "Pool ID",
      cell: (item: Record<string, unknown>) => String(item.Id || item.id || "-"),
    },
  ];
  return (
    <SpaceBetween size="m" direction="vertical">
      <Table
        items={pools}
        columnDefinitions={columnDefinitions}
        loading={loading}
        empty={<div>No user pools found</div>}
        header={<h2>Cognito User Pools</h2>}
        pagination={<Pagination currentPageIndex={1} pagesCount={1} />}
      />
      <Button onClick={onRefresh}>Refresh</Button>
    </SpaceBetween>
  );
}
