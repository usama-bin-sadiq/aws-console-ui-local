/**
 * EC2KeyPairForm — Create/import key pair.
 */

import React from 'react';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Button from '@cloudscape-design/components/button';

export function EC2KeyPairForm(): React.ReactElement {
  return (
    <SpaceBetween size="m" direction="vertical">
      <FormField label="Key pair name">
        <Input value="" placeholder="my-key-pair" />
      </FormField>
      <FormField label="Public key" description="Paste public key content when importing">
        <textarea style={{ width: '100%', minHeight: 120 }} placeholder="ssh-rsa AAAA..." />
      </FormField>
      <Button variant="primary">Create / Import</Button>
    </SpaceBetween>
  );
}
