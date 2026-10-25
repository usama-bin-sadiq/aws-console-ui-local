"use client";

import { apiFetch } from "@/lib/api-client";
import { useEffect, useState } from "react";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Alert from "@cloudscape-design/components/alert";
import Modal from "@cloudscape-design/components/modal";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Checkbox from "@cloudscape-design/components/checkbox";
import Tabs from "@cloudscape-design/components/tabs";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Header from "@cloudscape-design/components/header";
import { CrossServiceLinks, CROSS_SERVICE_LINKS } from "@/components/CrossServiceLinks";
import { useRouter } from "next/navigation";
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";

interface Trail {
  Name: string;
  S3BucketName?: string;
  HomeRegion?: string;
  IsMultiRegionTrail?: boolean;
  LogFileValidationEnabled?: boolean;
  IsLogging?: boolean;
}

interface TrailEvent {
  EventId?: string;
  EventName?: string;
  EventTime?: string;
  Username?: string;
  EventSource?: string;
  Resources?: { TypeName?: string; ResourceName?: string }[];
}

export default function CloudTrailPage() {
  const [trails, setTrails] = useState<Trail[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("trails");
  const [createModal, setCreateModal] = useState(false);
  const [trailName, setTrailName] = useState("");
  const [s3BucketName, setS3BucketName] = useState("");
  const [isMultiRegion, setIsMultiRegion] = useState(false);
  const [enableLogValidation, setEnableLogValidation] = useState(true);
  const [creating, setCreating] = useState(false);
  const [trailNameError, setTrailNameError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [trailToDelete, setTrailToDelete] = useState("");
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [events, setEvents] = useState<TrailEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState("");

  const fetchTrails = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/cloudtrail");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch trails");
      setTrails(data.trails || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch trails");
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    setEventsLoading(true);
    setEventsError("");
    try {
      const res = await apiFetch("/api/cloudtrail?action=lookupEvents");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch events");
      setEvents(data.events || []);
    } catch (err) {
      setEventsError(err instanceof Error ? err.message : "Failed to fetch events");
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      fetchTrails();
    });
  }, []);

  useEffect(() => {
    if (activeTab === "events") {
      queueMicrotask(() => {
        fetchEvents();
      });
    }
  }, [activeTab]);

  const createTrail = async () => {
    if (!trailName.trim()) {
      setTrailNameError("Trail name is required");
      return;
    }
    setTrailNameError(null);
    setCreating(true);
    try {
      const res = await apiFetch("/api/cloudtrail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trailName,
          s3BucketName,
          isMultiRegionTrail: isMultiRegion,
          enableLogFileValidation: enableLogValidation,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create trail");
      }
      setCreateModal(false);
      setTrailName("");
      setS3BucketName("");
      setIsMultiRegion(false);
      setEnableLogValidation(true);
      fetchTrails();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create trail");
    } finally {
      setCreating(false);
    }
  };

  const toggleLogging = async (name: string, isLogging: boolean) => {
    try {
      const res = await apiFetch("/api/cloudtrail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: isLogging ? "stopLogging" : "startLogging", name }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to toggle logging");
      }
      fetchTrails();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle logging");
    }
  };

  const openDeleteModal = (name: string) => {
    setTrailToDelete(name);
    setDeleteConfirmName("");
    setDeleteError("");
    setDeleteModal(true);
  };

  const deleteTrail = async () => {
    if (deleteConfirmName !== trailToDelete) {
      setDeleteError("Trail name does not match");
      return;
    }
    try {
      const res = await apiFetch(`/api/cloudtrail?name=${encodeURIComponent(trailToDelete)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete trail");
      }
      setDeleteModal(false);
      fetchTrails();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete trail");
    }
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="AWS CloudTrail"
          serviceIcon={SERVICE_ICONS["/cloudtrail"]?.small}
          counter={0}
          primaryAction=<button
            type="button"
            className="aws-service-page__create"
            onClick={() => router.push("/cloudtrail/create")}
          >
            Create trail
          </button>
        />

        {error && (
          <Alert type="error" onDismiss={() => setError("")}>
            {error}
          </Alert>
        )}

        <Tabs
          activeTabId={activeTab}
          onChange={(e) => setActiveTab(e.detail.activeTabId)}
          tabs={[
            {
              id: "trails",
              label: "Trails",
              content: (
                <Table
                  header={
                    <Header
                      variant="h2"
                      actions={
                        <Button variant="primary" onClick={() => setCreateModal(true)}>
                          Create trail
                        </Button>
                      }
                    >
                      Trails ({trails.length})
                    </Header>
                  }
                  items={trails}
                  columnDefinitions={[
                    { header: "Name", cell: (item) => item.Name },
                    { header: "S3 bucket", cell: (item) => item.S3BucketName || "—" },
                    { header: "Home region", cell: (item) => item.HomeRegion || "—" },
                    {
                      header: "Multi-region",
                      cell: (item) => (item.IsMultiRegionTrail ? "Yes" : "No"),
                    },
                    {
                      header: "Log file validation",
                      cell: (item) => (item.LogFileValidationEnabled ? "Yes" : "No"),
                    },
                    {
                      header: "Status",
                      cell: (item) =>
                        item.IsLogging ? (
                          <StatusIndicator type="success">Logging</StatusIndicator>
                        ) : (
                          <StatusIndicator type="stopped">Not logging</StatusIndicator>
                        ),
                    },
                    {
                      header: "Actions",
                      cell: (item) => (
                        <SpaceBetween direction="horizontal" size="xs">
                          <Button
                            onClick={() => toggleLogging(item.Name, item.IsLogging ?? false)}
                            formAction="none"
                          >
                            {item.IsLogging ? "Stop" : "Start"}
                          </Button>
                          <Button onClick={() => openDeleteModal(item.Name)} formAction="none">
                            Delete
                          </Button>
                        </SpaceBetween>
                      ),
                    },
                  ]}
                  loading={loading}
                  empty={<Box textAlign="center">No trails found.</Box>}
                />
              ),
            },
            {
              id: "events",
              label: "Event history",
              content: (
                <Container className="aws-table-card">
                  {eventsError && (
                    <Alert type="error" onDismiss={() => setEventsError("")}>
                      {eventsError}
                    </Alert>
                  )}
                  <Table
                    header={
                      <Header variant="h2">Recent CloudTrail Events ({events.length})</Header>
                    }
                    items={events}
                    columnDefinitions={[
                      { header: "Event name", cell: (e) => e.EventName || "—" },
                      {
                        header: "Event time",
                        cell: (e) => (e.EventTime ? new Date(e.EventTime).toLocaleString() : "—"),
                      },
                      { header: "Username", cell: (e) => e.Username || "—" },
                      { header: "Event source", cell: (e) => e.EventSource || "—" },
                      {
                        header: "Resources",
                        cell: (e) => e.Resources?.map((r) => r.ResourceName).join(", ") || "—",
                      },
                      {
                        header: "Event ID",
                        cell: (e) => (
                          <span style={{ fontFamily: "monospace", fontSize: "12px" }}>
                            {e.EventId || "—"}
                          </span>
                        ),
                      },
                    ]}
                    loading={eventsLoading}
                    empty={<Box textAlign="center">No events found.</Box>}
                  />
                </Container>
              ),
            },
          ]}
        />

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create trail"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createTrail} loading={creating}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m">
            <FormField
              label={
                <>
                  Trail name <span style={{ color: "red" }}>*</span>
                </>
              }
              constraintText="Required"
              errorText={trailNameError}
            >
              <Input
                value={trailName}
                onChange={(e) => {
                  setTrailName(e.detail.value);
                  setTrailNameError(null);
                }}
                placeholder="my-trail"
              />
            </FormField>
            <FormField label="S3 bucket name">
              <Input
                value={s3BucketName}
                onChange={(e) => setS3BucketName(e.detail.value)}
                placeholder="cloudtrail-logs"
              />
            </FormField>
            <Checkbox checked={isMultiRegion} onChange={(e) => setIsMultiRegion(e.detail.checked)}>
              Multi-region trail
            </Checkbox>
            <Checkbox
              checked={enableLogValidation}
              onChange={(e) => setEnableLogValidation(e.detail.checked)}
            >
              Enable log file validation
            </Checkbox>
          </SpaceBetween>
        </Modal>

        <Modal
          visible={deleteModal}
          onDismiss={() => setDeleteModal(false)}
          header="Delete trail"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setDeleteModal(false)}>Cancel</Button>
              <Button
                variant="primary"
                onClick={deleteTrail}
                disabled={deleteConfirmName !== trailToDelete}
              >
                Delete
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m">
            <Box>
              To confirm deletion, type <b>{trailToDelete}</b> in the field below.
            </Box>
            {deleteError && <Alert type="error">{deleteError}</Alert>}
            <FormField label="Trail name">
              <Input
                value={deleteConfirmName}
                onChange={(e) => {
                  setDeleteConfirmName(e.detail.value);
                  setDeleteError("");
                }}
                placeholder={trailToDelete}
              />
            </FormField>
          </SpaceBetween>
        </Modal>
      </SpaceBetween>

      <CrossServiceLinks links={CROSS_SERVICE_LINKS["/cloudtrail"] || []} />
    </div>
  );
}
