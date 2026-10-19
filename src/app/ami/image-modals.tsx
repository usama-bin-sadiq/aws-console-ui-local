"use client";

/**
 * Shared AMI dialogs: typed-image deregister confirmation and the
 * create-snapshot-from-image modal. Used by both the list and detail pages.
 */

import React, { useEffect, useState } from "react";
import Modal from "@cloudscape-design/components/modal";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Alert from "@cloudscape-design/components/alert";
import { amiPost } from "./ami-api";

// ─── Deregister confirmation (typed: type the AMI ID) ────────────────────────

export interface DeregisterImageModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Image being deregistered — the user must type this exact AMI ID */
  imageId: string;
  /** Called when the user types the AMI ID and confirms */
  onConfirm: () => void;
  /** Called when the user dismisses without confirming */
  onDismiss: () => void;
  /** Shows a loading spinner on the confirm button while the call is in flight */
  loading?: boolean;
}

export function DeregisterImageModal({
  visible,
  imageId,
  onConfirm,
  onDismiss,
  loading = false,
}: DeregisterImageModalProps) {
  const [inputValue, setInputValue] = useState("");

  // Reset the typed confirmation whenever the modal opens or the target changes.
  useEffect(() => {
    if (visible) setInputValue("");
  }, [visible, imageId]);

  const isConfirmed = inputValue === imageId;

  const handleDismiss = () => {
    setInputValue("");
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      onDismiss={handleDismiss}
      header="Deregister image"
      closeAriaLabel="Close modal"
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={handleDismiss} disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={onConfirm} disabled={!isConfirmed} loading={loading}>
              Deregister
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <SpaceBetween size="m">
        <Alert type="warning" statusIconAriaLabel="Warning">
          <Box variant="span" fontWeight="bold">
            Snapshots are not deleted.
          </Box>{" "}
          Deregistering removes the image{" "}
          <Box variant="span" fontWeight="bold">
            {imageId}
          </Box>{" "}
          so it can no longer be launched, but its EBS snapshots continue to exist (and continue to
          be billed). Delete them separately from the Snapshots console.
        </Alert>

        <FormField
          label={
            <>
              Type the AMI ID to confirm:{" "}
              <Box variant="span" fontWeight="bold">
                {imageId}
              </Box>
            </>
          }
        >
          <Input
            value={inputValue}
            onChange={({ detail }) => setInputValue(detail.value)}
            placeholder={imageId}
            ariaLabel={`Type the AMI ID ${imageId} to confirm`}
            disabled={loading}
          />
        </FormField>
      </SpaceBetween>
    </Modal>
  );
}

// ─── Create snapshot from image ──────────────────────────────────────────────

export interface CreateSnapshotModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Source image the snapshot is created from */
  imageId: string;
  /** Called with the new snapshot ID after a successful creation */
  onCreated: (snapshotId: string) => void;
  /** Called when the user dismisses the modal */
  onDismiss: () => void;
}

export function CreateSnapshotModal({
  visible,
  imageId,
  onCreated,
  onDismiss,
}: CreateSnapshotModalProps) {
  const [description, setDescription] = useState("");
  const [descriptionError, setDescriptionError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill a sensible default whenever the modal opens for an image.
  useEffect(() => {
    if (visible) {
      setDescription(`Snapshot created from AMI ${imageId}`);
      setDescriptionError(undefined);
      setError(null);
    }
  }, [visible, imageId]);

  const handleCreate = async () => {
    if (!description.trim()) {
      setDescriptionError("Description is required");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const data = await amiPost({
        action: "createSnapshotFromImage",
        ImageId: imageId,
        Description: description.trim(),
      });
      if (!data.snapshotId) {
        throw new Error("The emulator did not return a snapshot ID");
      }
      setDescription("");
      onCreated(data.snapshotId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create snapshot");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      header="Create snapshot from image"
      closeAriaLabel="Close modal"
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={onDismiss} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => void handleCreate()}
              loading={submitting}
              disabled={submitting}
            >
              Create snapshot
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <SpaceBetween size="m">
        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}
        <Box>
          Creates a new snapshot from the root volume snapshot of image{" "}
          <Box variant="span" fontWeight="bold">
            {imageId}
          </Box>
          .
        </Box>
        <FormField
          label="Description"
          constraintText="Required. Stored with the snapshot and shown in the Snapshots console."
          errorText={descriptionError}
        >
          <Input
            value={description}
            onChange={({ detail }) => {
              setDescription(detail.value);
              setDescriptionError(undefined);
            }}
            ariaLabel="Snapshot description"
            disabled={submitting}
          />
        </FormField>
      </SpaceBetween>
    </Modal>
  );
}
