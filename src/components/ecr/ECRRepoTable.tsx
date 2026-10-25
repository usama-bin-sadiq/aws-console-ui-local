/**
 * ECRRepoTable — ECR repository list.
 */

import React from "react";
import Table from "@cloudscape-design/components/table";
import Pagination from "@cloudscape-design/components/pagination";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";

export interface ECRRepoTableProps {
  readonly repos?: Array<Record<string, unknown>>;
  readonly loading?: boolean;
  readonly onRefresh?: () => void;
}

export function ECRRepoTable({
  repos = [],
  loading = false,
  onRefresh,
}: ECRRepoTableProps): React.ReactElement {
  const columnDefinitions: any[] = [
    {
      id: "name",
      header: "Repository",
      cell: (item: Record<string, unknown>) => String(item.RepositoryName || item.name || "-"),
    },
    {
      id: "uri",
      header: "URI",
      cell: (item: Record<string, unknown>) => String(item.RepositoryUri || item.uri || "-"),
    },
  ];

  return (
    <SpaceBetween size="m" direction="vertical">
      <Table
        items={repos}
        columnDefinitions={columnDefinitions}
        loading={loading}
        empty={<div>No repositories found</div>}
        header={<h2>ECR Repositories</h2>}
        pagination={<Pagination currentPageIndex={1} pagesCount={1} />}
      />
      <Button onClick={onRefresh}>Refresh</Button>
    </SpaceBetween>
  );
}
