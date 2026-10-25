"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Alert from "@cloudscape-design/components/alert";
import Header from "@cloudscape-design/components/header";
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";
import { apiFetch } from "@/lib/api-client";
import { CrossServiceLinks, CROSS_SERVICE_LINKS } from "@/components/CrossServiceLinks";

interface Repository {
  repositoryName: string;
  repositoryUri: string;
  createdAt: string;
  imageTagMutability: string;
  imageScanOnPush: boolean;
}

export default function ECRRepoDetailPage({ params }: { params: Promise<{ repoName: string }> }) {
  const router = useRouter();
  const [repo, setRepo] = useState<Repository | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [repoName, setRepoName] = useState<string>("");

  useEffect(() => {
    params.then((p) => setRepoName(p.repoName));
  }, [params]);

  const fetchRepo = useCallback(async () => {
    if (!repoName) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/ecr");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const found = (data.repositories || []).find((r: any) => r.repositoryName === repoName);
      if (!found) throw new Error(`Repository "${repoName}" not found`);
      setRepo(found);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load repository");
    } finally {
      setLoading(false);
    }
  }, [repoName]);

  useEffect(() => {
    queueMicrotask(() => {
      fetchRepo();
    });
  }, [fetchRepo]);

  if (loading) {
    return (
      <div style={{ padding: 0 }}>
        <SpaceBetween size="l">
          <Header variant="h2">Repository {repoName || "Loading..."}</Header>
          <Box textAlign="center">
            <Box
              nativeAttributes={{
                style: { fontSize: "18px", color: "#545b64", marginBottom: "12px" },
              }}
            >
              Loading repository details...
            </Box>
          </Box>
        </SpaceBetween>
      </div>
    );
  }

  if (error || !repo) {
    return (
      <div style={{ padding: 0 }}>
        <SpaceBetween size="l">
          <Header variant="h2">Repository {repoName || "Loading..."}</Header>
          <Alert type="error">{error || "Repository not found"}</Alert>
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={fetchRepo}>Refresh</Button>
            <Button onClick={() => router.push("/ecr")}>Back to ECR</Button>
          </SpaceBetween>
        </SpaceBetween>
      </div>
    );
  }

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="ECR"
          serviceIcon={SERVICE_ICONS["/ecr-repo"]?.small}
          counter={1}
          primaryAction={
            <button
              type="button"
              className="aws-service-page__create"
              onClick={() => router.push("/ecr/create")}
            >
              Create Repository
            </button>
          }
        />

        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Container header={<Header variant="h2">Details</Header>}>
          <SpaceBetween size="l">
            <Box padding="m">
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Repository Name
                </Box>
                <Box>{repo.repositoryName}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  ARN
                </Box>
                <Box>{repo.repositoryUri}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Creation Time
                </Box>
                <Box>{repo.createdAt}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Image Tag Mutability
                </Box>
                <Box>{repo.imageTagMutability}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Image Scanning on Push
                </Box>
                <Box>{repo.imageScanOnPush ? "Enabled" : "Disabled"}</Box>
              </SpaceBetween>
            </Box>
          </SpaceBetween>
        </Container>

        <CrossServiceLinks links={CROSS_SERVICE_LINKS["/ecr-repo"] || []} />
      </SpaceBetween>
    </div>
  );
}
