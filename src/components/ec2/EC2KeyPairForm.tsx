/**
 * EC2KeyPairForm — Create/import key pair.
 */

import React from 'react';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Button from '@cloudscape-design/components/button';
import Textarea from '@cloudscape-design/components/textarea';

export function EC2KeyPairForm(): React.ReactElement {
  return (
    <SpaceBetween size="m" direction="vertical">
      <FormField label="Key pair name">
        <Input value="" placeholder="my-key-pair" />
      </FormField>
      <FormField label="Public key" description="Paste public key content when importing">
        <Textarea value="" onChange={() => undefined} placeholder="ssh-rsa AAAA..." rows={6} />
      </FormField>
      <Button variant="primary">Create / Import</Button>
    </SpaceBetween>
  );
}
