"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";
import { LambdaFunctionCreateForm } from "@/components/lambda/LambdaFunctionCreateForm";

export default function LambdaCreatePage() {
  const router = useRouter();

  return (
    <SpaceBetween size="l">
      <Header
        variant="h2"
        actions={
          <Button onClick={() => router.push("/lambda")} formAction="none">
            Back to Lambda
          </Button>
        }
      >
        Create function
      </Header>
      <LambdaFunctionCreateForm onCancel={() => router.push("/lambda")} />
    </SpaceBetween>
  );
}
