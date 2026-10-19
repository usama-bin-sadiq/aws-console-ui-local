import React, { useState, useCallback } from "react";
import Button from "@cloudscape-design/components/button";

interface CopyableTextProps {
  value: string;
  truncate?: boolean;
  truncateLength?: number;
}

export function CopyableText({ value, truncate = true, truncateLength = 20 }: CopyableTextProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback: select text
    }
  }, [value]);

  const displayText =
    truncate && value.length > truncateLength ? `${value.slice(0, truncateLength)}...` : value;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <code
        style={{
          fontFamily: "var(--awsui-font-family-code)",
          fontSize: "var(--awsui-font-size-body-s)",
        }}
      >
        {displayText}
      </code>
      <Button
        variant="inline-icon"
        iconName={copied ? "check" : "copy"}
        ariaLabel={`Copy ${value}`}
        onClick={handleCopy}
      />
    </span>
  );
}
