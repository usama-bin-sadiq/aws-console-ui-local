import { ServiceLayout } from "@/components/layouts/ServiceLayout";
import styles from "./form-field-gutter.module.css";

/**
 * Elastic Container Service service frame.
 * The AWS Elastic Container Service console navigates with its left navigation, not a top-level tab
 * bar, so this layout renders no tabs. The destinations live in
 * SERVICE_NAVIGATION, which AppShell renders in the service rail.
 *
 * The wrapper exists only to carry `form-field-gutter.module.css`, which stops
 * the cluster selector's form grid from overhanging the card by the 10px the
 * grid gutter costs. Every other form field on this service lives in a modal.
 */
export default function EcsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.page}>
      <ServiceLayout
        showServiceHeader={false}
        serviceName="Elastic Container Service"
        showTabs={false}
      >
        {children}
      </ServiceLayout>
    </div>
  );
}
