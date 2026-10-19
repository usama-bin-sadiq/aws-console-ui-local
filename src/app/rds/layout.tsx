import { ServiceLayout } from "@/components/layouts/ServiceLayout";

/**
 * RDS service frame.
 *
 * The AWS RDS console navigates with its left navigation, not a top-level tab
 * bar, so this layout renders no tabs. The destinations live in
 * SERVICE_NAVIGATION, which AppShell renders in the service rail.
 */
export default function RdsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ServiceLayout showServiceHeader={false} serviceName="RDS" showTabs={false}>
      {children}
    </ServiceLayout>
  );
}
