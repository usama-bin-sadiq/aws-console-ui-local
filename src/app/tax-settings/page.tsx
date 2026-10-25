"use client";

import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { Header, Container, Box, SpaceBetween, Alert } from "@cloudscape-design/components";

export default function TaxSettingsPage() {
  return (
    <ServiceLayout
      serviceName="AWS Tax Settings"
      serviceHref="/tax-settings"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "Tax Settings", href: "/tax-settings" },
      ]}
      healthStatus="checking"
      healthReason="Checking emulator availability..."
    >
      <SpaceBetween size="l">
        <Header variant="h2">AWS Tax Settings</Header>
        <Alert type="info" header="Tax Settings">
          Manage your tax settings and tax registration information. Not available in local
          emulation.
        </Alert>
        <Container>
          <Box>Configure tax settings for your AWS account in the real AWS Billing Console.</Box>
        </Container>
      </SpaceBetween>
    </ServiceLayout>
  );
}
