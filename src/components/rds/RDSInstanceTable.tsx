import Header from "@cloudscape-design/components/header";
/**
 * RDSInstanceTable — RDS instance list.
 */

import React from "react";
import Table from "@cloudscape-design/components/table";
import Pagination from "@cloudscape-design/components/pagination";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";

export interface RDSInstanceTableProps {
  readonly instances?: Array<Record<string, unknown>>;
  readonly loading?: boolean;
  readonly onRefresh?: () => void;
}

export function RDSInstanceTable({
  instances = [],
  loading = false,
  onRefresh,
}: RDSInstanceTableProps): React.ReactElement {
  const columnDefinitions: any[] = [
    {
      id: "id",
      header: "DB Identifier",
      cell: (item: Record<string, unknown>) => String(item.DBInstanceIdentifier || item.id || "-"),
    },
    {
      id: "engine",
      header: "Engine",
      cell: (item: Record<string, unknown>) => String(item.Engine || item.engine || "-"),
    },
    {
      id: "status",
      header: "Status",
      cell: (item: Record<string, unknown>) => String(item.DBInstanceStatus || item.status || "-"),
    },
  ];
  return (
    <SpaceBetween size="m" direction="vertical">
      <Table
        items={instances}
        columnDefinitions={columnDefinitions}
        loading={loading}
        empty={<div>No RDS instances found</div>}
        header={<Header variant="h2">RDS Instances</Header>}
        pagination={<Pagination currentPageIndex={1} pagesCount={1} />}
      />
      <Button onClick={onRefresh}>Refresh</Button>
    </SpaceBetween>
  );
}
