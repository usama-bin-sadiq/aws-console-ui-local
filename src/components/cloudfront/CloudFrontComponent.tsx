/**
 * CloudFrontComponent — CloudFront distribution list.
 */

import React from "react";
import Table from "@cloudscape-design/components/table";
import Pagination from "@cloudscape-design/components/pagination";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";

export interface CloudFrontComponentProps {
  readonly distributions?: Array<Record<string, unknown>>;
  readonly loading?: boolean;
  readonly onRefresh?: () => void;
}

export function CloudFrontComponent({
  distributions = [],
  loading = false,
  onRefresh,
}: CloudFrontComponentProps): React.ReactElement {
  const columnDefinitions: any[] = [
    {
      id: "domain",
      header: "Domain Name",
      cell: (item: Record<string, unknown>) => String(item.DomainName || item.domain || "-"),
    },
    {
      id: "status",
      header: "Status",
      cell: (item: Record<string, unknown>) => String(item.Status || item.status || "-"),
    },
  ];
  return (
    <SpaceBetween size="m" direction="vertical">
      <Table
        items={distributions}
        columnDefinitions={columnDefinitions}
        loading={loading}
        empty={<div>No distributions found</div>}
        header={<h2>CloudFront Distributions</h2>}
        pagination={<Pagination currentPageIndex={1} pagesCount={1} />}
      />
      <Button onClick={onRefresh}>Refresh</Button>
    </SpaceBetween>
  );
}
