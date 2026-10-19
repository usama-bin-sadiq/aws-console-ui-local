/**
 * EC2KeyPairTable — Key pair list.
 */

import React, { useState } from "react";
import Table from "@cloudscape-design/components/table";
import Pagination from "@cloudscape-design/components/pagination";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";

export interface EC2KeyPairTableProps {
  readonly pairs?: Array<Record<string, unknown>>;
  readonly loading?: boolean;
  readonly onRefresh?: () => void;
}

export function EC2KeyPairTable({
  pairs = [],
  loading = false,
  onRefresh,
}: EC2KeyPairTableProps): React.ReactElement {
  const columnDefinitions: any[] = [
    {
      id: "name",
      header: "Name",
      cell: (item: Record<string, unknown>) => String(item.KeyName || item.name || "-"),
    },
    {
      id: "fingerprint",
      header: "Fingerprint",
      cell: (item: Record<string, unknown>) =>
        String(item.KeyFingerprint || item.fingerprint || "-"),
    },
    {
      id: "type",
      header: "Type",
      cell: (item: Record<string, unknown>) => String(item.KeyType || item.type || "-"),
    },
    {
      id: "createTime",
      header: "Created",
      cell: (item: Record<string, unknown>) => String(item.CreateTime || item.createTime || "-"),
    },
  ];

  return (
    <SpaceBetween size="m" direction="vertical">
      <Table
        items={pairs}
        columnDefinitions={columnDefinitions}
        loading={loading}
        empty={<div>No key pairs found</div>}
        header={<h2>Key Pairs</h2>}
        pagination={<Pagination currentPageIndex={1} pagesCount={1} />}
      />
      <Button onClick={onRefresh}>Refresh</Button>
    </SpaceBetween>
  );
}
