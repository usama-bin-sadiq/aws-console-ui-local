"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";
import { LambdaFunctionWizard } from "@/components/lambda/LambdaFunctionWizard";

export default function LambdaCreatePage() {
  const router = useRouter();
  const [showWizard, setShowWizard] = useState(true);

  const handleCreate = (config: Record<string, unknown>) => {
    setShowWizard(false);
    router.push("/lambda");
  };

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header
          variant="h1"
          actions={
            <Button onClick={() => router.push("/lambda")} formAction="none">
              Back to Lambda
            </Button>
          }
        >
          Create function
        </Header>
        <Container>
          <LambdaFunctionWizard
            visible={showWizard}
            onCreate={handleCreate}
            onCancel={() => router.push("/lambda")}
          />
        </Container>
      </SpaceBetween>
    </div>
  );
}
