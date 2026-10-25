"use client";

import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { Header, Container, Box, SpaceBetween, Alert } from "@cloudscape-design/components";

export default function PaymentMethodsPage() {
  return (
    <ServiceLayout
      serviceName="AWS Payment Methods"
      serviceHref="/payment-methods"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "Payment Methods", href: "/payment-methods" },
      ]}
      healthStatus="checking"
      healthReason="Checking emulator availability..."
    >
      <SpaceBetween size="l">
        <Header variant="h2">AWS Payment Methods</Header>
        <Alert type="info" header="Payment Methods">
          Manage the payment methods used for your AWS account. Not available in local emulation.
        </Alert>
        <Container>
          <Box>Add, remove, or update payment methods in the real AWS Billing Console.</Box>
        </Container>
      </SpaceBetween>
    </ServiceLayout>
  );
}
