import { CodeView } from "@cloudscape-design/code-view";

export function JsonViewer({ data }: { data: unknown }) {
  return <CodeView content={JSON.stringify(data, null, 2)} wrapLines />;
}
