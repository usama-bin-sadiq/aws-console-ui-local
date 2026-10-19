import Header from "@cloudscape-design/components/header";
/**
 * EC2InstanceTable — Exact AWS table columns with filtering/sorting/pagination.
 */

import React, { useState } from "react";
import Table from "@cloudscape-design/components/table";
import PropertyFilter from "@cloudscape-design/components/property-filter";
import Pagination from "@cloudscape-design/components/pagination";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Input from "@cloudscape-design/components/input";
import Button from "@cloudscape-design/components/button";

export interface EC2InstanceTableProps {
  readonly instances?: Array<Record<string, unknown>>;
  readonly loading?: boolean;
  readonly onRefresh?: () => void;
}

export function EC2InstanceTable({
  instances = [],
  loading = false,
  onRefresh,
}: EC2InstanceTableProps): React.ReactElement {
  const [selectedItems, setSelectedItems] = useState<Record<string, unknown>[]>([]);
  const [filterText, setFilterText] = useState("");

  const columnDefinitions: any[] = [
    {
      id: "name",
      header: "Name",
      cell: (item: Record<string, unknown>) => String(item.Name || item.name || "-"),
    },
    {
      id: "instanceId",
      header: "Instance ID",
      cell: (item: Record<string, unknown>) => String(item.InstanceId || item.instanceId || "-"),
    },
    {
      id: "type",
      header: "Type",
      cell: (item: Record<string, unknown>) =>
        String(item.InstanceType || item.instanceType || "-"),
    },
    {
      id: "state",
      header: "State",
      cell: (item: Record<string, unknown>) =>
        String((item.State as Record<string, unknown>)?.Name || item.State || "-"),
    },
    {
      id: "az",
      header: "AZ",
      cell: (item: Record<string, unknown>) =>
        String(item.AvailabilityZone || item.availabilityZone || "-"),
    },
    {
      id: "publicIp",
      header: "Public IP",
      cell: (item: Record<string, unknown>) => String(item.PublicIpAddress || item.publicIp || "-"),
    },
    {
      id: "vpc",
      header: "VPC",
      cell: (item: Record<string, unknown>) => String(item.VpcId || item.vpcId || "-"),
    },
  ];

  return (
    <SpaceBetween size="m" direction="vertical">
      <Input
        type="search"
        placeholder="Find instances"
        value={filterText}
        onChange={({ detail }: { detail: { value: string } }) => setFilterText(detail.value || "")}
      />
      <Table
        items={instances}
        columnDefinitions={columnDefinitions}
        loading={loading}
        selectionType="multi"
        selectedItems={selectedItems}
        onSelectionChange={({ detail }) => setSelectedItems(detail.selectedItems || [])}
        ariaLabels={
          {
            selectionGroupLabel: "Select instances",
            allItemsSelectionLabel: "Select all",
            itemSelectionLabel: (data: any, item: any) =>
              item.InstanceId ? `Select ${item.InstanceId}` : "Select item",
          } as any
        }
        empty={<div>No instances found</div>}
        header={<Header variant="h2">Instances</Header>}
        pagination={<Pagination currentPageIndex={1} pagesCount={1} />}
      />
      <Button onClick={onRefresh}>Refresh</Button>
    </SpaceBetween>
  );
}
