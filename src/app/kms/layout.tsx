import { ServiceLayout } from "@/components/layouts/ServiceLayout";
import styles from "./form-field-gutter.module.css";

/**
 * AWS KMS service frame.
 *
 * The AWS AWS KMS console navigates with its left navigation, not a top-level tab
 * bar, so this layout renders no tabs. The destinations live in
 * SERVICE_NAVIGATION, which AppShell renders in the service rail.
 *
 * The wrapper exists only to carry `form-field-gutter.module.css`. /kms and
 * /kms/create are the two routes under this layout that render Cloudscape form
 * fields in normal flow rather than inside a modal, so this is the one element
 * above both where the gutter compensation can be scoped.
 */
export default function KmsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.page}>
      <ServiceLayout serviceName="AWS KMS" showTabs={false}>
        {children}
      </ServiceLayout>
    </div>
  );
}
