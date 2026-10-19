import { ServiceLayout } from "@/components/layouts/ServiceLayout";

/**
 * Amazon Route 53 service frame.
 *
 * The AWS Amazon Route 53 console navigates with its left navigation, not a top-level tab
 * bar, so this layout renders no tabs. The destinations live in
 * SERVICE_NAVIGATION, which AppShell renders in the service rail.
 */
export default function Route53Layout({ children }: { children: React.ReactNode }) {
  return (
    <ServiceLayout serviceName="Amazon Route 53" showTabs={false}>
      {children}
    </ServiceLayout>
  );
}
