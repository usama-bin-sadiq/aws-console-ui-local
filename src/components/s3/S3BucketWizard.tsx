/**
 * S3BucketWizard — Bucket creation wizard.
 */

import React from 'react';
import Wizard from '@cloudscape-design/components/wizard';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Button from '@cloudscape-design/components/button';

export interface S3BucketWizardProps {
  readonly onCreate?: (config: Record<string, unknown>) => void;
  readonly onCancel?: () => void;
}

export function S3BucketWizard({ onCreate, onCancel }: S3BucketWizardProps): React.ReactElement {
  return (
    <SpaceBetween size="m" direction="vertical">
      <h3>Create Bucket</h3>
      <FormField label="Bucket name">
        <Input value="" placeholder="my-unique-bucket" />
      </FormField>
      <FormField label="Region">
        <Input value="us-east-1" readOnly />
      </FormField>
      <FormField label="Tags (optional)">
        <Input value="" placeholder="key=value" />
      </FormField>
      <SpaceBetween direction="horizontal" size="xs">
        <Button variant="primary" onClick={() => onCreate?.({})}>Create</Button>
        <Button onClick={onCancel}>Cancel</Button>
      </SpaceBetween>
    </SpaceBetween>
  );
}
