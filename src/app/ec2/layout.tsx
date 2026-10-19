import { ServiceLayout } from "@/components/layouts/ServiceLayout";

/**
 * Elastic Compute Cloud service frame.
 *
 * The AWS Elastic Compute Cloud console navigates with its left navigation, not a top-level tab
 * bar, so this layout renders no tabs. The destinations live in
 * SERVICE_NAVIGATION, which AppShell renders in the service rail.
 */
export default function Ec2Layout({ children }: { children: React.ReactNode }) {
  return (
    <ServiceLayout serviceName="Elastic Compute Cloud" showTabs={false}>
      {children}
    </ServiceLayout>
  );
}
