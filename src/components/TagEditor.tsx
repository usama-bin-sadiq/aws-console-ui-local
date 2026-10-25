"use client";

import { useCallback } from "react";
import Button from "@cloudscape-design/components/button";
import FormField from "@cloudscape-design/components/form-field";
import Grid from "@cloudscape-design/components/grid";
import Input from "@cloudscape-design/components/input";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Tag {
  key: string;
  value: string;
}

export interface TagEditorProps {
  /** Current list of tags */
  tags: Tag[];
  /** Called with the updated list on every change */
  onChange: (tags: Tag[]) => void;
  /** When true, all inputs are read-only and add/remove buttons are hidden */
  readOnly?: boolean;
  /**
   * Maximum number of tags allowed. Defaults to 50, matching the real AWS
   * Console limit.
   */
  maxTags?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TagEditor({
  tags,
  onChange,
  readOnly = false,
  maxTags = 50,
}: TagEditorProps) {
  const handleKeyChange = useCallback(
    (index: number, newKey: string) => {
      onChange(tags.map((tag, i) => (i === index ? { ...tag, key: newKey } : tag)));
    },
    [tags, onChange],
  );

  const handleValueChange = useCallback(
    (index: number, newValue: string) => {
      onChange(tags.map((tag, i) => (i === index ? { ...tag, value: newValue } : tag)));
    },
    [tags, onChange],
  );

  const handleAddTag = useCallback(() => {
    if (tags.length >= maxTags) return;
    onChange([...tags, { key: "", value: "" }]);
  }, [tags, onChange, maxTags]);

  const handleRemoveTag = useCallback(
    (index: number) => {
      onChange(tags.filter((_, i) => i !== index));
    },
    [tags, onChange],
  );

  return (
    <SpaceBetween size="s">
      {/* Column headers — only shown when there is at least one tag row */}
      {tags.length > 0 && (
        <Grid gridDefinition={[{ colspan: 5 }, { colspan: 5 }, { colspan: 2 }]}>
          <Box variant="awsui-key-label">Key</Box>
          <Box variant="awsui-key-label">Value</Box>
          {/* Spacer for the remove-button column */}
          <Box variant="awsui-key-label" />
        </Grid>
      )}

      {/* One row per tag */}
      {tags.map((tag, index) => (
        <Grid key={index} gridDefinition={[{ colspan: 5 }, { colspan: 5 }, { colspan: 2 }]}>
          <FormField>
            <Input
              value={tag.key}
              onChange={({ detail }) => handleKeyChange(index, detail.value)}
              placeholder="Key"
              readOnly={readOnly}
              ariaLabel={`Tag ${index + 1} key`}
            />
          </FormField>

          <FormField>
            <Input
              value={tag.value}
              onChange={({ detail }) => handleValueChange(index, detail.value)}
              placeholder="Value (optional)"
              readOnly={readOnly}
              ariaLabel={`Tag ${index + 1} value`}
            />
          </FormField>

          {!readOnly && (
            <Box padding={{ top: "xs" }}>
              <Button
                variant="icon"
                iconName="remove"
                onClick={() => handleRemoveTag(index)}
                ariaLabel={`Remove tag ${index + 1}`}
              />
            </Box>
          )}
        </Grid>
      ))}

      {/* Add tag button + count helper */}
      {!readOnly && (
        <SpaceBetween size="xs">
          <Button onClick={handleAddTag} disabled={tags.length >= maxTags} iconName="add-plus">
            Add tag
          </Button>
          <Box variant="small" color="text-body-secondary">
            {tags.length} / {maxTags} tags
          </Box>
        </SpaceBetween>
      )}
    </SpaceBetween>
  );
}
