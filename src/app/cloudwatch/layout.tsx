import { ServiceLayout } from "@/components/layouts/ServiceLayout";

/**
 * CloudWatch service frame.
 *
 * The AWS CloudWatch console navigates with its left navigation, not a top-level tab
 * bar, so this layout renders no tabs. The destinations live in
 * SERVICE_NAVIGATION, which AppShell renders in the service rail.
 */
export default function CloudwatchLayout({ children }: { children: React.ReactNode }) {
  return (
    <ServiceLayout showServiceHeader={false} serviceName="CloudWatch" showTabs={false}>
      {children}
    </ServiceLayout>
  );
}
