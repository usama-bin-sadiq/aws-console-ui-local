import Header from "@cloudscape-design/components/header";
/**
 * S3BucketTable — Bucket list.
 */

import React, { useState } from "react";
import Table from "@cloudscape-design/components/table";
import Pagination from "@cloudscape-design/components/pagination";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";

export interface S3BucketTableProps {
  readonly buckets?: Array<Record<string, unknown>>;
  readonly loading?: boolean;
  readonly onRefresh?: () => void;
}

export function S3BucketTable({
  buckets = [],
  loading = false,
  onRefresh,
}: S3BucketTableProps): React.ReactElement {
  const columnDefinitions: any[] = [
    {
      id: "name",
      header: "Name",
      cell: (item: Record<string, unknown>) => String(item.Name || item.name || "-"),
    },
    {
      id: "region",
      header: "Region",
      cell: (item: Record<string, unknown>) => String(item.Region || item.region || "-"),
    },
    {
      id: "creation",
      header: "Creation Date",
      cell: (item: Record<string, unknown>) =>
        String(item.CreationDate || item.creationDate || "-"),
    },
  ];

  return (
    <SpaceBetween size="m" direction="vertical">
      <Table
        items={buckets}
        columnDefinitions={columnDefinitions}
        loading={loading}
        empty={<div>No buckets found</div>}
        header={<Header variant="h2">S3 Buckets</Header>}
        pagination={<Pagination currentPageIndex={1} pagesCount={1} />}
      />
      <Button onClick={onRefresh}>Refresh</Button>
    </SpaceBetween>
  );
}
