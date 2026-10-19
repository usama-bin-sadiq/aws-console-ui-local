/**
 * Route53Component — Hosted zone list.
 */

import React, { useState } from "react";
import Table from "@cloudscape-design/components/table";
import Pagination from "@cloudscape-design/components/pagination";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";

export interface Route53ComponentProps {
  readonly zones?: Array<Record<string, unknown>>;
  readonly loading?: boolean;
  readonly onRefresh?: () => void;
}

export function Route53Component({
  zones = [],
  loading = false,
  onRefresh,
}: Route53ComponentProps): React.ReactElement {
  const columnDefinitions: any[] = [
    {
      id: "name",
      header: "Zone Name",
      cell: (item: Record<string, unknown>) => String(item.Name || item.name || "-"),
    },
    {
      id: "type",
      header: "Type",
      cell: (item: Record<string, unknown>) => String(item.Type || item.type || "-"),
    },
  ];
  return (
    <SpaceBetween size="m" direction="vertical">
      <Table
        items={zones}
        columnDefinitions={columnDefinitions}
        loading={loading}
        empty={<div>No hosted zones found</div>}
        header={<h2>Hosted Zones</h2>}
        pagination={<Pagination currentPageIndex={1} pagesCount={1} />}
      />
      <Button onClick={onRefresh}>Refresh</Button>
    </SpaceBetween>
  );
}
