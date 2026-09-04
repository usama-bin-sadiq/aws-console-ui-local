/**
 * AppSyncComponent — GraphQL API list.
 */

import React from 'react';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Button from '@cloudscape-design/components/button';

export function AppSyncComponent(): React.ReactElement {
  return (
    <SpaceBetween size="m" direction="vertical">
      <h3>AppSync</h3>
      <Button variant="primary">Create API</Button>
    </SpaceBetween>
  );
}
