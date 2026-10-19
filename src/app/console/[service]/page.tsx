import { redirect } from "next/navigation";

interface ConsoleCompatibilityPageProps {
  readonly params: Promise<{ service: string }>;
}

export default async function ConsoleCompatibilityPage({
  params,
}: ConsoleCompatibilityPageProps): Promise<never> {
  const { service } = await params;
  redirect(service === "home" ? "/" : `/${encodeURIComponent(service)}`);
}
