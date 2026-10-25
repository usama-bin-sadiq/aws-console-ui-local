/**
 * CloudWatchComponent — Alarm list.
 */

import React from "react";
import Table from "@cloudscape-design/components/table";
import Pagination from "@cloudscape-design/components/pagination";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";

export interface CloudWatchComponentProps {
  readonly alarms?: Array<Record<string, unknown>>;
  readonly loading?: boolean;
  readonly onRefresh?: () => void;
}

export function CloudWatchComponent({
  alarms = [],
  loading = false,
  onRefresh,
}: CloudWatchComponentProps): React.ReactElement {
  const columnDefinitions: any[] = [
    {
      id: "name",
      header: "Alarm Name",
      cell: (item: Record<string, unknown>) => String(item.AlarmName || item.name || "-"),
    },
    {
      id: "state",
      header: "State",
      cell: (item: Record<string, unknown>) => String(item.StateValue || item.state || "-"),
    },
  ];
  return (
    <SpaceBetween size="m" direction="vertical">
      <Table
        items={alarms}
        columnDefinitions={columnDefinitions}
        loading={loading}
        empty={<div>No alarms found</div>}
        header={<h2>CloudWatch Alarms</h2>}
        pagination={<Pagination currentPageIndex={1} pagesCount={1} />}
      />
      <Button onClick={onRefresh}>Refresh</Button>
    </SpaceBetween>
  );
}
