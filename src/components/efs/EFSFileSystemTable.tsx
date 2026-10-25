import Header from "@cloudscape-design/components/header";
/**
 * EFSFileSystemTable — EFS file system list.
 */

import React from "react";
import Table from "@cloudscape-design/components/table";
import Pagination from "@cloudscape-design/components/pagination";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";

export interface EFSFileSystemTableProps {
  readonly fileSystems?: Array<Record<string, unknown>>;
  readonly loading?: boolean;
  readonly onRefresh?: () => void;
}

export function EFSFileSystemTable({
  fileSystems = [],
  loading = false,
  onRefresh,
}: EFSFileSystemTableProps): React.ReactElement {
  const columnDefinitions: any[] = [
    {
      id: "id",
      header: "File System ID",
      cell: (item: Record<string, unknown>) => String(item.FileSystemId || item.id || "-"),
    },
    {
      id: "name",
      header: "Name",
      cell: (item: Record<string, unknown>) => String(item.Name || item.name || "-"),
    },
    {
      id: "performance",
      header: "Performance Mode",
      cell: (item: Record<string, unknown>) =>
        String(item.PerformanceMode || item.performance || "-"),
    },
  ];

  return (
    <SpaceBetween size="m" direction="vertical">
      <Table
        items={fileSystems}
        columnDefinitions={columnDefinitions}
        loading={loading}
        empty={<div>No file systems found</div>}
        header={<Header variant="h2">EFS File Systems</Header>}
        pagination={<Pagination currentPageIndex={1} pagesCount={1} />}
      />
      <Button onClick={onRefresh}>Refresh</Button>
    </SpaceBetween>
  );
}
