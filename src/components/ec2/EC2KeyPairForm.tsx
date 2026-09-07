/**
 * EC2KeyPairForm — Create/import key pair.
 */

import React, { useState } from 'react';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Button from '@cloudscape-design/components/button';
import Textarea from '@cloudscape-design/components/textarea';

export interface EC2KeyPairFormProps {
  readonly onCreate?: (config: { name: string; publicKey?: string }) => void;
}

export function EC2KeyPairForm({ onCreate }: EC2KeyPairFormProps): React.ReactElement {
  const [keyName, setKeyName] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [keyNameError, setKeyNameError] = useState<string | null>(null);

  const handleCreate = () => {
    if (!keyName.trim()) {
      setKeyNameError('Key pair name is required');
      return;
    }
    setKeyNameError(null);
    onCreate?.({ name: keyName, publicKey: publicKey || undefined });
  };

  return (
    <SpaceBetween size="m" direction="vertical">
      <FormField label={<>Key pair name <span style={{ color: "red" }}>*</span></>} constraintText="Required" errorText={keyNameError}>
        <Input
          value={keyName}
          onChange={({ detail }) => { setKeyName(detail.value); setKeyNameError(null); }}
          placeholder="my-key-pair"
        />
      </FormField>
      <FormField label="Public key" description="Paste public key content when importing">
        <Textarea
          value={publicKey}
          onChange={({ detail }) => setPublicKey(detail.value)}
          placeholder="ssh-rsa AAAA..."
          rows={6}
        />
      </FormField>
      <Button variant="primary" onClick={handleCreate}>Create / Import</Button>
    </SpaceBetween>
  );
}
