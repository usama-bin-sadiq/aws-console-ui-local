"use client";

import React, { useState, useEffect } from "react";
import Modal from "@cloudscape-design/components/modal";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Alert from "@cloudscape-design/components/alert";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ConfirmModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /**
   * The exact string the user must type to enable the confirm button.
   * Matching is case-sensitive and whitespace-sensitive per AWS Console
   * behaviour.
   */
  resourceName: string;
  /** Human-readable resource type displayed in the warning, e.g. "bucket" */
  resourceType: string;
  /** Label for the confirm button. Defaults to "Delete" */
  actionLabel?: string;
  /** Called when the user successfully confirms the action */
  onConfirm: () => void;
  /** Called when the user dismisses the modal without confirming */
  onDismiss: () => void;
  /** Shows a loading spinner on the confirm button while a mutation is in flight */
  loading?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ConfirmModal({
  visible,
  resourceName,
  resourceType,
  actionLabel = "Delete",
  onConfirm,
  onDismiss,
  loading = false,
}: ConfirmModalProps) {
  const [inputValue, setInputValue] = useState("");

  // Reset the input whenever the modal opens or the target resource changes
  useEffect(() => {
    if (visible) {
      setInputValue("");
    }
  }, [visible, resourceName]);

  // Exact match — case-sensitive and whitespace-sensitive
  const isConfirmed = inputValue === resourceName;

  const handleDismiss = () => {
    setInputValue("");
    onDismiss();
  };

  const handleConfirm = () => {
    if (!isConfirmed || loading) return;
    onConfirm();
  };

  const actionLabelLower = actionLabel.toLowerCase();

  return (
    <Modal
      visible={visible}
      onDismiss={handleDismiss}
      header={`${actionLabel} ${resourceType}`}
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
              {actionLabel}
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <SpaceBetween size="m">
        <Alert type="warning" statusIconAriaLabel="Warning">
          This action cannot be undone. The {resourceType}{" "}
          <Box variant="span" fontWeight="bold">
            {resourceName}
          </Box>{" "}
          will be permanently {actionLabelLower}d.
        </Alert>

        <FormField
          label={
            <>
              To confirm, type{" "}
              <Box variant="span" fontWeight="bold">
                {resourceName}
              </Box>{" "}
              in the field below.
            </>
          }
        >
          <Input
            value={inputValue}
            onChange={({ detail }) => setInputValue(detail.value)}
            placeholder={resourceName}
            ariaLabel={`Type ${resourceName} to confirm`}
            disabled={loading}
          />
        </FormField>
      </SpaceBetween>
    </Modal>
  );
}
