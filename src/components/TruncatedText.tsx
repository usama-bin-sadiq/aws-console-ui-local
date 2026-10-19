"use client";

import React from "react";
import Popover from "@cloudscape-design/components/popover";

type Props = {
  children: React.ReactNode;
  maxLength?: number;
};

export default function TruncatedText({ children, maxLength = 50 }: Props) {
  const text = typeof children === "string" ? children : "";

  if (!text || text.length <= maxLength) {
    return <>{children}</>;
  }

  const truncated = text.slice(0, maxLength) + "...";

  return (
    <Popover position="top" size="medium" triggerType="custom" content={text}>
      <span
        style={{
          display: "block",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: "100%",
          cursor: "help",
        }}
      >
        {truncated}
      </span>
    </Popover>
  );
}
