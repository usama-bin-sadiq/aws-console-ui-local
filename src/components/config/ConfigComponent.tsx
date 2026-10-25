/**
 * ConfigComponent — Config rules list.
 */

import React from "react";
import Table from "@cloudscape-design/components/table";
import Pagination from "@cloudscape-design/components/pagination";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";

export interface ConfigComponentProps {
  readonly rules?: Array<Record<string, unknown>>;
  readonly loading?: boolean;
  readonly onRefresh?: () => void;
}

export function ConfigComponent({
  rules = [],
  loading = false,
  onRefresh,
}: ConfigComponentProps): React.ReactElement {
  const columnDefinitions: any[] = [
    {
      id: "name",
      header: "Rule Name",
      cell: (item: Record<string, unknown>) => String(item.ConfigRuleName || item.name || "-"),
    },
    {
      id: "source",
      header: "Source",
      cell: (item: Record<string, unknown>) => String(item.Source || item.source || "-"),
    },
  ];
  return (
    <SpaceBetween size="m" direction="vertical">
      <Table
        items={rules}
        columnDefinitions={columnDefinitions}
        loading={loading}
        empty={<div>No config rules found</div>}
        header={<h2>Config Rules</h2>}
        pagination={<Pagination currentPageIndex={1} pagesCount={1} />}
      />
      <Button onClick={onRefresh}>Refresh</Button>
    </SpaceBetween>
  );
}
