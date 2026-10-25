/**
 * EC2VolumeTable — Volume list with exact AWS columns.
 */

import React from "react";
import Table from "@cloudscape-design/components/table";
import Pagination from "@cloudscape-design/components/pagination";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";

export interface EC2VolumeTableProps {
  readonly volumes?: Array<Record<string, unknown>>;
  readonly loading?: boolean;
  readonly onRefresh?: () => void;
}

export function EC2VolumeTable({
  volumes = [],
  loading = false,
  onRefresh,
}: EC2VolumeTableProps): React.ReactElement {
  const columnDefinitions: any[] = [
    {
      id: "volumeId",
      header: "Volume ID",
      cell: (item: Record<string, unknown>) => String(item.VolumeId || item.volumeId || "-"),
    },
    {
      id: "size",
      header: "Size (GiB)",
      cell: (item: Record<string, unknown>) => String(item.Size || item.size || "-"),
    },
    {
      id: "type",
      header: "Type",
      cell: (item: Record<string, unknown>) => String(item.VolumeType || item.type || "-"),
    },
    {
      id: "state",
      header: "State",
      cell: (item: Record<string, unknown>) => String(item.State || item.state || "-"),
    },
    {
      id: "az",
      header: "Availability Zone",
      cell: (item: Record<string, unknown>) => String(item.AvailabilityZone || item.az || "-"),
    },
    {
      id: "attachments",
      header: "Attachments",
      cell: (item: Record<string, unknown>) =>
        String(item.Attachments ? JSON.stringify(item.Attachments) : "-"),
    },
  ];

  return (
    <SpaceBetween size="m" direction="vertical">
      <Table
        items={volumes}
        columnDefinitions={columnDefinitions}
        loading={loading}
        empty={<div>No volumes found</div>}
        header={<h2>Volumes</h2>}
        pagination={<Pagination currentPageIndex={1} pagesCount={1} />}
      />
      <Button onClick={onRefresh}>Refresh</Button>
    </SpaceBetween>
  );
}
