import { NextResponse } from "next/server";
import {
  ListTablesCommand,
  CreateTableCommand,
  DeleteTableCommand,
  DescribeTableCommand,
  ScanCommand,
  QueryCommand,
  PutItemCommand,
  GetItemCommand,
  DeleteItemCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import type { CreateTableCommandInput } from "@aws-sdk/client-dynamodb";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

/**
 * `CreateTableInput` (DynamoDB API reference) members, in documented order.
 * The console's own create form and the documented request shape are both
 * accepted: documented PascalCase always wins, camelCase is a fallback.
 */
const CREATE_TABLE_MEMBERS = [
  "TableName",
  "KeySchema",
  "AttributeDefinitions",
  "BillingMode",
  "ProvisionedThroughput",
  "LocalSecondaryIndexes",
  "GlobalSecondaryIndexes",
  "StreamSpecification",
  "SSESpecification",
  "Tags",
  "TableClass",
  "DeletionProtectionEnabled",
  "WarmThroughput",
  "ResourcePolicy",
  "OnDemandThroughput",
] as const;

/** camelCase spelling of a documented member, used as a console-side alias. */
function camelAlias(documented: string): string {
  return documented.charAt(0).toLowerCase() + documented.slice(1);
}

/**
 * Picks a value for a documented member: documented name first, then the
 * console's camelCase alias. Returns undefined when neither is present, so an
 * explicitly-undefined documented field is never silently replaced.
 */
function pick(body: Record<string, unknown>, documented: string): unknown {
  if (body[documented] !== undefined) return body[documented];
  const alias = camelAlias(documented);
  return body[alias] !== undefined ? body[alias] : undefined;
}

/**
 * KeySchema / AttributeDefinitions entries use documented member names
 * (AttributeName, AttributeType, KeyType). Normalise the console's camelCase
 * spellings so a UI-built payload reaches the SDK in the documented shape.
 */
function normaliseKeyEntry(entry: unknown): unknown {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) return entry;
  const e = entry as Record<string, unknown>;
  return {
    ...e,
    AttributeName: pick(e, "AttributeName"),
    AttributeType: pick(e, "AttributeType"),
    KeyType: pick(e, "KeyType"),
  };
}

function normaliseKeyList(value: unknown): unknown {
  return Array.isArray(value) ? value.map(normaliseKeyEntry) : value;
}

/**
 * Builds CreateTableCommand input from a request body, accepting the documented
 * AWS field names and the console's camelCase aliases. Console-only keys such
 * as `action` are never forwarded to the SDK.
 */
function buildCreateTableInput(body: Record<string, unknown>): CreateTableCommandInput {
  const input: Record<string, unknown> = {};
  for (const member of CREATE_TABLE_MEMBERS) {
    let value = pick(body, member);
    if (value === undefined) continue;
    if (
      member === "KeySchema" ||
      member === "AttributeDefinitions" ||
      member === "LocalSecondaryIndexes" ||
      member === "GlobalSecondaryIndexes"
    ) {
      value = normaliseKeyList(value);
    }
    input[member] = value;
  }
  return input as unknown as CreateTableCommandInput;
}

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const dynamodbClient = getUserClientFromRequest(DynamoDBClient, request);
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get("tableName");
    const action = searchParams.get("action");

    // Table-specific actions
    if (tableName) {
      if (action === "describe" || !action) {
        const desc = await dynamodbClient.send(new DescribeTableCommand({ TableName: tableName }));
        return NextResponse.json({ table: desc.Table });
      }
      if (action === "scan") {
        const limitParam = searchParams.get("limit");
        const cmd = new ScanCommand({
          TableName: tableName,
          Limit: limitParam ? parseInt(limitParam, 10) : undefined,
        });
        const res = await dynamodbClient.send(cmd);
        return NextResponse.json({
          items: res.Items || [],
          count: res.Count,
          scannedCount: res.ScannedCount,
          lastEvaluatedKey: res.LastEvaluatedKey,
        });
      }
      if (action === "query") {
        const keyConditionExpression = searchParams.get("keyConditionExpression") || undefined;
        const expressionAttributeValues = searchParams.get("expressionAttributeValues")
          ? JSON.parse(searchParams.get("expressionAttributeValues")!)
          : undefined;
        const expressionAttributeNames = searchParams.get("expressionAttributeNames")
          ? JSON.parse(searchParams.get("expressionAttributeNames")!)
          : undefined;
        const indexName = searchParams.get("indexName") || undefined;
        const limitParam = searchParams.get("limit");
        const scanIndexForwardParam = searchParams.get("scanIndexForward");
        const cmd = new QueryCommand({
          TableName: tableName,
          KeyConditionExpression: keyConditionExpression,
          ExpressionAttributeValues: expressionAttributeValues,
          ExpressionAttributeNames: expressionAttributeNames,
          IndexName: indexName,
          Limit: limitParam ? parseInt(limitParam, 10) : undefined,
          ScanIndexForward: scanIndexForwardParam ? scanIndexForwardParam === "true" : undefined,
        });
        const res = await dynamodbClient.send(cmd);
        return NextResponse.json({
          items: res.Items || [],
          count: res.Count,
          scannedCount: res.ScannedCount,
          lastEvaluatedKey: res.LastEvaluatedKey,
        });
      }
    }

    // Default: list all tables
    const res = await dynamodbClient.send(new ListTablesCommand({}));
    const tables = [];
    for (const name of res.TableNames || []) {
      const desc = await dynamodbClient.send(new DescribeTableCommand({ TableName: name }));
      tables.push(desc.Table);
    }
    return NextResponse.json({ tables });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const dynamodbClient = getUserClientFromRequest(DynamoDBClient, request);
    const body = await request.json();
    const rawTableName = body.tableName || body.TableName;
    const action = body.action;

    // Item operations
    if (action === "scan") {
      const cmd = new ScanCommand({
        TableName: rawTableName,
        Limit: body.limit,
        FilterExpression: body.filterExpression,
        ExpressionAttributeNames: body.expressionAttributeNames,
        ExpressionAttributeValues: body.expressionAttributeValues,
      });
      const res = await dynamodbClient.send(cmd);
      return NextResponse.json({
        items: res.Items || [],
        count: res.Count,
        scannedCount: res.ScannedCount,
        lastEvaluatedKey: res.LastEvaluatedKey,
      });
    }

    if (action === "query") {
      const cmd = new QueryCommand({
        TableName: rawTableName,
        KeyConditionExpression: body.keyConditionExpression,
        ExpressionAttributeValues: body.expressionAttributeValues,
        ExpressionAttributeNames: body.expressionAttributeNames,
        IndexName: body.indexName,
        Limit: body.limit,
        ScanIndexForward: body.scanIndexForward,
        FilterExpression: body.filterExpression,
      });
      const res = await dynamodbClient.send(cmd);
      return NextResponse.json({
        items: res.Items || [],
        count: res.Count,
        scannedCount: res.ScannedCount,
        lastEvaluatedKey: res.LastEvaluatedKey,
      });
    }

    if (action === "putItem") {
      await dynamodbClient.send(
        new PutItemCommand({
          TableName: rawTableName,
          Item: body.Item || body.item,
          ConditionExpression: body.ConditionExpression || body.conditionExpression,
          ExpressionAttributeNames: body.ExpressionAttributeNames || body.expressionAttributeNames,
          ExpressionAttributeValues:
            body.ExpressionAttributeValues || body.expressionAttributeValues,
        }),
      );
      return NextResponse.json({ success: true });
    }

    if (action === "getItem") {
      const res = await dynamodbClient.send(
        new GetItemCommand({
          TableName: rawTableName,
          Key: body.Key || body.key,
        }),
      );
      return NextResponse.json({
        item: res.Item || null,
        metadata: { sdkResponseMetadata: res.$metadata },
      });
    }

    if (action === "deleteItem") {
      await dynamodbClient.send(
        new DeleteItemCommand({
          TableName: rawTableName,
          Key: body.Key || body.key,
          ConditionExpression: body.ConditionExpression || body.conditionExpression,
          ExpressionAttributeNames: body.ExpressionAttributeNames || body.expressionAttributeNames,
          ExpressionAttributeValues:
            body.ExpressionAttributeValues || body.expressionAttributeValues,
        }),
      );
      return NextResponse.json({ success: true });
    }

    if (action === "updateItem") {
      await dynamodbClient.send(
        new UpdateItemCommand({
          TableName: rawTableName,
          Key: body.Key || body.key,
          UpdateExpression: body.UpdateExpression || body.updateExpression,
          ExpressionAttributeNames: body.ExpressionAttributeNames || body.expressionAttributeNames,
          ExpressionAttributeValues:
            body.ExpressionAttributeValues || body.expressionAttributeValues,
          ConditionExpression: body.ConditionExpression || body.conditionExpression,
        }),
      );
      return NextResponse.json({ success: true });
    }

    // ─── CreateTable ───────────────────────────────────────────────────────────
    // Create is signalled by the documented request shape (a `TableName` or
    // `tableName` with no other action) or explicitly by action=create /
    // action=createTable. Accepts the documented CreateTableInput field names.
    const isCreate =
      action === "create" ||
      action === "createTable" ||
      (!action && !!(body.TableName || body.tableName));

    if (isCreate) {
      const input = buildCreateTableInput(body);
      if (!input.TableName) {
        return NextResponse.json(
          { error: "TableName is required to create a table" },
          { status: 400 },
        );
      }
      const res = await dynamodbClient.send(new CreateTableCommand(input));
      return NextResponse.json({
        success: true,
        table: res.TableDescription,
        tableDescription: res.TableDescription,
      });
    }

    return NextResponse.json(
      {
        error: `Unknown action: ${action ?? "(none)"}. Supported: scan, query, putItem, getItem, deleteItem, updateItem, create`,
      },
      { status: 400 },
    );
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const dynamodbClient = getUserClientFromRequest(DynamoDBClient, request);
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get("tableName");
    await dynamodbClient.send(new DeleteTableCommand({ TableName: tableName! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
