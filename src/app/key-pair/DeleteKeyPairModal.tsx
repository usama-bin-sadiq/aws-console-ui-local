"use client";

import { useEffect, useState } from "react";
import Modal from "@cloudscape-design/components/modal";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Alert from "@cloudscape-design/components/alert";

/**
 * Typed-confirmation delete dialog for a single key pair.
 * Copy matches the AWS Console exactly:
 *   "The key pair cannot be recovered. Any instances using this key will
 *    become inaccessible."
 * The confirm button stays disabled until the user types the key pair name.
 */
export interface DeleteKeyPairModalProps {
  visible: boolean;
  keyName: string;
  onConfirm: () => void;
  onDismiss: () => void;
  loading?: boolean;
  error?: string | null;
}

export default function DeleteKeyPairModal({
  visible,
  keyName,
  onConfirm,
  onDismiss,
  loading = false,
  error = null,
}: DeleteKeyPairModalProps) {
  const [typedName, setTypedName] = useState("");

  // Reset the confirmation input every time the dialog opens or target changes
  useEffect(() => {
    if (visible)
      queueMicrotask(() => {
        setTypedName("");
      });
  }, [visible, keyName]);

  // Exact, case-sensitive match — same behaviour as the AWS Console
  const isConfirmed = typedName === keyName && keyName.length > 0;

  const handleDismiss = () => {
    if (loading) return;
    setTypedName("");
    onDismiss();
  };

  const handleConfirm = () => {
    if (!isConfirmed || loading) return;
    onConfirm();
  };

  return (
    <Modal
      visible={visible}
      onDismiss={handleDismiss}
      header="Delete key pair"
      closeAriaLabel="Close modal"
      footer={
        <SpaceBetween direction="horizontal" size="xs">
          <Button onClick={handleDismiss} disabled={loading} formAction="none">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={!isConfirmed}
            loading={loading}
          >
            Delete
          </Button>
        </SpaceBetween>
      }
    >
      <SpaceBetween size="m">
        <Alert type="warning" statusIconAriaLabel="Warning">
          <Box>
            The key pair cannot be recovered. Any instances using this key will become inaccessible.
          </Box>
          <Box>
            Deleting key pair{" "}
            <Box variant="span" fontWeight="bold">
              {keyName}
            </Box>
            .
          </Box>
        </Alert>

        {error && <Alert type="error">{error}</Alert>}

        <FormField label="Type the key pair name" constraintText={`Enter ${keyName} to confirm.`}>
          <Input
            value={typedName}
            onChange={({ detail }) => setTypedName(detail.value)}
            placeholder={keyName}
            ariaLabel={`Type the key pair name ${keyName} to confirm`}
            disabled={loading}
          />
        </FormField>
      </SpaceBetween>
    </Modal>
  );
}
