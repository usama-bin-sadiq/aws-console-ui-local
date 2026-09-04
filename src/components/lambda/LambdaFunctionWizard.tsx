/**
 * LambdaFunctionWizard — Function creation wizard.
 */

import React from 'react';
import Wizard from '@cloudscape-design/components/wizard';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import Select from '@cloudscape-design/components/select';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Button from '@cloudscape-design/components/button';

export interface LambdaFunctionWizardProps {
  readonly onCreate?: (config: Record<string, unknown>) => void;
  readonly onCancel?: () => void;
}

export function LambdaFunctionWizard({ onCreate, onCancel }: LambdaFunctionWizardProps): React.ReactElement {
  return (
    <SpaceBetween size="m" direction="vertical">
      <h3>Create Function</h3>
      <FormField label="Function name">
        <Input value="" placeholder="my-function" />
      </FormField>
      <FormField label="Runtime">
        <Select selectedOption={{ value: 'nodejs20.x', label: 'Node.js 20.x' }} options={[{ value: 'nodejs20.x', label: 'Node.js 20.x' }, { value: 'python3.12', label: 'Python 3.12' }]} />
      </FormField>
      <FormField label="Handler">
        <Input value="" placeholder="index.handler" />
      </FormField>
      <SpaceBetween direction="horizontal" size="xs">
        <Button variant="primary" onClick={() => onCreate?.({})}>Create</Button>
        <Button onClick={onCancel}>Cancel</Button>
      </SpaceBetween>
    </SpaceBetween>
  );
}
