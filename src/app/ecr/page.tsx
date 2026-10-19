"use client";
import { apiFetch } from "@/lib/api-client";
import React, { useEffect, useState } from "react";
import Header from "@cloudscape-design/components/header";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Alert from "@cloudscape-design/components/alert";
import Modal from "@cloudscape-design/components/modal";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Textarea from "@cloudscape-design/components/textarea";

interface Repository {
  repositoryName: string;
  repositoryUri?: string;
  createdAt?: string;
  imageTagMutability?: string;
}

interface ImageDetail {
  imageDigest?: string;
  imageTags?: string[];
  imageSizeInBytes?: number;
  pushTime?: string;
  artifactMediaType?: string;
}

interface LifecyclePolicyRule {
  rulePriority: number;
  description: string;
  selection: {
    tagStatus: string;
    tagPrefixList?: string[];
    countType: string;
    countUnit?: string;
    countNumber?: number;
  };
  action: {
    type: string;
  };
}

export default function ECRPage() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [images, setImages] = useState<ImageDetail[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [loadingImages, setLoadingImages] = useState(false);
  const [loadingPolicy, setLoadingPolicy] = useState(false);
  const [error, setError] = useState("");

  // Create repo
  const [repoModal, setRepoModal] = useState(false);
  const [repoName, setRepoName] = useState("");
  const [creatingRepo, setCreatingRepo] = useState(false);

  // Lifecycle policy
  const [policyModal, setPolicyModal] = useState(false);
  const [policyText, setPolicyText] = useState("");
  const [currentPolicy, setCurrentPolicy] = useState<string | null>(null);
  const [savingPolicy, setSavingPolicy] = useState(false);

  const fetchRepositories = async () => {
    setLoadingRepos(true);
    setError("");
    try {
      const res = await apiFetch("/api/ecr");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch repositories");
      setRepositories(data.repositories || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch repositories");
    } finally {
      setLoadingRepos(false);
    }
  };

  const fetchImages = async (repoName: string) => {
    setSelectedRepo(repoName);
    setLoadingImages(true);
    try {
      const res = await apiFetch(
        `/api/ecr?repositoryName=${encodeURIComponent(repoName)}&action=describeImages`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch images");
      setImages(data.imageDetails || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch images");
    } finally {
      setLoadingImages(false);
    }
  };

  const fetchLifecyclePolicy = async (repoName: string) => {
    setLoadingPolicy(true);
    try {
      const res = await apiFetch(
        `/api/ecr?repositoryName=${encodeURIComponent(repoName)}&action=getLifecyclePolicy`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch lifecycle policy");
      setCurrentPolicy(data.lifecyclePolicyText || null);
      setPolicyText(data.lifecyclePolicyText || "");
    } catch (err) {
      setCurrentPolicy(null);
      setPolicyText("");
    } finally {
      setLoadingPolicy(false);
    }
  };

  const createRepository = async () => {
    setCreatingRepo(true);
    try {
      const res = await apiFetch("/api/ecr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repositoryName: repoName }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create repository");
      }
      setRepoModal(false);
      setRepoName("");
      fetchRepositories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create repository");
    } finally {
      setCreatingRepo(false);
    }
  };

  const deleteRepository = async (name: string) => {
    try {
      const res = await apiFetch(`/api/ecr?name=${encodeURIComponent(name)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete repository");
      }
      fetchRepositories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete repository");
    }
  };

  const saveLifecyclePolicy = async () => {
    if (!selectedRepo) return;
    setSavingPolicy(true);
    try {
      await apiFetch("/api/ecr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "putLifecyclePolicy",
          repositoryName: selectedRepo,
          lifecyclePolicyText: policyText,
        }),
      });
      setPolicyModal(false);
      fetchLifecyclePolicy(selectedRepo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save lifecycle policy");
    } finally {
      setSavingPolicy(false);
    }
  };

  const deleteLifecyclePolicy = async () => {
    if (!selectedRepo) return;
    try {
      await apiFetch("/api/ecr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteLifecyclePolicy", repositoryName: selectedRepo }),
      });
      setCurrentPolicy(null);
      setPolicyText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete lifecycle policy");
    }
  };

  useEffect(() => {
    fetchRepositories();
  }, []);

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <Header variant="h1">Amazon Elastic Container Registry (ECR)</Header>
        {error && (
          <Alert type="error" onDismiss={() => setError("")}>
            {error}
          </Alert>
        )}

        {/* Repositories */}
        <Table
          header={
            <Header
              variant="h2"
              actions={
                <Button variant="primary" onClick={() => setRepoModal(true)}>
                  Create repository
                </Button>
              }
            >
              Repositories ({repositories.length})
            </Header>
          }
          items={repositories}
          loading={loadingRepos}
          columnDefinitions={[
            { header: "Repository name", cell: (item: Repository) => item.repositoryName },
            { header: "URI", cell: (item: Repository) => item.repositoryUri || "—" },
            {
              header: "Created at",
              cell: (item: Repository) =>
                item.createdAt ? new Date(item.createdAt).toLocaleString() : "—",
            },
            {
              header: "Tag mutability",
              cell: (item: Repository) => item.imageTagMutability || "—",
            },
            {
              header: "Actions",
              cell: (item: Repository) => (
                <SpaceBetween direction="horizontal" size="xs">
                  <Button onClick={() => fetchImages(item.repositoryName)} formAction="none">
                    Images
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedRepo(item.repositoryName);
                      fetchLifecyclePolicy(item.repositoryName);
                      setPolicyModal(true);
                    }}
                    formAction="none"
                  >
                    Lifecycle
                  </Button>
                  <Button onClick={() => deleteRepository(item.repositoryName)} formAction="none">
                    Delete
                  </Button>
                </SpaceBetween>
              ),
            },
          ]}
          empty={<Box textAlign="center">No repositories found.</Box>}
        />

        {/* Images Section */}
        {selectedRepo && (
          <Table
            header={<Header variant="h2">Images in {selectedRepo}</Header>}
            items={images}
            loading={loadingImages}
            columnDefinitions={[
              { header: "Digest", cell: (i: ImageDetail) => i.imageDigest || "—" },
              { header: "Tags", cell: (i: ImageDetail) => (i.imageTags || []).join(", ") || "—" },
              { header: "Size (bytes)", cell: (i: ImageDetail) => i.imageSizeInBytes ?? "—" },
              {
                header: "Pushed",
                cell: (i: ImageDetail) =>
                  i.pushTime ? new Date(i.pushTime).toLocaleString() : "—",
              },
            ]}
            empty={<Box textAlign="center">No images found for this repository.</Box>}
          />
        )}

        {/* Lifecycle Policy Section */}
        {currentPolicy !== null && (
          <Container>
            <SpaceBetween size="s">
              <Header variant="h3">Lifecycle Policy — {selectedRepo}</Header>
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  onClick={() => {
                    setPolicyText(currentPolicy || "");
                    setPolicyModal(true);
                  }}
                >
                  Edit
                </Button>
                <Button onClick={deleteLifecyclePolicy}>Delete</Button>
              </SpaceBetween>
            </SpaceBetween>
            <pre
              style={{
                background: "var(--awsui-color-grey-50)",
                padding: "16px",
                whiteSpace: "pre-wrap",
              }}
            >
              {currentPolicy || "No policy set."}
            </pre>
          </Container>
        )}

        {/* Modals */}
        <Modal
          visible={repoModal}
          onDismiss={() => setRepoModal(false)}
          header="Create repository"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setRepoModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createRepository} loading={creatingRepo}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <FormField label="Repository name" constraintText="Required">
            <Input
              value={repoName}
              onChange={(e) => setRepoName(e.detail.value)}
              placeholder="my-repo"
            />
          </FormField>
        </Modal>

        <Modal
          visible={policyModal}
          onDismiss={() => {
            setPolicyModal(false);
          }}
          header="Lifecycle Policy"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                onClick={() => {
                  setPolicyModal(false);
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={saveLifecyclePolicy} loading={savingPolicy}>
                Save
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m">
            <FormField label="Repository" description="Auto-selected">
              <Input value={selectedRepo || ""} disabled />
            </FormField>
            <FormField label="Policy JSON">
              <Textarea
                value={policyText}
                onChange={(e) => setPolicyText(e.detail.value)}
                rows={8}
                placeholder='{"rules":[{"rulePriority":1,"description":"Keep last 30 tagged images","selection":{"tagStatus":"tagged","tagPrefixList":["v"],"countType":"imageCountMoreThan","countNumber":30},"action":{"type":"expire"}}]}'
              />
            </FormField>
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
