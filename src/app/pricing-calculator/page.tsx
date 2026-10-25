"use client";

import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { Header, Container, Box, SpaceBetween, Alert } from "@cloudscape-design/components";

export default function PricingCalculatorPage() {
  return (
    <ServiceLayout
      serviceName="AWS Pricing Calculator"
      serviceHref="/pricing-calculator"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "Pricing Calculator", href: "/pricing-calculator" },
      ]}
      healthStatus="checking"
      healthReason="Checking emulator availability..."
    >
      <SpaceBetween size="l">
        <Header variant="h2">AWS Pricing Calculator</Header>
        <Alert type="info" header="Pricing Calculator">
          Plan your AWS costs by estimating the price of your use cases. Not available in local
          emulation.
        </Alert>
        <Container>
          <Box>
            Use the AWS Pricing Calculator in the real AWS Console to estimate costs for your AWS
            services before you deploy them.
          </Box>
        </Container>
      </SpaceBetween>
    </ServiceLayout>
  );
}
