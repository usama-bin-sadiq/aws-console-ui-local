/**
 * S3BucketWizard — Bucket creation wizard.
 */

import React, { useState } from 'react';
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
  const [bucketName, setBucketName] = useState('');
  const [bucketNameError, setBucketNameError] = useState<string | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const handleCreate = () => {
    if (!bucketName.trim()) {
      setBucketNameError('Bucket name is required');
      return;
    }
    setBucketNameError(null);
    onCreate?.({ bucketName, region: 'us-east-1' });
  };

  const steps = [
    {
      title: 'Bucket name',
      description: 'Choose a globally unique bucket name',
      content: (
        <SpaceBetween size="l">
          <FormField label={<>Bucket name <span style={{ color: "red" }}>*</span></>} constraintText="Required" errorText={bucketNameError}>
            <Input
              value={bucketName}
              onChange={({ detail }) => { setBucketName(detail.value); setBucketNameError(null); }}
              placeholder="my-unique-bucket"
            />
          </FormField>
          <FormField label="Region">
            <Input value="us-east-1" readOnly />
          </FormField>
          <FormField label="Tags (optional)">
            <Input value="" placeholder="key=value" />
          </FormField>
        </SpaceBetween>
      ),
    },
    {
      title: 'Review',
      description: 'Review your bucket configuration',
      content: (
        <SpaceBetween size="l">
          <div>
            <strong>Bucket name:</strong> {bucketName || '—'}
          </div>
          <div>
            <strong>Region:</strong> us-east-1
          </div>
        </SpaceBetween>
      ),
    },
  ];

  return (
    <SpaceBetween size="m" direction="vertical">
      <Wizard
        steps={steps}
        activeStepIndex={activeStepIndex}
        onNavigate={({ detail }) => setActiveStepIndex(detail.requestedStepIndex)}
        onSubmit={handleCreate}
        i18nStrings={{
          submitButton: 'Create bucket',
          cancelButton: 'Cancel',
          nextButton: 'Next',
          previousButton: 'Previous',
          navigationAriaLabel: 'Bucket creation wizard navigation',
          stepNumberLabel: (stepIndex: number) => `Step ${stepIndex + 1}`,
        }}
      />
      <SpaceBetween direction="horizontal" size="xs">
        <Button formAction="none" onClick={onCancel}>Cancel</Button>
      </SpaceBetween>
    </SpaceBetween>
  );
}
