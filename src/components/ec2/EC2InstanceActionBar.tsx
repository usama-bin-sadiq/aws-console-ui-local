/**
 * EC2InstanceActionBar — Action menu with primary/secondary actions.
 */

import React from "react";
import ButtonDropdown, { type ButtonDropdownProps } from "@cloudscape-design/components/button-dropdown";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Modal from "@cloudscape-design/components/modal";
import Button from "@cloudscape-design/components/button";

export interface EC2InstanceActionBarProps {
  readonly instanceId?: string;
  readonly onStart?: () => void;
  readonly onStop?: () => void;
  readonly onReboot?: () => void;
  readonly onTerminate?: () => void;
}

export function EC2InstanceActionBar({
  instanceId,
  onStart,
  onStop,
  onReboot,
  onTerminate,
}: EC2InstanceActionBarProps): React.ReactElement {
  const [showTerminateModal, setShowTerminateModal] = React.useState(false);

  return (
    <SpaceBetween size="xs" direction="horizontal">
      <ButtonDropdown
        items={
          [
            { text: "Start", id: "start" as string, iconName: "play" },
            { text: "Stop", id: "stop" as string, iconName: "stop" },
            { text: "Reboot", id: "reboot" as string, iconName: "refresh" },
            { text: "Terminate", id: "terminate" as string, iconName: "delete-marker" },
          ] as ButtonDropdownProps.Item[]
        }
        onItemClick={({ detail }) => {
          if (detail.id === "start") onStart?.();
          if (detail.id === "stop") onStop?.();
          if (detail.id === "reboot") onReboot?.();
          if (detail.id === "terminate") setShowTerminateModal(true);
        }}
        ariaLabel="Instance actions"
      />
      {showTerminateModal && (
        <Modal
          visible
          onDismiss={() => setShowTerminateModal(false)}
          header="Confirm Terminate"
          footer={
            <SpaceBetween size="xs" direction="horizontal">
              <Button
                variant="primary"
                onClick={() => {
                  onTerminate?.();
                  setShowTerminateModal(false);
                }}
              >
                Terminate
              </Button>
              <Button onClick={() => setShowTerminateModal(false)}>Cancel</Button>
            </SpaceBetween>
          }
        >
          <p>Are you sure you want to terminate instance {instanceId}?</p>
        </Modal>
      )}
    </SpaceBetween>
  );
}
