/**
 * AMI Components — AMI filter and actions.
 */

import React from 'react';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Button from '@cloudscape-design/components/button';

export interface AMIComponentProps {
  readonly imageId?: string;
}

export function AMIComponent({ imageId }: AMIComponentProps): React.ReactElement {
  return (
    <SpaceBetween size="m" direction="vertical">
      <h3>AMI Management for {imageId}</h3>
      <Button variant="primary">Create Image</Button>
      <Button>Deregister</Button>
    </SpaceBetween>
  );
}
