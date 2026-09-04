"use client";

import React, { useEffect, useState } from "react";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";

interface Identity {
  Account?: string;
  UserId?: string;
  Arn?: string;
}

export default function AccountPage() {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/sts")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setIdentity(data.identity);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unknown error"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">AWS Account</Header>
        {error && (
          <Alert type="error" header="Error">
            {error}
          </Alert>
        )}
        <Container header={<Header variant="h2">Account Identity (STS)</Header>}>
          {loading ? (
            <Box>Loading...</Box>
          ) : (
            <SpaceBetween size="xs">
              <Box>
                <strong>Account ID:</strong> {identity?.Account || "—"}
              </Box>
              <Box>
                <strong>User ID:</strong> {identity?.UserId || "—"}
              </Box>
              <Box>
                <strong>ARN:</strong> {identity?.Arn || "—"}
              </Box>
            </SpaceBetween>
          )}
        </Container>
      </SpaceBetween>
    </div>
  );
}
