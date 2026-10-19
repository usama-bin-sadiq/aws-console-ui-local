import { NextResponse } from "next/server";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";
import {
  ListFunctionsCommand,
  CreateFunctionCommand,
  DeleteFunctionCommand,
  InvokeCommand,
  GetFunctionCommand,
  UpdateFunctionCodeCommand,
  UpdateFunctionConfigurationCommand,
  PublishVersionCommand,
  ListVersionsByFunctionCommand,
  CreateAliasCommand,
  DeleteAliasCommand,
  ListAliasesCommand,
  AddPermissionCommand,
  RemovePermissionCommand,
  ListEventSourceMappingsCommand,
  ListLayersCommand,
  ListLayerVersionsCommand,
  PublishLayerVersionCommand,
  ListTagsCommand,
  TagResourceCommand,
  UntagResourceCommand,
} from "@aws-sdk/client-lambda";
import { LambdaClient } from "@aws-sdk/client-lambda";
import type {
  CreateFunctionRequest,
  FunctionConfiguration,
  LayerVersionsListItem,
} from "@aws-sdk/client-lambda";
import {
  GetResourcesCommand,
  ResourceGroupsTaggingAPIClient,
} from "@aws-sdk/client-resource-groups-tagging-api";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

/**
 * `CreateFunctionRequest` (Lambda API reference) members, in documented order.
 * A create request is accepted with these documented field names, or with the
 * console's camelCase aliases; documented PascalCase always wins.
 */
const CREATE_FUNCTION_MEMBERS = [
  "FunctionName",
  "Runtime",
  "Role",
  "Handler",
  "Code",
  "Description",
  "Timeout",
  "MemorySize",
  "Publish",
  "PackageType",
  "VpcConfig",
  "DeadLetterConfig",
  "Environment",
  "KMSKeyArn",
  "TracingConfig",
  "Tags",
  "Layers",
  "FileSystemConfigs",
  "CodeSigningConfigArn",
  "ImageConfig",
  "Architectures",
  "EphemeralStorage",
  "LoggingConfig",
] as const;

/** camelCase spelling of a documented member, used as a console-side alias. */
function camelAlias(documented: string): string {
  return documented.charAt(0).toLowerCase() + documented.slice(1);
}

/**
 * Picks a value for a documented member: documented name first, then the
 * console's camelCase alias. Returns undefined when neither is present.
 */
function pick(body: Record<string, unknown>, documented: string): unknown {
  if (body[documented] !== undefined) return body[documented];
  const alias = camelAlias(documented);
  return body[alias] !== undefined ? body[alias] : undefined;
}

/**
 * `Code` / `Content` carry a blob. On the wire (and therefore in this JSON
 * request body) a blob is base64, but the SDK's blob serializer encodes
 * whatever bytes it is handed. Passing the base64 string straight through makes
 * the SDK base64-encode it a second time, so the emulator receives
 * base64(base64(zip)) and rejects it as "Could not unzip uploaded file".
 * Decoding here is what makes the documented request shape actually work.
 */
function toBlob(value: unknown): Buffer | undefined {
  if (value === undefined || value === null) return undefined;
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Uint8Array) return Buffer.from(value);
  if (typeof value === "string") return Buffer.from(value, "base64");
  if (Array.isArray(value) && value.every((n) => typeof n === "number")) {
    return Buffer.from(value as number[]);
  }
  // JSON.stringify(Buffer.from(...)) shape
  if (typeof value === "object" && Array.isArray((value as { data?: unknown }).data)) {
    return Buffer.from((value as { data: number[] }).data);
  }
  return undefined;
}

/**
 * Builds CreateFunctionCommand input from a request body, accepting the
 * documented AWS field names and the console's camelCase aliases. The
 * console-only `action` key is never forwarded to the SDK.
 */
function buildCreateFunctionInput(body: Record<string, unknown>): CreateFunctionRequest {
  const input: Record<string, unknown> = {};
  for (const member of CREATE_FUNCTION_MEMBERS) {
    const value = pick(body, member);
    if (value !== undefined) input[member] = value;
  }
  // Blob members must be raw bytes, not their base64 transport encoding.
  const code = input.Code as { ZipFile?: unknown; S3Bucket?: unknown; S3Key?: unknown } | undefined;
  if (code && typeof code === "object" && code.ZipFile !== undefined) {
    input.Code = { ...code, ZipFile: toBlob(code.ZipFile) };
  }
  return input as unknown as CreateFunctionRequest;
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error ?? "");
}

// ─── Emulator defect: `lambda.ListLayers` raises a list index error ───────────
// This LocalEmu fork keeps its layer list and its layer-version store out of
// sync, so `ListLayers` dies with `InternalError: exception while calling
// lambda.ListLayers: list index out of range` before it can return a page.
// `ListLayerVersions` reads the same store and is unaffected, so the documented
// `ListLayers` response is rebuilt from it. Every other `ListLayers` failure is a
// real error and is left to `handleAdapterError` untouched.
function isListLayersIndexDefect(error: unknown): boolean {
  const name = (error as { name?: unknown } | null | undefined)?.name;
  // The operation-name prefix LocalEmu puts in the message is deliberately not
  // required, so a reworded prefix still falls back; the error class plus the
  // index failure is already unambiguous.
  return name === "InternalError" && /list index out of range/i.test(errorText(error));
}

/**
 * Every layer name the account can name without `ListLayers`. A function's
 * `Layers` entries are the only in-band record of a layer's name and ARN, so
 * they are what the fallback enumerates.
 *
 * A `ListFunctions` failure is rethrown rather than reported as "no layers":
 * the fallback is only reached when the emulator has already answered a
 * `ListLayers` call, so a second failure is the emulator going away mid-request,
 * and an empty 200 there would read as "this account has no layers".
 */
async function discoverLayerNames(lambdaClient: LambdaClient): Promise<string[]> {
  const names = new Set<string>();
  let marker: string | undefined;
  do {
    // Paginated: `ListFunctions` returns at most 50 per page, and stopping at
    // the first page would silently drop layers attached to later functions.
    const page: { Functions?: FunctionConfiguration[]; NextMarker?: string } =
      await lambdaClient.send(new ListFunctionsCommand({ Marker: marker }));
    for (const fn of page.Functions || []) {
      for (const ref of fn.Layers || []) {
        // `FunctionConfiguration.Layers[].Arn` is the layer *version* ARN; the
        // name is the segment between `layer:` and the version suffix.
        const name = (ref.Arn || "").split(":layer:")[1]?.split(":")[0];
        if (name) names.add(name);
      }
    }
    marker = page.NextMarker;
  } while (marker);
  return [...names].sort();
}

/**
 * Rebuilds one `ListLayersOutput.Layers[]` entry from a `ListLayerVersions`
 * result. `LayerVersionsListItem` carries no `LayerArn`, so the layer ARN is
 * the version ARN without its version suffix — the same de-qualification
 * `ListTags` needs below.
 */
function toLayerSummary(layerName: string, version: LayerVersionsListItem) {
  return {
    LayerName: layerName,
    LayerArn: version.LayerVersionArn?.replace(/:[^:]+$/, ""),
    LatestMatchingVersion: {
      LayerVersionArn: version.LayerVersionArn,
      Version: version.Version,
      Description: version.Description,
      CreatedDate: version.CreatedDate,
      CompatibleRuntimes: version.CompatibleRuntimes,
      CompatibleArchitectures: version.CompatibleArchitectures,
      LicenseInfo: version.LicenseInfo,
    },
  };
}

// ─── `ListTags` resource normalisation ───────────────────────────────────────
// `ListTags` takes one taggable `Resource`. Which spellings are taggable is
// fixed by the API reference, not by this emulator:
//
//  - `ListTagsRequest.Resource` is documented as "The resource's Amazon Resource
//    Name (ARN). Note: Lambda does not support adding tags to function aliases
//    or versions." So a function ARN's `:1` / `:$LATEST` / `:alias` qualifier
//    is dropped: the untagged resource is the function itself.
//  - a layer's taggable resource is the layer ARN; a layer *version* ARN is not
//    a taggable resource at all, so `:3` is dropped the same way.
//
// The AWS API model does not agree with its own documentation here. The
// `TaggableResource` shape the SDK ships carries the pattern
//   arn:(aws[a-zA-Z-]*):lambda:<region>:<account>:(function:|code-signing-config:|
//   event-source-mapping:|capacity-provider:|network-connector:)
// with no `layer:` branch, even though the service tags layers. Measured
// consequences, since two of them are routinely mistaken for the SDK:
//  - `@aws-sdk/client-lambda@3.1124.0` applies NO client-side pattern
//    validation to `Resource`. Probed: a layer ARN, `!!! not an arn !!!` and a
//    bare name all reach the socket identically (the request leaves
//    `finalizeRequest`), so no spelling of a layer ARN is refused *by the SDK*.
//  - the emulator's gateway does validate, with botocore's `ParamValidator`,
//    and that model gap is why a layer ARN comes back as
//    `1 validation error detected: Value '…' at 'resource' failed to satisfy
//    constraint: Member must satisfy regular expression pattern: …`.
// So the layer compensation below keys on the emulator's validation failure, not
// on anything the SDK does.
const FUNCTION_ARN = /^(arn:[^:]+:lambda:[^:]*:[^:]*:function:)(.+)$/;
const LAYER_ARN = /^(arn:[^:]+:lambda:[^:]*:[^:]*:layer:)(.+)$/;

type LambdaResourceKind = "function" | "layer";

function lambdaResourceKind(reference: string): LambdaResourceKind | undefined {
  if (FUNCTION_ARN.test(reference)) return "function";
  if (LAYER_ARN.test(reference)) return "layer";
  return undefined;
}

/**
 * Strips a version/alias qualifier: `…:function:<name>:1` and
 * `…:layer:<name>:3` both become the bare resource ARN. An ARN that already
 * carries no qualifier is returned unchanged.
 */
function dequalifyLambdaArn(reference: string, kind: LambdaResourceKind): string | undefined {
  const match = (kind === "function" ? FUNCTION_ARN : LAYER_ARN).exec(reference);
  if (!match) return undefined;
  const name = match[2].split(":")[0];
  return name ? `${match[1]}${name}` : undefined;
}

/**
 * Resolves whatever the caller named — a function ARN, a layer ARN, or a bare
 * name — to the one ARN that carries its tags. A bare name is ambiguous, so a
 * function wins: that is what a bare Lambda name means in every other documented
 * call, and a layer is the documented fallback.
 */
async function resolveTagResource(
  lambdaClient: LambdaClient,
  requested: string,
): Promise<{ kind: LambdaResourceKind; resource: string } | undefined> {
  const kind = lambdaResourceKind(requested);
  if (kind) {
    const resource = dequalifyLambdaArn(requested, kind);
    return resource ? { kind, resource } : undefined;
  }

  const version = await lambdaClient
    .send(new ListVersionsByFunctionCommand({ FunctionName: requested, MaxItems: 1 }))
    .catch(() => null);
  const functionArn = version?.Versions?.[0]?.FunctionArn;
  if (functionArn) {
    // `ListVersionsByFunction` answers with a qualified ARN, and a qualified
    // function ARN is not a taggable resource, so it is de-qualified too.
    return {
      kind: "function",
      resource: dequalifyLambdaArn(functionArn, "function") ?? functionArn,
    };
  }

  const layer = await lambdaClient
    .send(new ListLayerVersionsCommand({ LayerName: requested, MaxItems: 1 }))
    .catch(() => null);
  const layerArn = layer?.LayerVersions?.[0]?.LayerVersionArn;
  if (!layerArn) return undefined;
  return { kind: "layer", resource: dequalifyLambdaArn(layerArn, "layer") ?? layerArn };
}

/**
 * The emulator's gateway rejects a layer ARN for `ListTags` because of the
 * `TaggableResource` pattern gap described above, before the lambda provider is
 * reached, so no spelling of a layer ARN gets through that call. The layer's
 * tags are read from `resourcegroupstaggingapi:GetResources` instead — the
 * documented cross-service tag read, which is not validated against Lambda's
 * pattern and indexes layers.
 *
 * Only that one failure takes this path. botocore names the member it rejected
 * and quotes the constraint it enforced, and that template is specific enough
 * that no other failure can match it; the error *class* is deliberately not
 * checked, because a gateway-side validation failure is not reported under a
 * stable class name. Every other error propagates untouched.
 */
function isEmulatorLayerTagArnRejection(error: unknown): boolean {
  return /at 'resource' failed to satisfy constraint/i.test(errorText(error));
}

/** `GetResources` returns `[{Key, Value}]`; `ListTags` — and the console — want a map. */
function toTagMap(
  tags: Array<{ Key?: string; Value?: string }> | undefined,
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const tag of tags || []) {
    if (tag.Key !== undefined) map[tag.Key] = tag.Value ?? "";
  }
  return map;
}

// ─── Tag write input ─────────────────────────────────────────────────────────
// `TagResourceRequest.Tags` is documented as a string→string map and
// `UntagResourceRequest.TagKeys` as a string list. Both are validated here
// rather than forwarded, because the alternative is not a clear message: a
// malformed tag arrives at the emulator as a validation failure that
// `handleAdapterError` reports as an `invalid-request`, which reads as the
// caller's mistake — but it arrives as a *transport* failure the console
// cannot distinguish from its own. Refusing locally keeps "you sent bad tags"
// and "the emulator rejected your tags" as two different answers.

/**
 * `TagResourceRequest.Tags` is a map, but the console holds layer tags in the
 * `[{Key, Value}]` list shape that `ListTags` and `resourcegroupstaggingapi`
 * return and posts that shape back. Both are accepted and normalised to the map
 * the SDK requires: refusing the list form would reject the console's own
 * reading of this route's `listTags` output. Both spellings are therefore
 * accepted and every other shape is refused — including a non-string value,
 * which is the case most likely to be a real client bug (an unedited input, a
 * number from a form) rather than a spelling difference.
 */
function normaliseTagsInput(value: unknown): { tags: Record<string, string> } | { error: string } {
  let entries: Array<[unknown, unknown]>;
  if (Array.isArray(value)) {
    entries = value.map((entry) => {
      const record = (entry ?? {}) as Record<string, unknown>;
      return [record.Key ?? record.key, record.Value ?? record.value];
    });
  } else if (value !== null && typeof value === "object") {
    entries = Object.entries(value as Record<string, unknown>);
  } else {
    return {
      error: "tags must be a non-empty object of string values, or a [{ Key, Value }] list",
    };
  }

  const tags: Record<string, string> = {};
  for (const [key, tagValue] of entries) {
    if (typeof key !== "string" || key === "") {
      return { error: `tags: every tag needs a non-empty string key, got ${typeof key}` };
    }
    if (typeof tagValue !== "string") {
      return { error: `tags: value for "${key}" must be a string, got ${typeof tagValue}` };
    }
    tags[key] = tagValue;
  }
  if (Object.keys(tags).length === 0) {
    return { error: "tags must contain at least one tag" };
  }
  return { tags };
}

/**
 * `UntagResourceRequest.TagKeys` is documented; the console names it `keys`.
 * An empty list is refused because the SDK marks `TagKeys` required and a
 * `NoValue` list is a caller with nothing to remove, not a tag mutation.
 */
function normaliseTagKeysInput(value: unknown): { tagKeys: string[] } | { error: string } {
  if (!Array.isArray(value)) {
    return { error: `tagKeys must be a non-empty array of tag keys, got ${typeof value}` };
  }
  if (value.length === 0) {
    return { error: "tagKeys must contain at least one tag key" };
  }
  // Index rather than the offending value: `[undefined]` must not read as "no
  // bad entry found".
  const badIndex = value.findIndex((k) => typeof k !== "string" || k === "");
  if (badIndex !== -1) {
    const got = value[badIndex] === "" ? "an empty string" : `a ${typeof value[badIndex]}`;
    return { error: `tagKeys[${badIndex}] must be a non-empty string, got ${got}` };
  }
  return { tagKeys: value as string[] };
}

// ─── Layer tag writes: forwarded, and reported honestly ──────────────────────
// A layer tag *write* gets no compensation, and that is a decision rather than
// an omission. The read side can fall back to `resourcegroupstaggingapi:
// GetResources` because that is a documented tag read which happens to index
// layers; the write-side equivalents (`TagResources`/`UntagResources`) are a
// different API with no guarantee that this fork backs them with the same tag
// store Lambda reads, so substituting one would risk the two stores silently
// disagreeing — the tags the console then reads back are not the tags it wrote.
//
// So the write is forwarded and the gateway's own answer is reported. What is
// known: this fork validates `Resource` with botocore's `ParamValidator`
// against `TaggableResource`, whose pattern has no `layer:` branch, so a layer
// ARN is refused before the lambda provider is reached — the same gap the read
// path above compensates for. What is NOT known, because it cannot be observed
// without the emulator running: whether the gateway validates
// `TagResource.Resource`/`UntagResource.Resource` at all. LocalStack's own
// `TagResource` has historically accepted layer ARNs, and the gateway sits in
// front of it, so if the validator does apply then the write is impossible on
// this fork; if it does not, forwarding is what makes the feature work at all.
// A local refusal would encode the model's gap as this emulator's policy
// forever, and would contradict `listTags`, which reads a layer's tags
// successfully on the very page the write is issued from.
//
// The one thing that must not happen is a success nobody observed, so this
// reports a failure and never invents a write.
function layerTagWriteRefusal(resource: string, error: unknown) {
  return {
    error:
      `Tags were not written to layer ${resource}. This emulator validates ` +
      `TaggableResource against botocore's pattern, which has no "layer:" branch, ` +
      `so a layer ARN is refused before the tag store is reached — while this same ` +
      `route reads that layer's tags successfully through resourcegroupstaggingapi. ` +
      `Emulator said: ${errorText(error)}`,
    resource,
  };
}

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const lambdaClient = getUserClientFromRequest(LambdaClient, request);
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const functionName = searchParams.get("FunctionName") || searchParams.get("functionName");
    const layerName = searchParams.get("LayerName") || searchParams.get("layerName");

    // Default: no action lists every function.
    if (!action) {
      const res = await lambdaClient.send(new ListFunctionsCommand({}));
      return NextResponse.json({ functions: res.Functions || [] });
    }

    if (action === "getFunction" && functionName) {
      const res = await lambdaClient.send(new GetFunctionCommand({ FunctionName: functionName }));
      return NextResponse.json({ function: res.Configuration || res });
    }

    if (action === "listVersions" && functionName) {
      const res = await lambdaClient.send(
        new ListVersionsByFunctionCommand({ FunctionName: functionName }),
      );
      return NextResponse.json({ versions: res.Versions || [] });
    }

    if (action === "listAliases" && functionName) {
      const res = await lambdaClient.send(new ListAliasesCommand({ FunctionName: functionName }));
      return NextResponse.json({ aliases: res.Aliases || [] });
    }

    if (action === "listEventSourceMappings" && functionName) {
      const res = await lambdaClient.send(
        new ListEventSourceMappingsCommand({ FunctionName: functionName }),
      );
      return NextResponse.json({ mappings: res.EventSourceMappings || [] });
    }

    // ─── Layers ────────────────────────────────────────────────────────────────
    if (action === "listLayers") {
      try {
        const res = await lambdaClient.send(new ListLayersCommand({}));
        return NextResponse.json({ layers: res.Layers || [] });
      } catch (err: unknown) {
        if (!isListLayersIndexDefect(err)) throw err;

        // `ListLayers` is unusable on this emulator, so the documented
        // `ListLayersOutput.Layers` is rebuilt from the layer read that does
        // work. A failure to enumerate the layer names is rethrown, not turned
        // into an empty list — "the emulator went away" and "this account has
        // no layers" are different answers. A single layer that cannot be read
        // is collected in `errors` alongside the ones that could, matching
        // `listAllAliases`, so a gap is visible instead of reading as complete.
        const names = await discoverLayerNames(lambdaClient);
        const settled = await Promise.all(
          names.map(async (name) => {
            try {
              const res = await lambdaClient.send(
                new ListLayerVersionsCommand({ LayerName: name, MaxItems: 1 }),
              );
              const latest = res.LayerVersions?.[0];
              return latest
                ? { layer: toLayerSummary(name, latest) }
                : { error: `${name}: ListLayerVersions returned no versions` };
            } catch (e: unknown) {
              return { error: `${name}: ${errorText(e)}` };
            }
          }),
        );
        const layers = settled
          .filter((r): r is { layer: ReturnType<typeof toLayerSummary> } => "layer" in r)
          .map((r) => r.layer)
          .sort((a, b) => (a.LayerName || "").localeCompare(b.LayerName || ""));
        const errors = settled.flatMap((r) => ("error" in r ? [r.error] : []));

        return NextResponse.json({ layers, errors });
      }
    }

    if (action === "listLayer" && layerName) {
      const res = await lambdaClient.send(
        new ListLayerVersionsCommand({ LayerName: layerName, MaxItems: 1 }),
      );
      const latest = res.LayerVersions?.[0];
      if (!latest) {
        return NextResponse.json({ error: `Layer not found: ${layerName}` }, { status: 404 });
      }
      return NextResponse.json({
        layer: {
          LayerName: layerName,
          LayerArn: latest.LayerVersionArn?.replace(/:[^:]+$/, ""),
          LatestMatchingVersion: latest,
        },
      });
    }

    if (action === "listLayerVersions" && layerName) {
      const res = await lambdaClient.send(new ListLayerVersionsCommand({ LayerName: layerName }));
      return NextResponse.json({ versions: res.LayerVersions || [] });
    }

    if (action === "listTags") {
      const requested =
        searchParams.get("Resource") || searchParams.get("arn") || searchParams.get("resource");
      if (!requested) {
        return NextResponse.json({ error: "arn is required" }, { status: 400 });
      }

      const resolved = await resolveTagResource(lambdaClient, requested);
      if (!resolved) {
        return NextResponse.json(
          { error: `Could not resolve a taggable ARN from: ${requested}` },
          { status: 404 },
        );
      }
      const { kind, resource } = resolved;

      try {
        const res = await lambdaClient.send(new ListTagsCommand({ Resource: resource }));
        return NextResponse.json({ tags: res.Tags || {}, resource });
      } catch (error: unknown) {
        if (kind !== "layer" || !isEmulatorLayerTagArnRejection(error)) throw error;

        // The one emulator failure the normalisation above cannot prevent: this
        // fork validates `ListTags.Resource` against a `TaggableResource`
        // pattern that has no `layer:` branch, so the layer's own tag read is
        // refused before it is served. `resourcegroupstaggingapi:GetResources` is
        // the documented cross-service tag read and is not validated against
        // Lambda's pattern.
        const taggingClient = getUserClientFromRequest(ResourceGroupsTaggingAPIClient, request);
        const res = await taggingClient.send(new GetResourcesCommand({}));
        const mapping = (res.ResourceTagMappingList || []).find((m) => m.ResourceARN === resource);
        if (!mapping) {
          return NextResponse.json(
            {
              error: `No tag store is exposed for layer ${resource} on this emulator`,
              resource,
            },
            { status: 404 },
          );
        }
        return NextResponse.json({ tags: toTagMap(mapping.Tags), resource });
      }
    }

    // Aliases across every function. Per-function failures are reported
    // separately so one bad function does not hide the rest.
    if (action === "listAllAliases") {
      const fns = await lambdaClient.send(new ListFunctionsCommand({}));
      const aliases: unknown[] = [];
      const errors: string[] = [];
      for (const fn of fns.Functions || []) {
        try {
          const res = await lambdaClient.send(
            new ListAliasesCommand({ FunctionName: fn.FunctionName }),
          );
          for (const alias of res.Aliases || []) {
            aliases.push({ ...alias, FunctionName: fn.FunctionName });
          }
        } catch (err: unknown) {
          errors.push(`${fn.FunctionName}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
      return NextResponse.json({ aliases, errors });
    }

    return NextResponse.json(
      {
        error: `Unknown GET action: ${action}. Supported: getFunction, listVersions, listAliases, listAllAliases, listEventSourceMappings, listLayers, listLayer, listLayerVersions, listTags`,
      },
      { status: 400 },
    );
  } catch (error: any) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const lambdaClient = getUserClientFromRequest(LambdaClient, request);
    const body = await request.json();
    const { action } = body;
    // Documented field names (FunctionName, Name, LayerName, ...) are accepted
    // everywhere; the console's camelCase spellings remain supported.
    const fnName = body.FunctionName || body.functionName;
    const aliasName = body.Name || body.aliasName;
    const version = body.FunctionVersion || body.functionVersion;

    if (action === "invoke") {
      const res = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: fnName,
          Payload:
            body.Payload || body.payload ? Buffer.from(body.Payload || body.payload) : undefined,
        }),
      );
      return NextResponse.json({ result: res });
    }

    if (action === "create") {
      const input = buildCreateFunctionInput(body);
      const res = await lambdaClient.send(new CreateFunctionCommand(input));
      return NextResponse.json({ success: true, function: res, result: res });
    }

    if (action === "delete") {
      await lambdaClient.send(new DeleteFunctionCommand({ FunctionName: fnName }));
      return NextResponse.json({ success: true });
    }

    if (action === "updateCode") {
      const zipFile = body.ZipFile || body.zipFile;
      await lambdaClient.send(
        new UpdateFunctionCodeCommand({
          FunctionName: fnName,
          ZipFile: toBlob(zipFile),
          S3Bucket: body.S3Bucket || body.s3Bucket,
          S3Key: body.S3Key || body.s3Key,
        }),
      );
      return NextResponse.json({ success: true });
    }

    if (action === "updateConfiguration") {
      const env = body.Environment || body.environment;
      await lambdaClient.send(
        new UpdateFunctionConfigurationCommand({
          FunctionName: fnName,
          Runtime: body.Runtime || body.runtime,
          Handler: body.Handler || body.handler,
          MemorySize: body.MemorySize || body.memorySize,
          Timeout: body.Timeout || body.timeout,
          Role: body.Role || body.role,
          Description: body.Description ?? body.description,
          Environment: env ? { Variables: env } : undefined,
        }),
      );
      return NextResponse.json({ success: true });
    }

    if (action === "publishVersion") {
      const res = await lambdaClient.send(
        new PublishVersionCommand({
          FunctionName: fnName,
          Description: body.Description ?? body.description,
        }),
      );
      return NextResponse.json({ version: res.Version, result: res });
    }

    if (action === "createAlias") {
      const res = await lambdaClient.send(
        new CreateAliasCommand({
          FunctionName: fnName,
          Name: aliasName,
          FunctionVersion: version,
          Description: body.Description ?? body.description,
          RoutingConfig: body.RoutingConfig ?? body.routingConfig,
        }),
      );
      return NextResponse.json({ success: true, alias: res });
    }

    if (action === "deleteAlias") {
      if (!fnName || !aliasName) {
        return NextResponse.json(
          { error: "functionName and aliasName are required" },
          { status: 400 },
        );
      }
      await lambdaClient.send(new DeleteAliasCommand({ FunctionName: fnName, Name: aliasName }));
      return NextResponse.json({ success: true });
    }

    if (action === "addPermission") {
      // `action` is the console's dispatch key here, so the Lambda permission
      // itself is read from `Permission` (documented) or `permission`.
      await lambdaClient.send(
        new AddPermissionCommand({
          FunctionName: fnName,
          StatementId: body.StatementId || body.statementId,
          Action: body.Permission || body.permission,
          Principal: body.Principal || body.principal,
          SourceArn: body.SourceArn || body.sourceArn,
        }),
      );
      return NextResponse.json({ success: true });
    }

    if (action === "removePermission") {
      await lambdaClient.send(
        new RemovePermissionCommand({
          FunctionName: fnName,
          StatementId: body.StatementId || body.statementId,
        }),
      );
      return NextResponse.json({ success: true });
    }

    // PublishLayerVersionRequest: LayerName, Content, CompatibleRuntimes,
    // CompatibleArchitectures, Description, LicenseInfo. The console sends the
    // zip as base64 in `zip`; Content.ZipFile is a blob on the wire.
    if (action === "publishLayer") {
      const layer = body.LayerName || body.layerName;
      const content = body.Content as { ZipFile?: unknown } | undefined;
      const zip = content?.ZipFile ?? body.zip;
      if (!layer || zip === undefined) {
        return NextResponse.json(
          { error: "LayerName and Content.ZipFile are required" },
          { status: 400 },
        );
      }
      const res = await lambdaClient.send(
        new PublishLayerVersionCommand({
          LayerName: layer,
          Content: { ZipFile: toBlob(zip) },
          Description: body.Description ?? body.description,
          CompatibleRuntimes: body.CompatibleRuntimes || body.compatibleRuntimes,
          CompatibleArchitectures: body.CompatibleArchitectures || body.compatibleArchitectures,
          LicenseInfo: body.LicenseInfo || body.licenseInfo,
        }),
      );
      return NextResponse.json({
        success: true,
        layerVersionArn: res.LayerVersionArn,
        layerArn: res.LayerArn,
        version: res.Version,
      });
    }

    // TagResourceRequest / UntagResourceRequest: `Resource`, plus `Tags` or
    // `TagKeys`. Which ARN is taggable is decided by the same resolver
    // `listTags` uses rather than by a second copy of the rules — a read and a
    // write of one resource that disagreed about which resource it is would be
    // invisible until a tag vanished.
    if (action === "tagResource" || action === "untagResource") {
      // Validated before anything is resolved: a malformed body should cost no
      // emulator round-trips and must not depend on the emulator being up.
      const isTagWrite = action === "tagResource";
      const normalised = isTagWrite
        ? normaliseTagsInput(body.Tags ?? body.tags)
        : normaliseTagKeysInput(body.TagKeys ?? body.tagKeys ?? body.keys);
      if ("error" in normalised) {
        return NextResponse.json({ error: normalised.error }, { status: 400 });
      }

      // `arn` is the console's spelling, tried after the documented `Resource`
      // and its camelCase alias — the same order `listTags` reads them in.
      const requested = body.Resource ?? body.resource ?? body.arn;
      if (typeof requested !== "string" || requested === "") {
        return NextResponse.json({ error: "resource is required" }, { status: 400 });
      }

      const resolved = await resolveTagResource(lambdaClient, requested);
      if (!resolved) {
        return NextResponse.json(
          { error: `Could not resolve a taggable ARN from: ${requested}` },
          { status: 404 },
        );
      }
      const { kind, resource } = resolved;

      try {
        if ("tags" in normalised) {
          await lambdaClient.send(
            new TagResourceCommand({ Resource: resource, Tags: normalised.tags }),
          );
        } else {
          await lambdaClient.send(
            new UntagResourceCommand({ Resource: resource, TagKeys: normalised.tagKeys }),
          );
        }
        // `TagResourceCommand` and `UntagResourceCommand` answer `{}`; the ARN is
        // echoed because normalisation can change which ARN was written, and a
        // caller that cannot see that cannot tell which resource it changed.
        return NextResponse.json({ success: true, resource });
      } catch (error: unknown) {
        // Only the layer pattern gap is re-worded, and only for a layer: a
        // function ARN that trips a validator is a real failure and is reported
        // as itself, exactly as the read path above scopes its compensation.
        if (kind !== "layer" || !isEmulatorLayerTagArnRejection(error)) throw error;
        return NextResponse.json(layerTagWriteRefusal(resource, error), { status: 400 });
      }
    }

    // ─── CreateFunction (default) ──────────────────────────────────────────────
    // No `action` means the body is a CreateFunctionRequest, exactly as the
    // documented API defines it.
    if (!action) {
      const input = buildCreateFunctionInput(body);
      if (!input.FunctionName) {
        return NextResponse.json(
          { error: "FunctionName is required to create a function" },
          { status: 400 },
        );
      }
      const res = await lambdaClient.send(new CreateFunctionCommand(input));
      return NextResponse.json({ success: true, function: res, result: res });
    }

    return NextResponse.json(
      {
        error: `Unknown action: ${action}. Supported: create, delete, invoke, updateCode, updateConfiguration, publishVersion, createAlias, deleteAlias, addPermission, removePermission, publishLayer, tagResource, untagResource`,
      },
      { status: 400 },
    );
  } catch (error: any) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const lambdaClient = getUserClientFromRequest(LambdaClient, request);
    const { searchParams } = new URL(request.url);
    const functionName = searchParams.get("FunctionName") || searchParams.get("functionName");
    if (!functionName) {
      return NextResponse.json({ error: "functionName required" }, { status: 400 });
    }
    await lambdaClient.send(new DeleteFunctionCommand({ FunctionName: functionName }));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
