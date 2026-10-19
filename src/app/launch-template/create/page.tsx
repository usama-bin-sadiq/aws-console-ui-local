"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";
import Box from "@cloudscape-design/components/box";
import Spinner from "@cloudscape-design/components/spinner";
import { LaunchTemplateCreateForm } from "./LaunchTemplateCreateForm";

function LaunchTemplateCreateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // `fromTemplate` switches the page into the "create new version" flow.
  const sourceTemplateId = searchParams.get("fromTemplate") ?? undefined;
  const isVersionMode = Boolean(sourceTemplateId);

  return (
    <SpaceBetween size="l">
      <Header
        variant="h1"
        actions={
          <Button onClick={() => router.push("/launch-template")} formAction="none">
            Back to launch templates
          </Button>
        }
      >
        {isVersionMode ? "Create new version" : "Create launch template"}
      </Header>
      <LaunchTemplateCreateForm
        sourceTemplateId={sourceTemplateId}
        onCancel={() => router.push("/launch-template")}
      />
    </SpaceBetween>
  );
}

export default function LaunchTemplateCreatePage() {
  return (
    <Suspense
      fallback={
        <Box textAlign="center" padding="l">
          <Spinner size="large" />
        </Box>
      }
    >
      <LaunchTemplateCreateContent />
    </Suspense>
  );
}
