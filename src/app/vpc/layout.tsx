import { ServiceLayout } from "@/components/layouts/ServiceLayout";

/**
 * Amazon VPC service frame.
 *
 * The AWS Amazon VPC console navigates with its left navigation, not a top-level tab
 * bar, so this layout renders no tabs. The destinations live in
 * SERVICE_NAVIGATION, which AppShell renders in the service rail.
 */
export default function VpcLayout({ children }: { children: React.ReactNode }) {
  return (
    <ServiceLayout showServiceHeader={false} serviceName="Amazon VPC" showTabs={false}>
      {children}
    </ServiceLayout>
  );
}
