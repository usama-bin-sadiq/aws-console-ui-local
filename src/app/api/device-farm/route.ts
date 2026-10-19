// AWS Device Farm — projects, device pools, devices and test run workflows.
// Commands: @aws-sdk/client-device-farm (ListProjects, GetProject, CreateProject,
// DeleteProject, ListDevicePools, CreateDevicePool, ListDevices, ListRuns,
// GetRun, ScheduleRun)
import { NextResponse } from "next/server";
import {
  DeviceFarmClient,
  ListProjectsCommand,
  GetProjectCommand,
  CreateProjectCommand,
  DeleteProjectCommand,
  ListDevicePoolsCommand,
  CreateDevicePoolCommand,
  ListDevicesCommand,
  ListRunsCommand,
  GetRunCommand,
  ScheduleRunCommand,
} from "@aws-sdk/client-device-farm";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";

function unavailable(error: unknown) {
  const adapter = getAdapterStatus();
  return handleAdapterError(error, adapter.mode, adapter.endpoint);
}

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const client = getUserClientFromRequest(DeviceFarmClient, request);
    const res = await client.send(new ListProjectsCommand({}));
    const projects = res.projects || [];
    return NextResponse.json({ items: projects, projects, count: projects.length });
  } catch (error: unknown) {
    return unavailable(error);
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const client = getUserClientFromRequest(DeviceFarmClient, request);
    const body = await request.json();

    switch (body.action) {
      case "getProject": {
        const res = await client.send(new GetProjectCommand({ arn: body.arn }));
        return NextResponse.json({ project: res.project });
      }
      case "createProject": {
        const res = await client.send(new CreateProjectCommand({ name: body.name }));
        return NextResponse.json({ project: res.project });
      }
      case "listDevicePools": {
        const res = await client.send(
          new ListDevicePoolsCommand({ arn: body.arn, type: body.type || "PUBLIC" }),
        );
        return NextResponse.json({
          items: res.devicePools || [],
          devicePools: res.devicePools || [],
        });
      }
      case "createDevicePool": {
        const res = await client.send(
          new CreateDevicePoolCommand({
            projectArn: body.projectArn,
            name: body.name,
            rules: body.rules || [],
            maxDevices: body.maxDevices,
          }),
        );
        return NextResponse.json({ devicePool: res.devicePool });
      }
      case "listDevices": {
        const res = await client.send(
          new ListDevicesCommand({
            arn: body.arn,
            nextToken: body.nextToken,
            filters: body.filters,
          }),
        );
        return NextResponse.json({
          items: res.devices || [],
          devices: res.devices || [],
          nextToken: res.nextToken,
        });
      }
      case "listRuns": {
        const res = await client.send(new ListRunsCommand({ arn: body.arn }));
        return NextResponse.json({ items: res.runs || [], runs: res.runs || [] });
      }
      case "getRun": {
        const res = await client.send(new GetRunCommand({ arn: body.arn }));
        return NextResponse.json({ run: res.run });
      }
      case "scheduleRun": {
        const res = await client.send(
          new ScheduleRunCommand({
            projectArn: body.projectArn,
            appArn: body.appArn,
            devicePoolArn: body.devicePoolArn,
            deviceSelectionConfiguration: body.deviceSelectionConfiguration,
            test: body.test,
            name: body.name,
          }),
        );
        return NextResponse.json({ run: res.run });
      }
      default:
        return NextResponse.json(
          {
            error: `Unsupported action "${body.action}". Supported: getProject, createProject, listDevicePools, createDevicePool, listDevices, listRuns, getRun, scheduleRun`,
          },
          { status: 400 },
        );
    }
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const client = getUserClientFromRequest(DeviceFarmClient, request);
    const { searchParams } = new URL(request.url);
    const arn = searchParams.get("arn");
    if (!arn) {
      return NextResponse.json({ error: "Missing ?arn= project ARN" }, { status: 400 });
    }
    await client.send(new DeleteProjectCommand({ arn }));
    return NextResponse.json({ success: true, arn });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
