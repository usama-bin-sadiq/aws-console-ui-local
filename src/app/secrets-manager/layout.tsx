import { ServiceLayout } from "@/components/layouts/ServiceLayout";

/**
 * AWS Secrets Manager service frame.
 *
 * The AWS AWS Secrets Manager console navigates with its left navigation, not a top-level tab
 * bar, so this layout renders no tabs. The destinations live in
 * SERVICE_NAVIGATION, which AppShell renders in the service rail.
 */
export default function SecretsManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <ServiceLayout serviceName="AWS Secrets Manager" showTabs={false}>
      {children}
    </ServiceLayout>
  );
}
