import { ServiceLayout } from "@/components/layouts/ServiceLayout";

/**
 * Lambda section tabs.
 *
 * These are navigation, matching the AWS Lambda console: each entry is a real
 * page of the Lambda service and the bar highlights whichever one you are on.
 */
export default function LambdaLayout({ children }: { children: React.ReactNode }) {
  return (
    <ServiceLayout
      serviceName="Lambda"
      tabs={[
        { label: "Overview", href: "/lambda" },
        { label: "Functions", href: "/lambda/functions" },
        { label: "Layers", href: "/lambda/layers" },
        { label: "Monitoring", href: "/lambda/monitoring" },
      ]}
    >
      {children}
    </ServiceLayout>
  );
}
