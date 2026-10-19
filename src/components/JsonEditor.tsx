"use client";

import React, { useState, useCallback } from "react";
import FormField from "@cloudscape-design/components/form-field";
import Textarea from "@cloudscape-design/components/textarea";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";
import Box from "@cloudscape-design/components/box";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface JsonEditorProps {
  /** Label rendered above the textarea via FormField */
  label?: string;
  /** Current JSON string value */
  value: string;
  /** Called with the updated string on every keystroke */
  onChange: (value: string) => void;
  /** Number of visible rows for the Textarea. Defaults to 12 */
  rows?: number;
  /** When true the textarea is not editable */
  readOnly?: boolean;
  /** Placeholder text shown when the editor is empty */
  placeholder?: string;
  /** Optional helper text rendered below the label */
  description?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns an error message when `text` is non-empty and not valid JSON,
 * otherwise returns `null`.
 */
function validateJson(text: string): string | null {
  if (!text.trim()) return null;
  try {
    JSON.parse(text);
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : "Invalid JSON";
  }
}

/** Pretty-prints valid JSON; returns the original text on parse failure. */
function formatJson(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function JsonEditor({
  label,
  value,
  onChange,
  rows = 12,
  readOnly = false,
  placeholder = '{\n  "key": "value"\n}',
  description,
}: JsonEditorProps) {
  /**
   * `touched` defers error display until the user has interacted with the
   * field at least once, matching the real AWS Console behaviour.
   */
  const [touched, setTouched] = useState(false);

  const errorText = touched ? (validateJson(value) ?? undefined) : undefined;

  const handleChange = useCallback(
    ({ detail }: { detail: { value: string } }) => {
      onChange(detail.value);
      if (!touched) setTouched(true);
    },
    [onChange, touched],
  );

  // Auto-format on blur when the content is valid JSON
  const handleBlur = useCallback(() => {
    setTouched(true);
    if (!validateJson(value)) {
      const formatted = formatJson(value);
      if (formatted !== value) {
        onChange(formatted);
      }
    }
  }, [value, onChange]);

  const handleFormat = useCallback(() => {
    setTouched(true);
    if (!validateJson(value)) {
      const formatted = formatJson(value);
      if (formatted !== value) {
        onChange(formatted);
      }
    }
  }, [value, onChange]);

  return (
    <SpaceBetween size="xs">
      <FormField label={label} description={description} errorText={errorText}>
        <Textarea
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          rows={rows}
          readOnly={readOnly}
          placeholder={placeholder}
          spellcheck={false}
          ariaLabel={label ?? "JSON editor"}
        />
      </FormField>

      {!readOnly && (
        <Box>
          <Button
            variant="inline-link"
            onClick={handleFormat}
            disabled={!!validateJson(value)}
            ariaLabel="Format JSON"
          >
            Format JSON
          </Button>
        </Box>
      )}
    </SpaceBetween>
  );
}
