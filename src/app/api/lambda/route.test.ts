import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { Readable } from "node:stream";
import {
  LambdaClient,
  ListTagsCommand,
  TagResourceCommand,
  UntagResourceCommand,
} from "@aws-sdk/client-lambda";

/**
 * These pin two compensations this route makes for defects in the LocalEmu fork,
 * and the line between them. The rule both sets of tests enforce is the same:
 * only the exact, identified emulator failure is compensated, because the
 * console must be able to tell "the emulator cannot do this" from "the emulator
 * is not there" from "this does not exist". Anything that turns one of those
 * into another is the bug these tests exist to prevent.
 */

const h = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock("@/lib/data-isolation", () => ({
  requirePermission: vi.fn(async () => null),
}));

vi.mock("@/lib/aws-clients", () => ({
  getUserClientFromRequest: vi.fn(() => ({ send: h.send })),
}));

// The adapter error handler is deliberately NOT mocked: the statuses asserted
// below are the real classification, which is the thing being protected.

const ACCOUNT = "000000000000";
const REGION = "us-east-1";
const layerArn = (name: string) => `arn:aws:lambda:${REGION}:${ACCOUNT}:layer:${name}`;
const layerVersionArn = (name: string, v: number) => `${layerArn(name)}:${v}`;
const functionArn = (name: string) => `arn:aws:lambda:${REGION}:${ACCOUNT}:function:${name}`;

const LAYERS_DEFECT = "exception while calling lambda.ListLayers: list index out of range";

/** The error the emulator actually raises, as the SDK surfaces it. */
function listLayersDefect(message = LAYERS_DEFECT) {
  return Object.assign(new Error(message), { name: "InternalError" });
}

/** The gateway's botocore validation failure, as the SDK surfaces it. */
function resourcePatternRejection(value: string) {
  return Object.assign(
    new Error(
      `1 validation error detected: Value '${value}' at 'resource' failed to satisfy constraint: ` +
        "Member must satisfy regular expression pattern: " +
        "arn:(aws[a-zA-Z-]*):lambda:(eusc-)?[a-z]{2}((-gov)|(-iso([a-z]?)))?-[a-z]+-\\d{1}:\\d{12}:" +
        "(function:[a-zA-Z0-9-_]+(:(\\$LATEST|[a-zA-Z0-9-_]+))?|code-signing-config:csc-[a-z0-9]{17}|" +
        "event-source-mapping:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}|" +
        "(capacity-provider|network-connector):[a-zA-Z0-9-_]{1,64})",
    ),
    { name: "ValidationException" },
  );
}

const connectionsRefused = () =>
  Object.assign(new Error("connect ECONNREFUSED 127.0.0.1:4566"), {
    name: "Error",
  });

type AnyCommand = { constructor: { name: string }; input: Record<string, unknown> };

/** The command class of each recorded `send` call, in order. */
const commands = () => h.send.mock.calls.map((c) => (c[0] as AnyCommand).constructor.name);
/** The input of the first `send` call for a given command class. */
const inputFor = (command: string) => {
  const call = h.send.mock.calls.find((c) => (c[0] as AnyCommand).constructor.name === command);
  return call ? (call[0] as AnyCommand).input : undefined;
};

async function get(query: string) {
  const { GET } = await import("./route");
  const response = await GET(new Request(`http://localhost:3002/api/lambda${query}`));
  return { status: response.status, json: await response.json() };
}

async function post(payload: Record<string, unknown>) {
  const { POST } = await import("./route");
  const response = await POST(
    new Request("http://localhost:3002/api/lambda", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
  return { status: response.status, json: await response.json() };
}

beforeEach(() => {
  h.send.mockReset();
});

describe("GET /api/lambda action=listLayers", () => {
  it("returns ListLayers untouched when the emulator serves it", async () => {
    const layers = [
      { LayerName: "shared", LayerArn: layerArn("shared"), LatestMatchingVersion: { Version: 3 } },
    ];
    h.send.mockResolvedValue({ Layers: layers });

    const { status, json } = await get("?action=listLayers");

    expect(status).toBe(200);
    expect(json).toEqual({ layers });
    // No derivation happened, so no second call was made.
    expect(commands()).toEqual(["ListLayersCommand"]);
  });

  it("rebuilds the documented ListLayers shape from ListLayerVersions on the emulator defect", async () => {
    h.send.mockImplementation(async (command: AnyCommand) => {
      switch (command.constructor.name) {
        case "ListLayersCommand":
          throw listLayersDefect();
        case "ListFunctionsCommand":
          return {
            Functions: [
              { FunctionName: "a", Layers: [{ Arn: layerVersionArn("shared", 3) }] },
              { FunctionName: "b", Layers: [{ Arn: layerVersionArn("analytics", 1) }] },
              // A duplicate reference to the same layer must not double it.
              { FunctionName: "c", Layers: [{ Arn: layerVersionArn("shared", 3) }] },
              { FunctionName: "d", Layers: [] },
            ],
          };
        case "ListLayerVersionsCommand": {
          const name = command.input.LayerName as string;
          const version = name === "shared" ? 3 : 1;
          return {
            LayerVersions: [
              {
                LayerVersionArn: layerVersionArn(name, version),
                Version: version,
                Description: `${name} layer`,
                CompatibleRuntimes: ["nodejs20.x"],
                LicenseInfo: "MIT",
              },
            ],
          };
        }
        default:
          throw new Error(`unexpected command ${command.constructor.name}`);
      }
    });

    const { status, json } = await get("?action=listLayers");

    expect(status).toBe(200);
    expect(json.errors).toEqual([]);
    // Documented ListLayersOutput.Layers members only: the layer ARN is the
    // version ARN without its version suffix, because LayerVersionsListItem
    // carries no LayerArn.
    expect(json.layers).toEqual([
      {
        LayerName: "analytics",
        LayerArn: layerArn("analytics"),
        LatestMatchingVersion: {
          LayerVersionArn: layerVersionArn("analytics", 1),
          Version: 1,
          Description: "analytics layer",
          CompatibleRuntimes: ["nodejs20.x"],
          LicenseInfo: "MIT",
        },
      },
      {
        LayerName: "shared",
        LayerArn: layerArn("shared"),
        LatestMatchingVersion: {
          LayerVersionArn: layerVersionArn("shared", 3),
          Version: 3,
          Description: "shared layer",
          CompatibleRuntimes: ["nodejs20.x"],
          LicenseInfo: "MIT",
        },
      },
    ]);
    // Only the newest version of each layer is needed.
    expect(inputFor("ListLayerVersionsCommand")).toMatchObject({ MaxItems: 1 });
  });

  it("reads every ListFunctions page so a later page's layer is not dropped", async () => {
    const pages: Record<string, unknown> = {
      undefined: {
        NextMarker: "page-2",
        Functions: [{ FunctionName: "a", Layers: [{ Arn: layerVersionArn("first", 1) }] }],
      },
      "page-2": {
        Functions: [{ FunctionName: "b", Layers: [{ Arn: layerVersionArn("second", 1) }] }],
      },
    };
    h.send.mockImplementation(async (command: AnyCommand) => {
      switch (command.constructor.name) {
        case "ListLayersCommand":
          throw listLayersDefect();
        case "ListFunctionsCommand":
          return pages[command.input.Marker as string];
        case "ListLayerVersionsCommand":
          return { LayerVersions: [{ LayerVersionArn: command.input.LayerName, Version: 1 }] };
        default:
          throw new Error(`unexpected command ${command.constructor.name}`);
      }
    });

    const { status, json } = await get("?action=listLayers");

    expect(status).toBe(200);
    expect(json.layers.map((l: { LayerName: string }) => l.LayerName)).toEqual(["first", "second"]);
  });

  it("does not fall back for a different ListLayers InternalError", async () => {
    h.send.mockImplementation(async (command: AnyCommand) => {
      if (command.constructor.name === "ListLayersCommand") {
        throw listLayersDefect("InternalError: the emulator is having a bad day");
      }
      throw new Error("the derivation must not be attempted");
    });

    const { status, json } = await get("?action=listLayers");

    expect(status).toBe(502);
    expect(json.errorKind).toBe("upstream-error");
    // No ListFunctions, no ListLayerVersions: an unrelated failure is reported
    // as itself.
    expect(commands()).toEqual(["ListLayersCommand"]);
  });

  it("does not fall back when the index failure arrives under another error class", async () => {
    h.send.mockImplementation(async (command: AnyCommand) => {
      if (command.constructor.name === "ListLayersCommand") {
        throw Object.assign(new Error(LAYERS_DEFECT), { name: "ServiceException" });
      }
      throw new Error("the derivation must not be attempted");
    });

    const { status, json } = await get("?action=listLayers");

    expect(status).toBe(502);
    expect(commands()).toEqual(["ListLayersCommand"]);
    expect(json.error).toContain("list index out of range");
  });

  it("reports an unreachable emulator rather than an empty layer list", async () => {
    // The fallback is only entered because ListLayers answered, so a failure to
    // enumerate layer names means the emulator went away mid-request. Turning
    // that into a 200 with zero layers would be indistinguishable from "this
    // account has no layers".
    h.send.mockImplementation(async (command: AnyCommand) => {
      if (command.constructor.name === "ListLayersCommand") throw listLayersDefect();
      if (command.constructor.name === "ListFunctionsCommand") throw connectionsRefused();
      throw new Error("the derivation must not be attempted");
    });

    const { status, json } = await get("?action=listLayers");

    expect(status).toBe(503);
    expect(json.errorKind).toBe("unreachable");
    expect(json.layers).toBeUndefined();
  });

  it("keeps the layers it could read and names the ones it could not", async () => {
    h.send.mockImplementation(async (command: AnyCommand) => {
      switch (command.constructor.name) {
        case "ListLayersCommand":
          throw listLayersDefect();
        case "ListFunctionsCommand":
          return {
            Functions: [
              { FunctionName: "a", Layers: [{ Arn: layerVersionArn("good", 1) }] },
              { FunctionName: "b", Layers: [{ Arn: layerVersionArn("gone", 1) }] },
              { FunctionName: "c", Layers: [{ Arn: layerVersionArn("empty", 1) }] },
            ],
          };
        case "ListLayerVersionsCommand":
          if (command.input.LayerName === "gone") {
            throw new Error("ResourceNotFoundException: no such layer");
          }
          if (command.input.LayerName === "empty") return { LayerVersions: [] };
          return { LayerVersions: [{ LayerVersionArn: command.input.LayerName, Version: 1 }] };
        default:
          throw new Error(`unexpected command ${command.constructor.name}`);
      }
    });

    const { status, json } = await get("?action=listLayers");

    expect(status).toBe(200);
    expect(json.layers.map((l: { LayerName: string }) => l.LayerName)).toEqual(["good"]);
    // Order follows the sorted layer names, so the report is deterministic.
    expect(json.errors).toEqual([
      "empty: ListLayerVersions returned no versions",
      "gone: ResourceNotFoundException: no such layer",
    ]);
  });
});

describe("GET /api/lambda action=listTags — resource normalisation", () => {
  it("reads a bare function ARN through ListTags and never the tagging API", async () => {
    h.send.mockResolvedValue({ Tags: { env: "prod" } });

    const { status, json } = await get(
      `?action=listTags&arn=${encodeURIComponent(functionArn("fn"))}`,
    );

    expect(status).toBe(200);
    expect(json).toEqual({ tags: { env: "prod" }, resource: functionArn("fn") });
    expect(inputFor("ListTagsCommand")).toEqual({ Resource: functionArn("fn") });
  });

  it.each(["1", "$LATEST", "live"])(
    "strips the :%s qualifier, which is not a taggable resource",
    async (qualifier) => {
      h.send.mockResolvedValue({ Tags: {} });

      const { status, json } = await get(
        `?action=listTags&arn=${encodeURIComponent(`${functionArn("fn")}:${qualifier}`)}`,
      );

      expect(status).toBe(200);
      expect(json.resource).toBe(functionArn("fn"));
      expect(inputFor("ListTagsCommand")).toEqual({ Resource: functionArn("fn") });
    },
  );

  it("sends a layer ARN to ListTags rather than refusing it", async () => {
    // This is the case that used to answer 400 "ListTags is not available for
    // layer resources" on the premise that the SDK's own validator would reject
    // it. It does not — see the SDK-acceptability test below — so the ARN is
    // the taggable resource and is sent.
    h.send.mockResolvedValue({ Tags: { team: "platform" } });

    const { status, json } = await get(
      `?action=listTags&arn=${encodeURIComponent(layerArn("shared"))}`,
    );

    expect(status).toBe(200);
    expect(json).toEqual({ tags: { team: "platform" }, resource: layerArn("shared") });
    expect(inputFor("ListTagsCommand")).toEqual({ Resource: layerArn("shared") });
  });

  it("de-qualifies a layer version ARN, which is not itself taggable", async () => {
    h.send.mockResolvedValue({ Tags: {} });

    const { status, json } = await get(
      `?action=listTags&arn=${encodeURIComponent(layerVersionArn("shared", 7))}`,
    );

    expect(status).toBe(200);
    expect(json.resource).toBe(layerArn("shared"));
    expect(inputFor("ListTagsCommand")).toEqual({ Resource: layerArn("shared") });
  });

  it("resolves a bare name to a function, and de-qualifies what the SDK returns", async () => {
    h.send.mockImplementation(async (command: AnyCommand) => {
      if (command.constructor.name === "ListVersionsByFunctionCommand") {
        return { Versions: [{ Version: "1", FunctionArn: `${functionArn("fn")}:1` }] };
      }
      return { Tags: { a: "b" } };
    });

    const { status, json } = await get("?action=listTags&arn=fn");

    expect(status).toBe(200);
    expect(json.resource).toBe(functionArn("fn"));
  });

  it("resolves a bare name to a layer when no function has that name", async () => {
    h.send.mockImplementation(async (command: AnyCommand) => {
      if (command.constructor.name === "ListVersionsByFunctionCommand") {
        throw new Error("ResourceNotFoundException");
      }
      if (command.constructor.name === "ListLayerVersionsCommand") {
        return { LayerVersions: [{ LayerVersionArn: layerVersionArn("shared", 4), Version: 4 }] };
      }
      return { Tags: {} };
    });

    const { status, json } = await get("?action=listTags&arn=shared");

    expect(status).toBe(200);
    expect(json.resource).toBe(layerArn("shared"));
    expect(inputFor("ListTagsCommand")).toEqual({ Resource: layerArn("shared") });
  });

  it("404s a bare name that is neither a function nor a layer", async () => {
    h.send.mockImplementation(async () => {
      throw new Error("ResourceNotFoundException");
    });

    const { status, json } = await get("?action=listTags&arn=nothing");

    expect(status).toBe(404);
    expect(json.error).toContain("nothing");
    expect(commands()).not.toContain("ListTagsCommand");
  });

  it("400s a missing resource", async () => {
    const { status, json } = await get("?action=listTags");
    expect(status).toBe(400);
    expect(json.error).toBe("arn is required");
    expect(h.send).not.toHaveBeenCalled();
  });
});

describe("GET /api/lambda action=listTags — the emulator's TaggableResource gap", () => {
  it("reads a layer's tags from resourcegroupstaggingapi when ListTags is pattern-rejected", async () => {
    h.send.mockImplementation(async (command: AnyCommand) => {
      if (command.constructor.name === "ListTagsCommand") {
        throw resourcePatternRejection(layerArn("shared"));
      }
      if (command.constructor.name === "GetResourcesCommand") {
        return {
          ResourceTagMappingList: [
            { ResourceARN: functionArn("fn"), Tags: [{ Key: "x", Value: "1" }] },
            { ResourceARN: layerArn("shared"), Tags: [{ Key: "team", Value: "platform" }] },
          ],
        };
      }
      throw new Error(`unexpected command ${command.constructor.name}`);
    });

    const { status, json } = await get(
      `?action=listTags&arn=${encodeURIComponent(layerArn("shared"))}`,
    );

    expect(status).toBe(200);
    // GetResources is documented as [{Key, Value}]; ListTags and the console
    // both want a map.
    expect(json).toEqual({ tags: { team: "platform" }, resource: layerArn("shared") });
    // Only the matching layer's tags, not the whole resource map.
    expect(json.tags).not.toHaveProperty("x");
  });

  it("says so when the cross-service read has no tags for the layer, instead of returning an empty map", async () => {
    h.send.mockImplementation(async (command: AnyCommand) => {
      if (command.constructor.name === "ListTagsCommand") {
        throw resourcePatternRejection(layerArn("shared"));
      }
      return { ResourceTagMappingList: [] };
    });

    const { status, json } = await get(
      `?action=listTags&arn=${encodeURIComponent(layerArn("shared"))}`,
    );

    expect(status).toBe(404);
    expect(json.error).toContain(layerArn("shared"));
    expect(json.tags).toBeUndefined();
  });

  it("propagates any other ListTags failure for a layer instead of masking it", async () => {
    h.send.mockImplementation(async (command: AnyCommand) => {
      if (command.constructor.name === "ListTagsCommand") throw connectionsRefused();
      throw new Error("the cross-service read must not be attempted");
    });

    const { status, json } = await get(
      `?action=listTags&arn=${encodeURIComponent(layerArn("shared"))}`,
    );

    expect(status).toBe(503);
    expect(json.errorKind).toBe("unreachable");
    expect(commands()).not.toContain("GetResourcesCommand");
  });

  it("never routes a function ARN through the cross-service read", async () => {
    h.send.mockImplementation(async (command: AnyCommand) => {
      if (command.constructor.name === "ListTagsCommand") {
        throw resourcePatternRejection(functionArn("fn"));
      }
      throw new Error("the cross-service read must not be attempted");
    });

    const { status, json } = await get(
      `?action=listTags&arn=${encodeURIComponent(functionArn("fn"))}`,
    );

    // The compensation is scoped to the layer pattern gap. A function ARN that
    // trips a validator is a real error, not a gap to paper over, so it is
    // reported as itself and the cross-service read is not attempted.
    expect(status).toBe(502);
    expect(json.error).toContain("at 'resource' failed to satisfy constraint");
    expect(commands()).not.toContain("GetResourcesCommand");
  });
});

describe("the SDK really does put a layer ARN on the wire", () => {
  // The premise this file was originally given — "the AWS SDK's client-side
  // pattern validation rejects a layer ARN before the request is sent" — is
  // false for @aws-sdk/client-lambda: `ListTagsRequest.Resource` is compiled
  // with only a `required` trait and no `pattern` trait, so no ARN spelling is
  // checked locally. This test pins that, because the compensation above is
  // written against the emulator's validation instead, and a future reader must
  // not re-introduce a client-side guard that the SDK does not have.
  // Records the request line the SDK built, so "reached the wire" is observed
  // rather than inferred from the absence of a throw.
  const clientFor = (seen: string[]) =>
    new LambdaClient({
      region: REGION,
      credentials: { accessKeyId: "test", secretAccessKey: "test" },
      maxAttempts: 1,
      requestHandler: {
        // `handle` receives the built HttpRequest itself, so reading `method`
        // and `path` off it proves the request was serialised and dispatched.
        handle: async (request: { method: string; path: string }) => {
          seen.push(`${request.method} ${request.path}`);
          return {
            response: {
              statusCode: 200,
              headers: { "content-type": "application/json" },
              // A node stream, because the SDK's body collector branches on the
              // realm of `body` and this file runs under jsdom.
              body: Readable.from([Buffer.from(JSON.stringify({ Tags: {} }))]),
            },
          };
        },
      } as never,
    });

  it.each([
    ["a de-qualified layer ARN", layerArn("shared")],
    ["a layer version ARN", layerVersionArn("shared", 3)],
    ["a string that is not an ARN at all", "!!! not an arn !!!"],
  ])("reaches the request handler: %s", async (_label, resource) => {
    const seen: string[] = [];
    const client = clientFor(seen);

    await expect(client.send(new ListTagsCommand({ Resource: resource }))).resolves.toBeDefined();

    expect(seen).toHaveLength(1);
    expect(seen[0]).toMatch(/^GET \/2017-03-31\/tags\//);
  });

  it("sends the de-qualified form the route produces", async () => {
    const seen: string[] = [];
    const client = clientFor(seen);

    // What `dequalifyLambdaArn(layerVersionArn("shared", 3), "layer")` yields.
    await client.send(new ListTagsCommand({ Resource: layerArn("shared") }));

    expect(seen[0]).toBe(
      `GET /2017-03-31/tags/arn%3Aaws%3Alambda%3A${REGION}%3A${ACCOUNT}%3Alayer%3Ashared`,
    );
  });

  it("puts a layer ARN on the wire for the tag WRITES too, so a local refusal is unjustified", async () => {
    // This is the premise the write path's decision rests on. If the SDK refused a
    // layer ARN locally, refusing the write in this route would be defensible.
    // It does not refuse, so the write is forwarded and the emulator's own
    // answer is reported — which is why the layer gap is re-worded rather than
    // prevented. Both write commands share `TaggableResource`, so the pattern
    // gap (which lives in botocore's model, not in the SDK) applies to them too.
    const seen: string[] = [];
    const client = clientFor(seen);

    await expect(
      client.send(
        new TagResourceCommand({ Resource: layerArn("shared"), Tags: { team: "platform" } }),
      ),
    ).resolves.toBeDefined();
    await expect(
      client.send(new UntagResourceCommand({ Resource: layerArn("shared"), TagKeys: ["team"] })),
    ).resolves.toBeDefined();

    // Both verbs, one path: tagging is a POST and untagging a DELETE in the
    // Lambda tag REST API, which is why the same `TaggableResource` gap reaches
    // both operations.
    expect(seen[0]).toMatch(/^POST \/2017-03-31\/tags\//);
    expect(seen[1]).toMatch(/^DELETE \/2017-03-31\/tags\//);
  });
});

describe("GET /api/lambda unknown actions", () => {
  it("400s an unknown action and lists the supported ones", async () => {
    const { status, json } = await get("?action=listLayerz");
    expect(status).toBe(400);
    expect(json.error).toBe(
      "Unknown GET action: listLayerz. Supported: getFunction, listVersions, listAliases, " +
        "listAllAliases, listEventSourceMappings, listLayers, listLayer, listLayerVersions, listTags",
    );
    expect(h.send).not.toHaveBeenCalled();
  });
});

// The tag-write tests hold the same line as the read ones: the resource that
// gets written is decided by the one resolver, and a failure is reported as the
// failure it is — never as a write nobody observed.

describe("POST /api/lambda action=tagResource", () => {
  it("forwards the de-qualified resource and the documented tag map", async () => {
    h.send.mockResolvedValue({});

    const { status, json } = await post({
      action: "tagResource",
      Resource: `${functionArn("fn")}:live`,
      Tags: { env: "prod" },
    });

    expect(status).toBe(200);
    expect(json).toEqual({ success: true, resource: functionArn("fn") });
    expect(inputFor("TagResourceCommand")).toEqual({
      Resource: functionArn("fn"),
      Tags: { env: "prod" },
    });
  });

  it("de-qualifies a layer version ARN through the same resolver listTags uses", async () => {
    h.send.mockResolvedValue({});

    const { status, json } = await post({
      action: "tagResource",
      arn: layerVersionArn("shared", 7),
      tags: { team: "platform" },
    });

    expect(status).toBe(200);
    expect(json.resource).toBe(layerArn("shared"));
    expect(inputFor("TagResourceCommand")).toEqual({
      Resource: layerArn("shared"),
      Tags: { team: "platform" },
    });
  });

  it("accepts the console's [{Key, Value}] list form and sends the map the SDK requires", async () => {
    // `TagResourceRequest.Tags` is documented as a map, but the layer page posts
    // back the `[{Key, Value}]` list it reads from `listTags`. Refusing that
    // shape would refuse the console's own reading of this route's output.
    h.send.mockResolvedValue({});

    const { status } = await post({
      action: "tagResource",
      resource: layerArn("shared"),
      tags: [
        { Key: "team", Value: "platform" },
        { Key: "env", Value: "prod" },
      ],
    });

    expect(status).toBe(200);
    expect(inputFor("TagResourceCommand")).toEqual({
      Resource: layerArn("shared"),
      Tags: { team: "platform", env: "prod" },
    });
  });

  it("resolves a bare name before writing, de-qualifying what the SDK returns", async () => {
    h.send.mockImplementation(async (command: AnyCommand) => {
      if (command.constructor.name === "ListVersionsByFunctionCommand") {
        return { Versions: [{ Version: "1", FunctionArn: `${functionArn("fn")}:1` }] };
      }
      return {};
    });

    const { status, json } = await post({
      action: "tagResource",
      Resource: "fn",
      Tags: { env: "prod" },
    });

    expect(status).toBe(200);
    expect(json.resource).toBe(functionArn("fn"));
    expect(inputFor("TagResourceCommand")).toEqual({
      Resource: functionArn("fn"),
      Tags: { env: "prod" },
    });
  });

  it("404s a bare name that is neither a function nor a layer, without writing", async () => {
    h.send.mockImplementation(async () => {
      throw new Error("ResourceNotFoundException");
    });

    const { status, json } = await post({
      action: "tagResource",
      Resource: "nothing",
      Tags: { env: "prod" },
    });

    expect(status).toBe(404);
    expect(json.error).toContain("nothing");
    expect(commands()).not.toContain("TagResourceCommand");
  });

  it("400s a missing resource", async () => {
    const { status, json } = await post({ action: "tagResource", Tags: { env: "prod" } });
    expect(status).toBe(400);
    expect(json.error).toBe("resource is required");
    expect(h.send).not.toHaveBeenCalled();
  });

  it("400s an empty tags object", async () => {
    const { status, json } = await post({
      action: "tagResource",
      Resource: functionArn("fn"),
      Tags: {},
    });
    expect(status).toBe(400);
    expect(json.error).toBe("tags must contain at least one tag");
    // Refused before any call: a client mistake must not be forwarded to the
    // emulator and reported back as one.
    expect(h.send).not.toHaveBeenCalled();
  });

  it("400s an empty list-form tags", async () => {
    const { status, json } = await post({
      action: "tagResource",
      Resource: functionArn("fn"),
      tags: [],
    });
    expect(status).toBe(400);
    expect(json.error).toBe("tags must contain at least one tag");
    expect(h.send).not.toHaveBeenCalled();
  });

  it("400s a non-string tag value in the map form, naming the key", async () => {
    const { status, json } = await post({
      action: "tagResource",
      Resource: functionArn("fn"),
      Tags: { env: 3 },
    });
    expect(status).toBe(400);
    expect(json.error).toBe('tags: value for "env" must be a string, got number');
    expect(h.send).not.toHaveBeenCalled();
  });

  it("400s a non-string tag value in the list form", async () => {
    const { status, json } = await post({
      action: "tagResource",
      Resource: functionArn("fn"),
      tags: [{ Key: "env", Value: 3 }],
    });
    expect(status).toBe(400);
    expect(json.error).toBe('tags: value for "env" must be a string, got number');
    expect(h.send).not.toHaveBeenCalled();
  });

  it("400s a tag entry with no string key", async () => {
    const { status, json } = await post({
      action: "tagResource",
      Resource: functionArn("fn"),
      tags: [{ Value: "prod" }],
    });
    expect(status).toBe(400);
    expect(json.error).toBe("tags: every tag needs a non-empty string key, got undefined");
    expect(h.send).not.toHaveBeenCalled();
  });

  it("400s a missing tags field", async () => {
    const { status, json } = await post({
      action: "tagResource",
      Resource: functionArn("fn"),
    });
    expect(status).toBe(400);
    expect(json.error).toContain("tags must be a non-empty object");
    expect(h.send).not.toHaveBeenCalled();
  });
});

describe("POST /api/lambda action=untagResource", () => {
  it("forwards the de-qualified resource and the documented tagKeys", async () => {
    h.send.mockResolvedValue({});

    const { status, json } = await post({
      action: "untagResource",
      Resource: layerVersionArn("shared", 2),
      TagKeys: ["team", "env"],
    });

    expect(status).toBe(200);
    expect(json).toEqual({ success: true, resource: layerArn("shared") });
    expect(inputFor("UntagResourceCommand")).toEqual({
      Resource: layerArn("shared"),
      TagKeys: ["team", "env"],
    });
  });

  it("accepts the console's `keys` spelling", async () => {
    // The layer page posts `keys`, not the documented `TagKeys`.
    h.send.mockResolvedValue({});

    const { status, json } = await post({
      action: "untagResource",
      arn: layerArn("shared"),
      keys: ["team"],
    });

    expect(status).toBe(200);
    expect(json.resource).toBe(layerArn("shared"));
    expect(inputFor("UntagResourceCommand")).toEqual({
      Resource: layerArn("shared"),
      TagKeys: ["team"],
    });
  });

  it("400s an empty tagKeys array", async () => {
    const { status, json } = await post({
      action: "untagResource",
      Resource: functionArn("fn"),
      TagKeys: [],
    });
    expect(status).toBe(400);
    expect(json.error).toBe("tagKeys must contain at least one tag key");
    expect(h.send).not.toHaveBeenCalled();
  });

  it("400s a non-array tagKeys", async () => {
    const { status, json } = await post({
      action: "untagResource",
      Resource: functionArn("fn"),
      tagKeys: "team",
    });
    expect(status).toBe(400);
    expect(json.error).toBe("tagKeys must be a non-empty array of tag keys, got string");
    expect(h.send).not.toHaveBeenCalled();
  });

  it("400s a missing tagKeys", async () => {
    const { status, json } = await post({
      action: "untagResource",
      Resource: functionArn("fn"),
    });
    expect(status).toBe(400);
    expect(json.error).toBe("tagKeys must be a non-empty array of tag keys, got undefined");
    expect(h.send).not.toHaveBeenCalled();
  });

  it("400s a non-string entry in tagKeys, by index", async () => {
    const { status, json } = await post({
      action: "untagResource",
      Resource: functionArn("fn"),
      keys: ["team", 7],
    });
    expect(status).toBe(400);
    expect(json.error).toBe("tagKeys[1] must be a non-empty string, got a number");
    expect(h.send).not.toHaveBeenCalled();
  });

  it("400s an empty-string entry in tagKeys", async () => {
    const { status, json } = await post({
      action: "untagResource",
      Resource: functionArn("fn"),
      keys: [""],
    });
    expect(status).toBe(400);
    expect(json.error).toBe("tagKeys[0] must be a non-empty string, got an empty string");
    expect(h.send).not.toHaveBeenCalled();
  });
});

describe("POST layer tag writes — forwarded, never faked", () => {
  it("sends a layer ARN to TagResource rather than refusing it locally", async () => {
    // The refusal this replaces was based on the premise that the SDK would
    // reject a layer ARN. It does not — the write path has the same SDK
    // behaviour the read path proved — so refusing would take away a write that
    // may work, on the strength of a third party's model gap.
    h.send.mockResolvedValue({});

    const { status, json } = await post({
      action: "tagResource",
      Resource: layerArn("shared"),
      Tags: { team: "platform" },
    });

    expect(status).toBe(200);
    expect(json.success).toBe(true);
    expect(inputFor("TagResourceCommand")).toEqual({
      Resource: layerArn("shared"),
      Tags: { team: "platform" },
    });
  });

  it("reports the emulator's TaggableResource gap instead of a write it did not make", async () => {
    h.send.mockImplementation(async (command: AnyCommand) => {
      if (command.constructor.name === "TagResourceCommand") {
        throw resourcePatternRejection(layerArn("shared"));
      }
      throw new Error("unexpected command");
    });

    const { status, json } = await post({
      action: "tagResource",
      Resource: layerArn("shared"),
      Tags: { team: "platform" },
    });

    expect(status).toBe(400);
    // The message names the cause, and nothing claims the tags were written.
    expect(json.error).toContain(layerArn("shared"));
    expect(json.error).toContain('no "layer:" branch');
    expect(json.success).toBeUndefined();
    // No cross-service write is attempted in its place: this fork's backing for
    // TagResources is unknown, and guessing would risk the two tag stores
    // disagreeing with each other.
    expect(commands()).not.toContain("TagResourcesCommand");
  });

  it("re-words the same gap for UntagResource", async () => {
    h.send.mockImplementation(async (command: AnyCommand) => {
      if (command.constructor.name === "UntagResourceCommand") {
        throw resourcePatternRejection(layerArn("shared"));
      }
      throw new Error("unexpected command");
    });

    const { status, json } = await post({
      action: "untagResource",
      Resource: layerArn("shared"),
      tagKeys: ["team"],
    });

    expect(status).toBe(400);
    expect(json.error).toContain(layerArn("shared"));
    expect(json.success).toBeUndefined();
  });

  it("propagates any other layer failure rather than dressing it up as the gap", async () => {
    h.send.mockImplementation(async (command: AnyCommand) => {
      if (command.constructor.name === "TagResourceCommand") throw connectionsRefused();
      throw new Error("unexpected command");
    });

    const { status, json } = await post({
      action: "tagResource",
      Resource: layerArn("shared"),
      Tags: { team: "platform" },
    });

    expect(status).toBe(503);
    expect(json.errorKind).toBe("unreachable");
    expect(json.error).not.toContain("layer:");
  });

  it("never re-words a function ARN's validation failure", async () => {
    h.send.mockImplementation(async (command: AnyCommand) => {
      if (command.constructor.name === "TagResourceCommand") {
        throw resourcePatternRejection(functionArn("fn"));
      }
      throw new Error("unexpected command");
    });

    const { status, json } = await post({
      action: "tagResource",
      Resource: functionArn("fn"),
      Tags: { env: "prod" },
    });

    // Scoped to the layer gap exactly as the read path scopes its compensation:
    // the emulator's own answer is reported, unmodified.
    expect(status).toBe(502);
    expect(json.error).toContain("at 'resource' failed to satisfy constraint");
  });
});

describe("POST /api/lambda unknown actions", () => {
  it("400s an unknown action and lists the supported ones, including the tag writes", async () => {
    const { status, json } = await post({ action: "tagResorce" });
    expect(status).toBe(400);
    expect(json.error).toBe(
      "Unknown action: tagResorce. Supported: create, delete, invoke, updateCode, " +
        "updateConfiguration, publishVersion, createAlias, deleteAlias, addPermission, " +
        "removePermission, publishLayer, tagResource, untagResource",
    );
    expect(h.send).not.toHaveBeenCalled();
  });
});
