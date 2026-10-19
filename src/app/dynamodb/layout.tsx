import { ServiceLayout } from "@/components/layouts/ServiceLayout";

/**
 * DynamoDB service frame.
 *
 * The AWS DynamoDB console navigates with its left navigation, not a top-level tab
 * bar, so this layout renders no tabs. The destinations live in
 * SERVICE_NAVIGATION, which AppShell renders in the service rail.
 */
export default function DynamodbLayout({ children }: { children: React.ReactNode }) {
  return (
    <ServiceLayout serviceName="DynamoDB" showTabs={false}>
      {children}
    </ServiceLayout>
  );
}
