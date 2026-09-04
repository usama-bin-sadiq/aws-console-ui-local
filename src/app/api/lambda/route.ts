import { NextResponse } from "next/server";
import {
  getAdapterStatus,
  handleAdapterError,
} from "@/lib/adapter-error-handler";
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
  ListAliasesCommand,
  AddPermissionCommand,
  RemovePermissionCommand,
  ListEventSourceMappingsCommand,
} from "@aws-sdk/client-lambda";
import { lambda } from "@/lib/aws-clients";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const functionName = searchParams.get("functionName");

    if (action === "getFunction" && functionName) {
      const res = await lambda.send(
        new GetFunctionCommand({ FunctionName: functionName })
      );
      return NextResponse.json({ function: res.Configuration || res });
    }

    if (action === "listVersions" && functionName) {
      const res = await lambda.send(
        new ListVersionsByFunctionCommand({ FunctionName: functionName })
      );
      return NextResponse.json({ versions: res.Versions || [] });
    }

    if (action === "listAliases" && functionName) {
      const res = await lambda.send(
        new ListAliasesCommand({ FunctionName: functionName })
      );
      return NextResponse.json({ aliases: res.Aliases || [] });
    }

    if (action === "listEventSourceMappings" && functionName) {
      const res = await lambda.send(
        new ListEventSourceMappingsCommand({ FunctionName: functionName })
      );
      return NextResponse.json({ mappings: res.EventSourceMappings || [] });
    }

    // Default: list all functions
    const res = await lambda.send(new ListFunctionsCommand({}));
    return NextResponse.json({ functions: res.Functions || [] });
  } catch (error: any) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "invoke") {
      const res = await lambda.send(
        new InvokeCommand({
          FunctionName: body.functionName,
          Payload: body.payload ? Buffer.from(body.payload) : undefined,
        })
      );
      return NextResponse.json({ result: res });
    }

    if (action === "create") {
      await lambda.send(new CreateFunctionCommand(body));
      return NextResponse.json({ success: true });
    }

    if (action === "delete") {
      await lambda.send(
        new DeleteFunctionCommand({ FunctionName: body.functionName })
      );
      return NextResponse.json({ success: true });
    }

    if (action === "updateCode") {
      await lambda.send(
        new UpdateFunctionCodeCommand({
          FunctionName: body.functionName,
          ZipFile: body.zipFile ? Buffer.from(body.zipFile, "base64") : undefined,
          S3Bucket: body.s3Bucket,
          S3Key: body.s3Key,
        })
      );
      return NextResponse.json({ success: true });
    }

    if (action === "updateConfiguration") {
      await lambda.send(
        new UpdateFunctionConfigurationCommand({
          FunctionName: body.functionName,
          Runtime: body.runtime,
          Handler: body.handler,
          MemorySize: body.memorySize,
          Timeout: body.timeout,
          Role: body.role,
          Description: body.description,
          Environment: body.environment
            ? { Variables: body.environment }
            : undefined,
        })
      );
      return NextResponse.json({ success: true });
    }

    if (action === "publishVersion") {
      const res = await lambda.send(
        new PublishVersionCommand({
          FunctionName: body.functionName,
          Description: body.description,
        })
      );
      return NextResponse.json({ version: res.Version, result: res });
    }

    if (action === "createAlias") {
      await lambda.send(
        new CreateAliasCommand({
          FunctionName: body.functionName,
          Name: body.aliasName,
          FunctionVersion: body.functionVersion,
        })
      );
      return NextResponse.json({ success: true });
    }

    if (action === "addPermission") {
      await lambda.send(
        new AddPermissionCommand({
          FunctionName: body.functionName,
          StatementId: body.statementId,
          Action: body.action,
          Principal: body.principal,
          SourceArn: body.sourceArn,
        })
      );
      return NextResponse.json({ success: true });
    }

    if (action === "removePermission") {
      await lambda.send(
        new RemovePermissionCommand({
          FunctionName: body.functionName,
          StatementId: body.statementId,
        })
      );
      return NextResponse.json({ success: true });
    }

    // Default create
    await lambda.send(new CreateFunctionCommand(body));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const functionName = searchParams.get("functionName");
    if (!functionName) {
      return NextResponse.json(
        { error: "functionName required" },
        { status: 400 }
      );
    }
    await lambda.send(
      new DeleteFunctionCommand({ FunctionName: functionName })
    );
    return NextResponse.json({ success: true });
  } catch (error: any) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
