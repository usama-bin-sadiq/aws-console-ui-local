import { TruncatedText as CloudTruncated } from "@cloudscape-design/components";

export function TruncatedText({ text, maxLength = 30 }: { text: string; maxLength?: number }) {
  const truncated = text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
  return <CloudTruncated tooltipText={text}>{truncated}</CloudTruncated>;
}
