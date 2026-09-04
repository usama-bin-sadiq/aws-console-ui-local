/**
 * EC2SecurityGroupTable — SG list with inbound/outbound rule counts.
 */

import React, { useState } from 'react';
import Table from '@cloudscape-design/components/table';
import Pagination from '@cloudscape-design/components/pagination';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Button from '@cloudscape-design/components/button';

export interface EC2SecurityGroupTableProps {
  readonly groups?: Array<Record<string, unknown>>;
  readonly loading?: boolean;
  readonly onRefresh?: () => void;
}

export function EC2SecurityGroupTable({ groups = [], loading = false, onRefresh }: EC2SecurityGroupTableProps): React.ReactElement {
  const columnDefinitions: any[] = [
    { id: 'groupName', header: 'Group Name', cell: (item: Record<string, unknown>) => String(item.GroupName || item.groupName || '-') },
    { id: 'groupId', header: 'Group ID', cell: (item: Record<string, unknown>) => String(item.GroupId || item.groupId || '-') },
    { id: 'vpc', header: 'VPC', cell: (item: Record<string, unknown>) => String(item.VpcId || item.vpc || '-') },
    { id: 'inbound', header: 'Inbound Rules', cell: (item: Record<string, unknown>) => String(item.IpPermissions ? (item.IpPermissions as unknown[]).length : 0) },
    { id: 'outbound', header: 'Outbound Rules', cell: (item: Record<string, unknown>) => String(item.IpPermissionsEgress ? (item.IpPermissionsEgress as unknown[]).length : 0) },
  ];

  return (
    <SpaceBetween size="m" direction="vertical">
      <Table
        items={groups}
        columnDefinitions={columnDefinitions}
        loading={loading}
        empty={<div>No security groups found</div>}
        header={<h2>Security Groups</h2>}
        pagination={<Pagination currentPageIndex={1} pagesCount={1} />}
      />
      <Button onClick={onRefresh}>Refresh</Button>
    </SpaceBetween>
  );
}
