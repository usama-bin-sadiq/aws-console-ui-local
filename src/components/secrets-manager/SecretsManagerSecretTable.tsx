/**
 * SecretsManagerSecretTable — Secrets list.
 */

import React, { useState } from 'react';
import Table from '@cloudscape-design/components/table';
import Pagination from '@cloudscape-design/components/pagination';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Button from '@cloudscape-design/components/button';

export interface SecretsManagerSecretTableProps {
  readonly secrets?: Array<Record<string, unknown>>;
  readonly loading?: boolean;
  readonly onRefresh?: () => void;
}

export function SecretsManagerSecretTable({ secrets = [], loading = false, onRefresh }: SecretsManagerSecretTableProps): React.ReactElement {
  const columnDefinitions: any[] = [
    { id: 'name', header: 'Secret Name', cell: (item: Record<string, unknown>) => String(item.SecretName || item.name || '-') },
    { id: 'kms', header: 'KMS Key', cell: (item: Record<string, unknown>) => String(item.KmsKeyId || item.kms || '-') },
  ];
  return (
    <SpaceBetween size="m" direction="vertical">
      <Table items={secrets} columnDefinitions={columnDefinitions} loading={loading} empty={<div>No secrets found</div>} header={<h2>Secrets</h2>} pagination={<Pagination currentPageIndex={1} pagesCount={1} />} />
      <Button onClick={onRefresh}>Refresh</Button>
    </SpaceBetween>
  );
}
