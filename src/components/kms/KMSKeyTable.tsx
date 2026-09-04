/**
 * KMSKeyTable — KMS key list.
 */

import React, { useState } from 'react';
import Table from '@cloudscape-design/components/table';
import Pagination from '@cloudscape-design/components/pagination';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Button from '@cloudscape-design/components/button';

export interface KMSKeyTableProps {
  readonly keys?: Array<Record<string, unknown>>;
  readonly loading?: boolean;
  readonly onRefresh?: () => void;
}

export function KMSKeyTable({ keys = [], loading = false, onRefresh }: KMSKeyTableProps): React.ReactElement {
  const columnDefinitions: any[] = [
    { id: 'alias', header: 'Alias', cell: (item: Record<string, unknown>) => String(item.Alias || item.alias || '-') },
    { id: 'keyId', header: 'Key ID', cell: (item: Record<string, unknown>) => String(item.KeyId || item.keyId || '-') },
    { id: 'state', header: 'State', cell: (item: Record<string, unknown>) => String(item.State || item.state || '-') },
  ];
  return (
    <SpaceBetween size="m" direction="vertical">
      <Table items={keys} columnDefinitions={columnDefinitions} loading={loading} empty={<div>No KMS keys found</div>} header={<h2>KMS Keys</h2>} pagination={<Pagination currentPageIndex={1} pagesCount={1} />} />
      <Button onClick={onRefresh}>Refresh</Button>
    </SpaceBetween>
  );
}
