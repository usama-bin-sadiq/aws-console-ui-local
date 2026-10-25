"use client";

/**
 * LaunchTemplateDeleteModal — typed confirmation for deleting a launch template.
 * Mirrors the AWS Console delete dialog: the user must type the exact template
 * name, and an extra warning is shown when the template has more than one
 * version (deleting the template removes every version).
 */

import { useEffect, useState } from "react";
import Modal from "@cloudscape-design/components/modal";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Alert from "@cloudscape-design/components/alert";

export interface LaunchTemplateDeleteModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** The exact template name the user must type to enable the confirm button */
  templateName: string;
  /** Number of versions in the template — >1 triggers the multi-version warning */
  versionCount: number;
  /** Called when the user successfully confirms the deletion */
  onConfirm: () => void;
  /** Called when the user dismisses the modal without confirming */
  onDismiss: () => void;
  /** Shows a loading spinner on the confirm button while the request is in flight */
  loading?: boolean;
}

export default function LaunchTemplateDeleteModal({
  visible,
  templateName,
  versionCount,
  onConfirm,
  onDismiss,
  loading = false,
}: LaunchTemplateDeleteModalProps) {
  const [inputValue, setInputValue] = useState("");

  // Reset the input whenever the modal opens or the target template changes
  useEffect(() => {
    if (visible) {
      queueMicrotask(() => {
        setInputValue("");
      });
    }
  }, [visible, templateName]);

  // Exact match — case-sensitive and whitespace-sensitive, as in the console
  const isConfirmed = inputValue === templateName;
  const hasMultipleVersions = versionCount > 1;

  const handleDismiss = () => {
    setInputValue("");
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
      header="Delete launch template"
      closeAriaLabel="Close modal"
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={handleDismiss} disabled={loading}>
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
        </Box>
      }
    >
      <SpaceBetween size="m">
        <Alert type="warning" statusIconAriaLabel="Warning">
          This action cannot be undone. The launch template{" "}
          <Box variant="span" fontWeight="bold">
            {templateName}
          </Box>{" "}
          will be permanently deleted.
        </Alert>

        {hasMultipleVersions && (
          <Alert type="warning" statusIconAriaLabel="Warning">
            This launch template has {versionCount} versions. Deleting the template also deletes
            every version, and any Auto Scaling groups or instances configured to use a specific
            version will no longer be able to launch from it.
          </Alert>
        )}

        <FormField
          label={
            <>
              To confirm, type{" "}
              <Box variant="span" fontWeight="bold">
                {templateName}
              </Box>{" "}
              in the field below.
            </>
          }
        >
          <Input
            value={inputValue}
            onChange={({ detail }) => setInputValue(detail.value)}
            placeholder={templateName}
            ariaLabel={`Type ${templateName} to confirm`}
            disabled={loading}
          />
        </FormField>
      </SpaceBetween>
    </Modal>
  );
}
