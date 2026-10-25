"use client";

import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { Header, Container, Box, SpaceBetween, Alert } from "@cloudscape-design/components";

export default function InvoicesPage() {
  return (
    <ServiceLayout
      serviceName="AWS Invoices"
      serviceHref="/invoices"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "Invoices", href: "/invoices" },
      ]}
      healthStatus="checking"
      healthReason="Checking emulator availability..."
    >
      <SpaceBetween size="l">
        <Header variant="h2">AWS Invoices</Header>
        <Alert type="info" header="Invoices">
          View and download your AWS invoices. Not available in local emulation.
        </Alert>
        <Container>
          <Box>
            Access your billing invoices and payment history in the real AWS Billing Console.
          </Box>
        </Container>
      </SpaceBetween>
    </ServiceLayout>
  );
}
