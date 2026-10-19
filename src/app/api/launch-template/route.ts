import { NextResponse } from "next/server";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";
import {
  DescribeLaunchTemplatesCommand,
  DescribeLaunchTemplateVersionsCommand,
  CreateLaunchTemplateCommand,
  CreateLaunchTemplateVersionCommand,
  DeleteLaunchTemplateCommand,
  DeleteLaunchTemplateVersionsCommand,
  ModifyLaunchTemplateCommand,
} from "@aws-sdk/client-ec2";
import type {
  RequestLaunchTemplateData,
  LaunchTemplate,
  LaunchTemplateVersion,
} from "@aws-sdk/client-ec2";
import { EC2Client } from "@aws-sdk/client-ec2";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

// ─── Request shapes (JSON bodies are untrusted input) ─────────────────────────

interface RawTag {
  Key?: unknown;
  Value?: unknown;
}

interface PostBody {
  action?: unknown;
  launchTemplateName?: unknown;
  versionDescription?: unknown;
  launchTemplateData?: unknown;
  tags?: unknown;
  templateId?: unknown;
  templateName?: unknown;
  sourceVersion?: unknown;
  defaultVersion?: unknown;
  versions?: unknown;
}

type TagInput = { Key: string; Value: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function optionalVersion(value: unknown): string | undefined {
  if (typeof value === "string" && value.length > 0) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return undefined;
}

/** Returns null when the payload is not an array of { Key, Value } string pairs. */
function optionalTags(value: unknown): TagInput[] | null {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) return null;
  const tags: TagInput[] = [];
  for (const item of value as RawTag[]) {
    if (!isRecord(item) || typeof item.Key !== "string" || item.Key.length === 0) return null;
    tags.push({ Key: item.Key, Value: typeof item.Value === "string" ? item.Value : "" });
  }
  return tags;
}

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const ec2Client = getUserClientFromRequest(EC2Client, request);
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const templateId = searchParams.get("templateId") ?? undefined;
    const templateName = searchParams.get("templateName") ?? undefined;

    // Actions that address a single template must name it explicitly
    const requiresTarget =
      action === "describeTemplate" || action === "describeVersions" || action === "getVersion";
    if (requiresTarget && !templateId && !templateName) {
      return NextResponse.json(
        { error: "templateId or templateName is required" },
        { status: 400 },
      );
    }

    // Single template (detail page header + summary)
    if (action === "describeTemplate" && (templateId || templateName)) {
      const res = await ec2Client.send(
        new DescribeLaunchTemplatesCommand({
          LaunchTemplateIds: templateId ? [templateId] : undefined,
          LaunchTemplateNames: templateName ? [templateName] : undefined,
        }),
      );
      const template = res.LaunchTemplates?.[0];
      if (!template) {
        return NextResponse.json({ error: "Launch template not found" }, { status: 404 });
      }
      return NextResponse.json({ template });
    }

    // Every version of a template (detail page Versions tab)
    if (action === "describeVersions" && (templateId || templateName)) {
      const versions: LaunchTemplateVersion[] = [];
      let nextToken: string | undefined;
      do {
        const res = await ec2Client.send(
          new DescribeLaunchTemplateVersionsCommand({
            LaunchTemplateId: templateId,
            LaunchTemplateName: templateName,
            MaxResults: 100,
            NextToken: nextToken,
          }),
        );
        versions.push(...(res.LaunchTemplateVersions || []));
        nextToken = res.NextToken;
      } while (nextToken);
      return NextResponse.json({ versions });
    }

    // One version — accepts a number, "$Latest" or "$Default"
    if (action === "getVersion" && (templateId || templateName)) {
      const versionNumber = searchParams.get("versionNumber");
      if (!versionNumber) {
        return NextResponse.json({ error: "versionNumber is required" }, { status: 400 });
      }
      const res = await ec2Client.send(
        new DescribeLaunchTemplateVersionsCommand({
          LaunchTemplateId: templateId,
          LaunchTemplateName: templateName,
          Versions: [versionNumber],
        }),
      );
      const version = res.LaunchTemplateVersions?.[0];
      if (!version) {
        return NextResponse.json({ error: "Launch template version not found" }, { status: 404 });
      }
      return NextResponse.json({ version });
    }

    // Default: list all templates (paginated)
    const templates: LaunchTemplate[] = [];
    let nextToken: string | undefined;
    do {
      const res = await ec2Client.send(
        new DescribeLaunchTemplatesCommand({ NextToken: nextToken }),
      );
      templates.push(...(res.LaunchTemplates || []));
      nextToken = res.NextToken;
    } while (nextToken);
    return NextResponse.json({ templates });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const ec2Client = getUserClientFromRequest(EC2Client, request);
    const body = (await request.json()) as PostBody;
    const action = typeof body.action === "string" ? body.action : null;

    if (action === "create") {
      const launchTemplateName = optionalString(body.launchTemplateName);
      const versionDescription = optionalString(body.versionDescription);
      const tags = optionalTags(body.tags);

      if (!launchTemplateName) {
        return NextResponse.json({ error: "launchTemplateName is required" }, { status: 400 });
      }
      if (tags === null) {
        return NextResponse.json(
          { error: "tags must be an array of { Key, Value } string pairs" },
          { status: 400 },
        );
      }
      if (!isRecord(body.launchTemplateData)) {
        return NextResponse.json({ error: "launchTemplateData is required" }, { status: 400 });
      }

      const launchTemplateData = body.launchTemplateData as RequestLaunchTemplateData;
      const tagSpecifications = tags.length
        ? [{ ResourceType: "launch-template" as const, Tags: tags }]
        : undefined;

      const res = await ec2Client.send(
        new CreateLaunchTemplateCommand({
          LaunchTemplateName: launchTemplateName,
          VersionDescription: versionDescription,
          LaunchTemplateData: launchTemplateData,
          TagSpecifications: tagSpecifications,
        }),
      );
      return NextResponse.json({ template: res.LaunchTemplate, warning: res.Warning });
    }

    if (action === "createVersion") {
      const templateId = optionalString(body.templateId);
      const templateName = optionalString(body.templateName);
      const versionDescription = optionalString(body.versionDescription);
      const sourceVersion = optionalVersion(body.sourceVersion);

      if (!templateId && !templateName) {
        return NextResponse.json(
          { error: "templateId or templateName is required" },
          { status: 400 },
        );
      }
      if (!isRecord(body.launchTemplateData)) {
        return NextResponse.json({ error: "launchTemplateData is required" }, { status: 400 });
      }

      const launchTemplateData = body.launchTemplateData as RequestLaunchTemplateData;
      const res = await ec2Client.send(
        new CreateLaunchTemplateVersionCommand({
          LaunchTemplateId: templateId,
          LaunchTemplateName: templateName,
          VersionDescription: versionDescription,
          LaunchTemplateData: launchTemplateData,
          SourceVersion: sourceVersion,
        }),
      );
      return NextResponse.json({ version: res.LaunchTemplateVersion });
    }

    if (action === "setDefaultVersion") {
      const templateId = optionalString(body.templateId);
      const templateName = optionalString(body.templateName);
      const defaultVersion = optionalVersion(body.defaultVersion);

      if (!templateId && !templateName) {
        return NextResponse.json(
          { error: "templateId or templateName is required" },
          { status: 400 },
        );
      }
      if (!defaultVersion) {
        return NextResponse.json({ error: "defaultVersion is required" }, { status: 400 });
      }

      const res = await ec2Client.send(
        new ModifyLaunchTemplateCommand({
          LaunchTemplateId: templateId,
          LaunchTemplateName: templateName,
          DefaultVersion: defaultVersion,
        }),
      );
      return NextResponse.json({ template: res.LaunchTemplate });
    }

    if (action === "deleteTemplate") {
      const templateId = optionalString(body.templateId);
      const templateName = optionalString(body.templateName);

      if (!templateId && !templateName) {
        return NextResponse.json(
          { error: "templateId or templateName is required" },
          { status: 400 },
        );
      }

      const res = await ec2Client.send(
        new DeleteLaunchTemplateCommand({
          LaunchTemplateId: templateId,
          LaunchTemplateName: templateName,
        }),
      );
      return NextResponse.json({ template: res.LaunchTemplate });
    }

    if (action === "deleteVersions") {
      const templateId = optionalString(body.templateId);
      const templateName = optionalString(body.templateName);
      const rawVersions = body.versions;

      if (!templateId && !templateName) {
        return NextResponse.json(
          { error: "templateId or templateName is required" },
          { status: 400 },
        );
      }
      if (
        !Array.isArray(rawVersions) ||
        rawVersions.length === 0 ||
        rawVersions.some((v) => typeof v !== "string" && typeof v !== "number")
      ) {
        return NextResponse.json(
          { error: "versions must be a non-empty array of version numbers" },
          { status: 400 },
        );
      }
      const versions = (rawVersions as Array<string | number>).map(String);

      const res = await ec2Client.send(
        new DeleteLaunchTemplateVersionsCommand({
          LaunchTemplateId: templateId,
          LaunchTemplateName: templateName,
          Versions: versions,
        }),
      );
      return NextResponse.json({
        successfullyDeleted: res.SuccessfullyDeletedLaunchTemplateVersions,
        unsuccessfullyDeleted: res.UnsuccessfullyDeletedLaunchTemplateVersions,
      });
    }

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
    const ec2Client = getUserClientFromRequest(EC2Client, request);
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get("templateId") ?? undefined;
    const templateName = searchParams.get("templateName") ?? undefined;

    if (!templateId && !templateName) {
      return NextResponse.json(
        { error: "templateId or templateName is required" },
        { status: 400 },
      );
    }

    const res = await ec2Client.send(
      new DeleteLaunchTemplateCommand({
        LaunchTemplateId: templateId,
        LaunchTemplateName: templateName,
      }),
    );
    return NextResponse.json({ template: res.LaunchTemplate });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
