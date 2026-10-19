import { NextResponse } from "next/server";
import {
  // Compute Environments
  CreateComputeEnvironmentCommand,
  DescribeComputeEnvironmentsCommand,
  DeleteComputeEnvironmentCommand,
  UpdateComputeEnvironmentCommand,
  // Job Queues
  CreateJobQueueCommand,
  DescribeJobQueuesCommand,
  DeleteJobQueueCommand,
  UpdateJobQueueCommand,
  // Job Definitions
  RegisterJobDefinitionCommand,
  DescribeJobDefinitionsCommand,
  DeregisterJobDefinitionCommand,
  // Jobs
  SubmitJobCommand,
  DescribeJobsCommand,
  ListJobsCommand,
  TerminateJobCommand,
  CancelJobCommand,
  // Tags
  TagResourceCommand,
  UntagResourceCommand,
  ListTagsForResourceCommand,
} from "@aws-sdk/client-batch";
import { BatchClient } from "@aws-sdk/client-batch";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const batchClient = getUserClientFromRequest(BatchClient, request);
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    // Compute Environments
    if (action === "describeComputeEnvironments") {
      const computeEnvironment = searchParams.get("computeEnvironment");
      const nextToken = searchParams.get("nextToken");
      const res = await batchClient.send(
        new DescribeComputeEnvironmentsCommand({
          computeEnvironments: computeEnvironment ? [computeEnvironment] : undefined,
          nextToken: nextToken || undefined,
        }),
      );
      return NextResponse.json({
        computeEnvironments: res.computeEnvironments || [],
        nextToken: res.nextToken,
      });
    }

    // Job Queues
    if (action === "describeJobQueues") {
      const jobQueue = searchParams.get("jobQueue");
      const nextToken = searchParams.get("nextToken");
      const res = await batchClient.send(
        new DescribeJobQueuesCommand({
          jobQueues: jobQueue ? [jobQueue] : undefined,
          nextToken: nextToken || undefined,
        }),
      );
      return NextResponse.json({
        jobQueues: res.jobQueues || [],
        nextToken: res.nextToken,
      });
    }

    // Job Definitions
    if (action === "describeJobDefinitions") {
      const jobDefinitionName = searchParams.get("jobDefinitionName");
      const status = searchParams.get("status");
      const nextToken = searchParams.get("nextToken");
      const res = await batchClient.send(
        new DescribeJobDefinitionsCommand({
          jobDefinitionName: jobDefinitionName || undefined,
          status: status || undefined,
          nextToken: nextToken || undefined,
        }),
      );
      return NextResponse.json({
        jobDefinitions: res.jobDefinitions || [],
        nextToken: res.nextToken,
      });
    }

    // Jobs
    if (action === "describeJobs") {
      const jobIds = (searchParams.get("jobIds") || "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
      if (jobIds.length === 0) {
        return NextResponse.json({ error: "jobIds required" }, { status: 400 });
      }
      const res = await batchClient.send(new DescribeJobsCommand({ jobs: jobIds }));
      return NextResponse.json({ jobs: res.jobs || [] });
    }

    if (action === "listJobs") {
      const jobQueue = searchParams.get("jobQueue");
      const jobStatus = searchParams.get("jobStatus");
      const nextToken = searchParams.get("nextToken");
      const maxResultsRaw = searchParams.get("maxResults");
      const filters: Array<{ name: string; values: string[] }> = [];
      if (jobQueue) filters.push({ name: "JOB_QUEUE", values: [jobQueue] });
      if (jobStatus) {
        // Accept a comma-separated list so callers can request several
        // statuses (e.g. every active status) in a single request.
        const statuses = jobStatus
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        if (statuses.length > 0) {
          filters.push({ name: "JOB_STATUS", values: statuses });
        }
      }
      const maxResults = maxResultsRaw ? Number(maxResultsRaw) : undefined;
      const res = await batchClient.send(
        new ListJobsCommand({
          filters: filters.length > 0 ? filters : undefined,
          nextToken: nextToken || undefined,
          maxResults:
            maxResults !== undefined && Number.isFinite(maxResults) && maxResults > 0
              ? maxResults
              : undefined,
        }),
      );
      return NextResponse.json({
        jobSummaryList: res.jobSummaryList || [],
        nextToken: res.nextToken,
      });
    }

    // Tags
    if (action === "listTags") {
      const arn = searchParams.get("arn");
      if (!arn) {
        return NextResponse.json({ error: "arn required" }, { status: 400 });
      }
      const res = await batchClient.send(new ListTagsForResourceCommand({ resourceArn: arn }));
      return NextResponse.json({ tags: res.tags || {} });
    }

    // Default: list all compute environments and job queues
    const [ceRes, jqRes, jdRes] = await Promise.all([
      batchClient.send(new DescribeComputeEnvironmentsCommand({})),
      batchClient.send(new DescribeJobQueuesCommand({})),
      batchClient.send(new DescribeJobDefinitionsCommand({})),
    ]);
    return NextResponse.json({
      computeEnvironments: ceRes.computeEnvironments || [],
      jobQueues: jqRes.jobQueues || [],
      jobDefinitions: jdRes.jobDefinitions || [],
    });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const batchClient = getUserClientFromRequest(BatchClient, request);
    const body = await request.json();
    const { action } = body;

    // Compute Environments
    if (action === "createComputeEnvironment") {
      const {
        computeEnvironmentName,
        type = "MANAGED",
        state = "ENABLED",
        computeResources,
        serviceRole,
        tags,
        unmanagedvCpus,
        eksConfiguration,
      } = body;

      if (
        typeof computeEnvironmentName !== "string" ||
        computeEnvironmentName.trim().length === 0
      ) {
        return NextResponse.json({ error: "computeEnvironmentName required" }, { status: 400 });
      }
      if (type === "MANAGED" && !computeResources) {
        return NextResponse.json(
          { error: "computeResources required for a MANAGED compute environment" },
          { status: 400 },
        );
      }

      const res = await batchClient.send(
        new CreateComputeEnvironmentCommand({
          computeEnvironmentName,
          type,
          state,
          computeResources,
          serviceRole,
          tags,
          unmanagedvCpus,
          eksConfiguration,
        }),
      );
      return NextResponse.json({
        computeEnvironmentArn: res.computeEnvironmentArn,
        computeEnvironmentName: res.computeEnvironmentName,
      });
    }

    if (action === "updateComputeEnvironment") {
      const { computeEnvironment, state, computeResources, serviceRole, unmanagedvCpus } = body;

      if (typeof computeEnvironment !== "string" || !computeEnvironment.trim()) {
        return NextResponse.json({ error: "computeEnvironment required" }, { status: 400 });
      }

      await batchClient.send(
        new UpdateComputeEnvironmentCommand({
          computeEnvironment,
          state,
          computeResources,
          serviceRole,
          unmanagedvCpus,
        }),
      );
      return NextResponse.json({ success: true });
    }

    // Job Queues
    if (action === "createJobQueue") {
      const {
        jobQueueName,
        state = "ENABLED",
        schedulingPolicyArn,
        priority,
        computeEnvironmentOrder = [],
        serviceEnvironmentOrder,
        jobQueueType,
        tags,
        jobStateTimeLimitActions,
      } = body;

      if (typeof jobQueueName !== "string" || jobQueueName.trim().length === 0) {
        return NextResponse.json({ error: "jobQueueName required" }, { status: 400 });
      }
      if (typeof priority !== "number" || !Number.isFinite(priority)) {
        return NextResponse.json({ error: "priority must be a number" }, { status: 400 });
      }
      if (!Array.isArray(computeEnvironmentOrder) || computeEnvironmentOrder.length === 0) {
        return NextResponse.json(
          { error: "computeEnvironmentOrder must contain at least one compute environment" },
          { status: 400 },
        );
      }

      const res = await batchClient.send(
        new CreateJobQueueCommand({
          jobQueueName,
          state,
          schedulingPolicyArn,
          priority,
          computeEnvironmentOrder,
          serviceEnvironmentOrder,
          jobQueueType,
          tags,
          jobStateTimeLimitActions,
        }),
      );
      return NextResponse.json({
        jobQueueName: res.jobQueueName,
        jobQueueArn: res.jobQueueArn,
      });
    }

    if (action === "updateJobQueue") {
      const {
        jobQueue,
        state,
        schedulingPolicyArn,
        priority,
        computeEnvironmentOrder,
        serviceEnvironmentOrder,
      } = body;

      if (typeof jobQueue !== "string" || !jobQueue.trim()) {
        return NextResponse.json({ error: "jobQueue required" }, { status: 400 });
      }

      await batchClient.send(
        new UpdateJobQueueCommand({
          jobQueue,
          state,
          schedulingPolicyArn,
          priority,
          computeEnvironmentOrder,
          serviceEnvironmentOrder,
        }),
      );
      return NextResponse.json({ success: true });
    }

    // Job Definitions
    if (action === "registerJobDefinition") {
      const {
        jobDefinitionName,
        type,
        parameters,
        schedulingPriority,
        retryStrategy,
        containerProperties,
        timeout,
        nodeProperties,
        tags,
        propagateTags,
        platformCapabilities,
        ecsProperties,
        eksProperties,
        consumableResourceProperties,
      } = body;

      if (typeof jobDefinitionName !== "string" || jobDefinitionName.trim().length === 0) {
        return NextResponse.json({ error: "jobDefinitionName required" }, { status: 400 });
      }
      if (type !== "container" && type !== "multinode") {
        return NextResponse.json(
          { error: "type must be either 'container' or 'multinode'" },
          { status: 400 },
        );
      }
      if (type === "container" && !containerProperties?.image) {
        return NextResponse.json(
          { error: "containerProperties.image is required for container job definitions" },
          { status: 400 },
        );
      }

      const res = await batchClient.send(
        new RegisterJobDefinitionCommand({
          jobDefinitionName,
          type,
          parameters,
          schedulingPriority,
          retryStrategy,
          containerProperties,
          timeout,
          nodeProperties,
          tags,
          propagateTags,
          platformCapabilities,
          ecsProperties,
          eksProperties,
          consumableResourceProperties,
        }),
      );
      return NextResponse.json({
        jobDefinitionName: res.jobDefinitionName,
        jobDefinitionArn: res.jobDefinitionArn,
        revision: res.revision,
      });
    }

    // Jobs
    if (action === "submitJob") {
      const {
        jobName,
        jobQueue,
        jobDefinition,
        arrayProperties,
        dependsOn,
        parameters,
        containerOverrides,
        nodeOverrides,
        retryStrategy,
        propagateTags,
        timeout,
        tags,
        schedulingPriorityOverride,
        shareIdentifier,
      } = body;

      if (typeof jobName !== "string" || jobName.trim().length === 0) {
        return NextResponse.json({ error: "jobName required" }, { status: 400 });
      }
      if (typeof jobQueue !== "string" || jobQueue.trim().length === 0) {
        return NextResponse.json({ error: "jobQueue required" }, { status: 400 });
      }
      if (typeof jobDefinition !== "string" || jobDefinition.trim().length === 0) {
        return NextResponse.json({ error: "jobDefinition required" }, { status: 400 });
      }

      const res = await batchClient.send(
        new SubmitJobCommand({
          jobName,
          jobQueue,
          jobDefinition,
          arrayProperties,
          dependsOn,
          parameters,
          containerOverrides,
          nodeOverrides,
          retryStrategy,
          propagateTags,
          timeout,
          tags,
          schedulingPriorityOverride,
          shareIdentifier,
        }),
      );
      return NextResponse.json({ jobId: res.jobId, jobArn: res.jobArn });
    }

    if (action === "terminateJob" || action === "cancelJob") {
      const { jobId, reason } = body;
      if (typeof jobId !== "string" || !jobId.trim()) {
        return NextResponse.json({ error: "jobId required" }, { status: 400 });
      }
      if (typeof reason !== "string" || !reason.trim()) {
        return NextResponse.json(
          { error: "reason is required when terminating or cancelling a job" },
          { status: 400 },
        );
      }
      if (action === "terminateJob") {
        await batchClient.send(new TerminateJobCommand({ jobId, reason }));
      } else {
        await batchClient.send(new CancelJobCommand({ jobId, reason }));
      }
      return NextResponse.json({ success: true });
    }

    // Tags
    if (action === "tagResource") {
      const { resourceArn, tags } = body;
      if (typeof resourceArn !== "string" || !resourceArn.trim()) {
        return NextResponse.json({ error: "resourceArn required" }, { status: 400 });
      }
      if (
        typeof tags !== "object" ||
        tags === null ||
        Array.isArray(tags) ||
        Object.keys(tags).length === 0
      ) {
        return NextResponse.json(
          { error: "tags must be a non-empty object of key/value pairs" },
          { status: 400 },
        );
      }
      await batchClient.send(
        new TagResourceCommand({ resourceArn, tags: tags as Record<string, string> }),
      );
      return NextResponse.json({ success: true });
    }

    if (action === "untagResource") {
      const { resourceArn, tagKeys } = body;
      if (typeof resourceArn !== "string" || !resourceArn.trim()) {
        return NextResponse.json({ error: "resourceArn required" }, { status: 400 });
      }
      if (!Array.isArray(tagKeys) || tagKeys.length === 0) {
        return NextResponse.json(
          { error: "tagKeys must be a non-empty array of tag keys" },
          { status: 400 },
        );
      }
      await batchClient.send(
        new UntagResourceCommand({ resourceArn, tagKeys: tagKeys as string[] }),
      );
      return NextResponse.json({ success: true });
    }

    // Unknown actions must fail loudly — never fall through to a mutation
    return NextResponse.json({ error: `Unsupported action: ${String(action)}` }, { status: 400 });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const batchClient = getUserClientFromRequest(BatchClient, request);
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");
    const type = searchParams.get("type"); // "computeEnvironment" | "jobQueue" | "jobDefinition"

    if (!name || !type) {
      return NextResponse.json({ error: "name and type required" }, { status: 400 });
    }

    if (type === "computeEnvironment") {
      await batchClient.send(new DeleteComputeEnvironmentCommand({ computeEnvironment: name }));
    } else if (type === "jobQueue") {
      await batchClient.send(new DeleteJobQueueCommand({ jobQueue: name }));
    } else if (type === "jobDefinition") {
      await batchClient.send(new DeregisterJobDefinitionCommand({ jobDefinition: name }));
    } else {
      return NextResponse.json({ error: `Invalid type: ${type}` }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
