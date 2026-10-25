import Header from "@cloudscape-design/components/header";
/**
 * IAMUserTable — IAM user list.
 */

import React from "react";
import Table from "@cloudscape-design/components/table";
import Pagination from "@cloudscape-design/components/pagination";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";

export interface IAMUserTableProps {
  readonly users?: Array<Record<string, unknown>>;
  readonly loading?: boolean;
  readonly onRefresh?: () => void;
}

export function IAMUserTable({
  users = [],
  loading = false,
  onRefresh,
}: IAMUserTableProps): React.ReactElement {
  const columnDefinitions: any[] = [
    {
      id: "name",
      header: "User Name",
      cell: (item: Record<string, unknown>) => String(item.UserName || item.name || "-"),
    },
    {
      id: "userId",
      header: "User ID",
      cell: (item: Record<string, unknown>) => String(item.UserId || item.userId || "-"),
    },
    {
      id: "createDate",
      header: "Created",
      cell: (item: Record<string, unknown>) => String(item.CreateDate || item.createDate || "-"),
    },
  ];
  return (
    <SpaceBetween size="m" direction="vertical">
      <Table
        items={users}
        columnDefinitions={columnDefinitions}
        loading={loading}
        empty={<div>No IAM users found</div>}
        header={<Header variant="h2">IAM Users</Header>}
        pagination={<Pagination currentPageIndex={1} pagesCount={1} />}
      />
      <Button onClick={onRefresh}>Refresh</Button>
    </SpaceBetween>
  );
}
