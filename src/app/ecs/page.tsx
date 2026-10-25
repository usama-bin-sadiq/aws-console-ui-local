"use client";
import { apiFetch } from "@/lib/api-client";
import { useCallback, useEffect, useState } from "react";
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
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Header from "@cloudscape-design/components/header";
import TruncatedText from "@/components/TruncatedText";
import { useRouter } from "next/navigation";
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";

interface ECSServiceSummary {
  serviceName: string;
  status?: string;
  desiredCount?: number;
  runningCount?: number;
  pendingCount?: number;
  clusterArn?: string;
}

interface TaskDefinitionSummary {
  family?: string;
  revision?: number;
  status?: string;
  registeredAt?: string;
  taskDefinitionArn?: string;
}

interface TaskSummary {
  taskArn?: string;
  lastStatus?: string;
  desiredStatus?: string;
  clusterArn?: string;
  serviceName?: string;
}

export default function ECSPage() {
  const [clusterInput, setClusterInput] = useState("");

  const router = useRouter();
  const [clusterName, setClusterName] = useState("default");
  const [services, setServices] = useState<ECSServiceSummary[]>([]);
  const [taskDefs, setTaskDefs] = useState<TaskDefinitionSummary[]>([]);
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingTaskDefs, setLoadingTaskDefs] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Service actions
  const [serviceModal, setServiceModal] = useState(false);
  const [serviceNameInput, setServiceNameInput] = useState("");
  const [serviceTaskDef, setServiceTaskDef] = useState("");
  const [serviceDesired, setServiceDesired] = useState("1");
  const [serviceNameError, setServiceNameError] = useState<string | null>(null);

  // Task definition actions
  const [taskDefModal, setTaskDefModal] = useState(false);
  const [taskDefFamily, setTaskDefFamily] = useState("");
  const [taskDefJson, setTaskDefJson] = useState("{}");
  const [taskDefFamilyError, setTaskDefFamilyError] = useState<string | null>(null);

  // Tasks actions
  const [tasksLoaded, setTasksLoaded] = useState(false);

  const fetchServices = useCallback(
    async (cluster = clusterName) => {
      if (!cluster) return;
      setLoadingServices(true);
      setError(null);
      try {
        const res = await apiFetch("/api/ecs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "listServices", cluster }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setServices(data.services || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load services");
      } finally {
        setLoadingServices(false);
      }
    },
    [clusterName],
  );

  const createService = async () => {
    let hasError = false;
    if (!serviceNameInput.trim()) {
      setServiceNameError("Service name is required");
      hasError = true;
    } else {
      setServiceNameError(null);
    }
    if (hasError) return;
    const cluster = clusterInput.trim() || clusterName;
    try {
      const response = await apiFetch("/api/ecs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createService",
          cluster,
          serviceName: serviceNameInput,
          taskDefinition: serviceTaskDef,
          desiredCount: parseInt(serviceDesired) || 1,
        }),
      });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || "Failed to create ECS service");
      setServiceModal(false);
      setServiceNameInput("");
      fetchServices(cluster);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create service");
    }
  };

  const deleteService = async (serviceName: string) => {
    const cluster = clusterInput.trim() || clusterName;
    try {
      await apiFetch("/api/ecs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteService", cluster, serviceName, force: true }),
      });
      fetchServices(cluster);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete service");
    }
  };

  const fetchTaskDefinitions = useCallback(async () => {
    setLoadingTaskDefs(true);
    try {
      const res = await apiFetch("/api/ecs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "listTaskDefinitions", status: "ACTIVE" }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const arns = data.taskDefinitionArns || [];
      const defs: TaskDefinitionSummary[] = arns.map((arn: string) => ({
        family: arn.split("/").pop() || arn,
        revision: 1,
        status: "ACTIVE",
        registeredAt: new Date().toISOString(),
        taskDefinitionArn: arn,
      }));
      setTaskDefs(defs);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load task definitions");
    } finally {
      setLoadingTaskDefs(false);
    }
  }, []);

  const registerTaskDef = async () => {
    if (!taskDefFamily.trim()) {
      setTaskDefFamilyError("Family name is required");
      return;
    }
    setTaskDefFamilyError(null);
    try {
      const containerDefinitions = JSON.parse(taskDefJson);
      if (!Array.isArray(containerDefinitions))
        throw new Error("Container definitions must be a JSON array");
      if (!taskDefFamily.trim()) throw new Error("Task definition family is required");
      const response = await apiFetch("/api/ecs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "registerTaskDefinition",
          family: taskDefFamily,
          containerDefinitions,
        }),
      });
      const data = await response.json();
      if (!response.ok || data.error)
        throw new Error(data.error || "Failed to register task definition");
      setTaskDefModal(false);
      setTaskDefFamily("");
      setTaskDefJson("{}");
      fetchTaskDefinitions();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to register task definition");
    }
  };

  const fetchTasks = async () => {
    if (!clusterInput.trim() && !clusterName) return;
    const cluster = clusterInput.trim() || clusterName;
    setLoadingTasks(true);
    setTasksLoaded(false);
    try {
      const res = await apiFetch("/api/ecs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "listTasks", cluster }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const arns = data.taskArns || [];
      if (arns.length === 0) {
        setTasks([]);
        setTasksLoaded(true);
        return;
      }
      const descRes = await apiFetch("/api/ecs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "describeTasks", cluster, tasks: arns }),
      });
      const descData = await descRes.json();
      setTasks(descData.tasks || []);
      setTasksLoaded(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      fetchServices();
    });
    queueMicrotask(() => {
      fetchTaskDefinitions();
    });
  }, [fetchServices, fetchTaskDefinitions]);

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="Amazon ECS — Container Services"
          serviceIcon={SERVICE_ICONS["/ecs"]?.small}
          counter={0}
          primaryAction=<button
            type="button"
            className="aws-service-page__create"
            onClick={() => router.push("/ecs/create")}
          >
            Create cluster
          </button>
        />
        {error && (
          <Alert type="error" onDismiss={() => setError(null)} header="Error">
            {error}
          </Alert>
        )}

        {/* Cluster Selector */}
        <Container>
          <SpaceBetween size="s">
            <FormField label="Cluster name" description="Used for service and task queries">
              <SpaceBetween direction="horizontal" size="xs">
                <Input
                  value={clusterInput}
                  onChange={(e) => setClusterInput(e.detail.value)}
                  placeholder="my-cluster"
                />
                <Button onClick={() => setClusterName(clusterInput.trim() || "default")}>
                  Set cluster
                </Button>
              </SpaceBetween>
            </FormField>
          </SpaceBetween>
        </Container>

        {/* Services Section */}
        <Table
          header={
            <Header
              variant="h2"
              actions={
                <Button variant="primary" onClick={() => setServiceModal(true)}>
                  Create service
                </Button>
              }
            >
              Services in {clusterInput.trim() || clusterName}
            </Header>
          }
          items={services}
          loading={loadingServices}
          columnDefinitions={[
            { header: "Service name", cell: (i: ECSServiceSummary) => i.serviceName },
            {
              header: "Status",
              cell: (i: ECSServiceSummary) => (
                <StatusIndicator type={i.status === "ACTIVE" ? "success" : "warning"}>
                  {i.status || "—"}
                </StatusIndicator>
              ),
            },
            { header: "Desired", cell: (i: ECSServiceSummary) => i.desiredCount ?? "—" },
            { header: "Running", cell: (i: ECSServiceSummary) => i.runningCount ?? "—" },
            {
              header: "Actions",
              cell: (i: ECSServiceSummary) => (
                <SpaceBetween direction="horizontal" size="xs">
                  <Button formAction="none" onClick={() => deleteService(i.serviceName)}>
                    Delete
                  </Button>
                </SpaceBetween>
              ),
            },
          ]}
          empty={<Box textAlign="center">No services found.</Box>}
        />

        {/* Task Definitions Section */}
        <Table
          header={
            <Header
              variant="h2"
              actions={
                <Button variant="primary" onClick={() => setTaskDefModal(true)}>
                  Register task definition
                </Button>
              }
            >
              Task Definitions
            </Header>
          }
          items={taskDefs}
          loading={loadingTaskDefs}
          columnDefinitions={[
            { header: "Family", cell: (i: TaskDefinitionSummary) => i.family || "—" },
            { header: "Revision", cell: (i: TaskDefinitionSummary) => i.revision ?? "—" },
            {
              header: "Status",
              cell: (i: TaskDefinitionSummary) => (
                <StatusIndicator type="success">{i.status || "—"}</StatusIndicator>
              ),
            },
            {
              header: "ARN",
              cell: (i: TaskDefinitionSummary) => (
                <TruncatedText>{i.taskDefinitionArn || "—"}</TruncatedText>
              ),
            },
          ]}
          empty={<Box textAlign="center">No task definitions found.</Box>}
        />

        {/* Running Tasks Section */}
        <Table
          header={
            <Header
              variant="h2"
              actions={
                <Button onClick={fetchTasks} loading={loadingTasks}>
                  Load running tasks
                </Button>
              }
            >
              Running Tasks
            </Header>
          }
          items={tasks}
          loading={loadingTasks}
          columnDefinitions={[
            {
              header: "Task ARN",
              cell: (i: TaskSummary) => <TruncatedText>{i.taskArn || "—"}</TruncatedText>,
            },
            {
              header: "Status",
              cell: (i: TaskSummary) => (
                <StatusIndicator
                  type={
                    i.lastStatus === "RUNNING"
                      ? "success"
                      : i.lastStatus === "STOPPED"
                        ? "warning"
                        : "in-progress"
                  }
                >
                  {i.lastStatus || "—"}
                </StatusIndicator>
              ),
            },
            { header: "Desired", cell: (i: TaskSummary) => i.desiredStatus || "—" },
            { header: "Service", cell: (i: TaskSummary) => i.serviceName || "—" },
          ]}
          empty={
            <Box textAlign="center">
              {tasksLoaded
                ? "No tasks found."
                : "Click Load running tasks to fetch tasks for the selected cluster."}
            </Box>
          }
        />

        {/* Service Create Modal */}
        <Modal
          visible={serviceModal}
          onDismiss={() => setServiceModal(false)}
          header="Create service"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setServiceModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createService}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m">
            <FormField
              label={
                <>
                  Service name <span style={{ color: "red" }}>*</span>
                </>
              }
              constraintText="Required"
              errorText={serviceNameError}
            >
              <Input
                value={serviceNameInput}
                onChange={(e) => {
                  setServiceNameInput(e.detail.value);
                  setServiceNameError(null);
                }}
                placeholder="my-service"
              />
            </FormField>
            <FormField label="Task definition">
              <Input
                value={serviceTaskDef}
                onChange={(e) => setServiceTaskDef(e.detail.value)}
                placeholder="my-task-definition:1"
              />
            </FormField>
            <FormField label="Desired count">
              <Input
                value={serviceDesired}
                onChange={(e) => setServiceDesired(e.detail.value)}
                placeholder="1"
              />
            </FormField>
          </SpaceBetween>
        </Modal>

        {/* Task Definition Modal */}
        <Modal
          visible={taskDefModal}
          onDismiss={() => setTaskDefModal(false)}
          header="Register task definition"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setTaskDefModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={registerTaskDef}>
                Register
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m">
            <FormField
              label={
                <>
                  Family name <span style={{ color: "red" }}>*</span>
                </>
              }
              constraintText="Required"
              errorText={taskDefFamilyError}
            >
              <Input
                value={taskDefFamily}
                onChange={(e) => {
                  setTaskDefFamily(e.detail.value);
                  setTaskDefFamilyError(null);
                }}
                placeholder="my-family"
              />
            </FormField>
            <FormField label="Container definitions (JSON)">
              <Textarea
                value={taskDefJson}
                onChange={(e) => setTaskDefJson(e.detail.value)}
                rows={6}
                placeholder='[{"name":"app","image":"nginx","memory":512}]'
              />
            </FormField>
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
