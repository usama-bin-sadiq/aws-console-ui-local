/**
 * EC2PlacementGroupComponent — Placement group create/manage.
 */

import React, { useState } from 'react';
import FormField from '@cloudscape-design/components/form-field';
import Select from '@cloudscape-design/components/select';
import Input from '@cloudscape-design/components/input';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Button from '@cloudscape-design/components/button';

export function EC2PlacementGroupComponent(): React.ReactElement {
  const [strategy, setStrategy] = useState('cluster');
  return (
    <SpaceBetween size="m" direction="vertical">
      <FormField label="Strategy">
        <Select selectedOption={{ value: strategy, label: strategy }} options={[{ value: 'cluster', label: 'Cluster' }, { value: 'spread', label: 'Spread' }, { value: 'partition', label: 'Partition' }]} onChange={({ detail }) => setStrategy(detail.selectedOption?.value || 'cluster')} />
      </FormField>
      <FormField label="Name">
        <Input value="" placeholder="my-placement-group" />
      </FormField>
      <Button variant="primary">Create</Button>
    </SpaceBetween>
  );
}
