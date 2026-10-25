import { useRef, useEffect, useCallback } from "react";
import Modal from "@cloudscape-design/components/modal";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Alert from "@cloudscape-design/components/alert";

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "warning" | "error" | "info";
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => el.offsetParent !== null);
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "warning",
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<Element | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
        return;
      }
      if (e.key === "Tab" && modalRef.current) {
        const focusable = getFocusableElements(modalRef.current);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [onCancel],
  );

  useEffect(() => {
    if (visible) {
      previousFocusRef.current = document.activeElement;
      document.addEventListener("keydown", handleKeyDown);
      requestAnimationFrame(() => {
        if (modalRef.current) {
          const focusable = getFocusableElements(modalRef.current);
          focusable[0]?.focus();
        }
      });
    } else {
      document.removeEventListener("keydown", handleKeyDown);
      if (previousFocusRef.current instanceof HTMLElement) {
        previousFocusRef.current.focus();
      }
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [visible, handleKeyDown]);

  return (
    <Modal
      visible={visible}
      onDismiss={onCancel}
      header={title}
      footer={
        <SpaceBetween direction="horizontal" size="xs">
          <Button onClick={onCancel} formAction="none" disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "error" ? "primary" : "normal"}
            formAction="none"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </SpaceBetween>
      }
    >
      <Alert type={variant === "error" ? "error" : "warning"}>{message}</Alert>
    </Modal>
  );
}
