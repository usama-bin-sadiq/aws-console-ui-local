"use client";

import React, { useCallback, useState } from "react";
import {
  Button,
  FormField,
  Input,
  Select,
  Alert,
  SpaceBetween,
  Box,
} from "@cloudscape-design/components";

interface WizardStep {
  id: string;
  label: string;
  validate: (formData: Record<string, unknown>) => string | null;
  render: (props: {
    formData: Record<string, unknown>;
    onChange: (key: string, value: unknown) => void;
  }) => React.ReactNode;
}

interface WizardProps {
  steps: WizardStep[];
  initialData?: Record<string, unknown>;
  onComplete: (formData: Record<string, unknown>) => void;
  onCancel?: () => void;
}

export function WizardStepper({ steps, initialData = {}, onComplete, onCancel }: WizardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, unknown>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  const validateStep = useCallback(
    (step: WizardStep): boolean => {
      const error = step.validate(formData);
      setErrors((prev) => {
        const next = { ...prev };
        if (error) {
          next[step.id] = error;
        } else {
          delete next[step.id];
        }
        return next;
      });
      return !error;
    },
    [formData],
  );

  const handleNext = useCallback(() => {
    if (!validateStep(currentStep)) return;
    if (isLastStep) {
      setSubmitting(true);
      onComplete(formData);
    } else {
      setCurrentStepIndex((i) => i + 1);
    }
  }, [currentStep, isLastStep, formData, onComplete]);

  const handleBack = useCallback(() => {
    setCurrentStepIndex((i) => i - 1);
  }, []);

  const handleChange = useCallback(
    (key: string, value: unknown) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    [],
  );

  const progress = ((currentStepIndex) / (steps.length - 1)) * 100;

  return (
    <SpaceBetween size="l" direction="vertical">
      {/* Stepper progress */}
      <Box variant="div" padding="s">
        <Box variant="div" padding={{ left: "s", right: "s" }} margin={{ bottom: "s" }}>
          <Box
            variant="div"
            nativeAttributes={{
              style: { display: "flex", justifyContent: "space-between" },
            }}
            margin={{ bottom: "xs" }}
          >
            <Box variant="small">{currentStep.label}</Box>
            <Box variant="small" textAlign="right">
              Step {currentStepIndex + 1} of {steps.length}
            </Box>
          </Box>
          <Box
            variant="div"
            nativeAttributes={{
              style: {
                height: "4px",
                background: "var(--color-border-layout-subtle)",
                borderRadius: "2px",
              },
            }}
          >
            <Box
              variant="div"
              nativeAttributes={{
                style: {
                  height: "4px",
                  background: "var(--color-text-link)",
                  borderRadius: "2px",
                  width: `${progress}%`,
                },
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* Step content */}
      <SpaceBetween size="m">
        <Box variant="div" padding="m">
          {currentStep.render({
            formData,
            onChange: handleChange,
          })}
        </Box>
      </SpaceBetween>

      {/* Inline validation error */}
      {errors[currentStep.id] && (
        <Alert type="error" dismissible onDismiss={() => setErrors((p) => { const n = { ...p }; delete n[currentStep.id]; return n; })}>
          {errors[currentStep.id]}
        </Alert>
      )}

      {/* Navigation buttons */}
      <SpaceBetween size="xs" direction="horizontal">
        {!isFirstStep && (
          <Button
            variant="inline-link"
            onClick={handleBack}
            formAction="none"
            disabled={submitting}
          >
            Back
          </Button>
        )}
        <Box variant="div" nativeAttributes={{ style: { flex: 1 } }} />
        <Button
          variant="primary"
          onClick={handleNext}
          disabled={submitting || !!errors[currentStep.id]}
          loading={submitting}
        >
          {isLastStep ? "Create resource" : "Next step"}
        </Button>
        {onCancel && (
          <Button variant="inline-link" onClick={onCancel} formAction="none" disabled={submitting}>
            Cancel
          </Button>
        )}
      </SpaceBetween>
    </SpaceBetween>
  );
}
