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

  // Focus management: save previous focus and restore on close
  useEffect(() => {
    if (visible) {
      const prevActive = document.activeElement as HTMLElement | null;
      (window as { __prevConfirmFocus?: HTMLElement | null }).__prevConfirmFocus = prevActive;
      // Move focus into modal after a brief delay
      const timer = setTimeout(() => {
        const firstInput = document.querySelector('input[type="text"]') as HTMLElement | null;
        if (firstInput) firstInput.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      const prev = (window as { __prevConfirmFocus?: HTMLElement | null }).__prevConfirmFocus;
      if (prev && typeof prev.focus === "function") {
        const timer = setTimeout(() => prev.focus(), 50);
        return () => clearTimeout(timer);
      }
    }
  }, [visible]);

  // Focus trap: keep Tab inside modal
  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const modalEl = document.querySelector('[role="dialog"]') as HTMLElement | null;
      if (!modalEl) return;
      const focusable = Array.from(
        modalEl.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ) as HTMLElement[];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [visible]);

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
            <Button key="cancel" variant="link" onClick={handleDismiss} disabled={loading}>
              Cancel
            </Button>
            <Button
              key="confirm"
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
        <Alert key="warning" type="warning" statusIconAriaLabel="Warning">
          This action cannot be undone. The {resourceType}{" "}
          <Box variant="span" fontWeight="bold">
            {resourceName}
          </Box>{" "}
          will be permanently {actionLabelLower}d.
        </Alert>

        <FormField
          key="confirmation-field"
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
