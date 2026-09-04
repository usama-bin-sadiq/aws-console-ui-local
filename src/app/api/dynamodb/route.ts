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
import { dynamodb } from "@/lib/aws-clients";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get("tableName");
    const action = searchParams.get("action");

    // Table-specific actions
    if (tableName) {
      if (action === "describe" || !action) {
        const desc = await dynamodb.send(new DescribeTableCommand({ TableName: tableName }));
        return NextResponse.json({ table: desc.Table });
      }
      if (action === "scan") {
        const limitParam = searchParams.get("limit");
        const cmd = new ScanCommand({
          TableName: tableName,
          Limit: limitParam ? parseInt(limitParam, 10) : undefined,
        });
        const res = await dynamodb.send(cmd);
        return NextResponse.json({ items: res.Items || [], count: res.Count, scannedCount: res.ScannedCount, lastEvaluatedKey: res.LastEvaluatedKey });
      }
      if (action === "query") {
        const keyConditionExpression = searchParams.get("keyConditionExpression") || undefined;
        const expressionAttributeValues = searchParams.get("expressionAttributeValues") ? JSON.parse(searchParams.get("expressionAttributeValues")!) : undefined;
        const expressionAttributeNames = searchParams.get("expressionAttributeNames") ? JSON.parse(searchParams.get("expressionAttributeNames")!) : undefined;
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
        const res = await dynamodb.send(cmd);
        return NextResponse.json({ items: res.Items || [], count: res.Count, scannedCount: res.ScannedCount, lastEvaluatedKey: res.LastEvaluatedKey });
      }
    }

    // Default: list all tables
    const res = await dynamodb.send(new ListTablesCommand({}));
    const tables = [];
    for (const name of res.TableNames || []) {
      const desc = await dynamodb.send(new DescribeTableCommand({ TableName: name }));
      tables.push(desc.Table);
    }
    return NextResponse.json({ tables });
  } catch (error: any) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawTableName = body.tableName || body.TableName;
    const action = body.action || (body.TableName && !body.tableName ? "createTable" : undefined);

    // Item operations
    if (action === "scan") {
      const cmd = new ScanCommand({
        TableName: rawTableName,
        Limit: body.limit,
        FilterExpression: body.filterExpression,
        ExpressionAttributeNames: body.expressionAttributeNames,
        ExpressionAttributeValues: body.expressionAttributeValues,
      });
      const res = await dynamodb.send(cmd);
      return NextResponse.json({ items: res.Items || [], count: res.Count, scannedCount: res.ScannedCount, lastEvaluatedKey: res.LastEvaluatedKey });
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
      const res = await dynamodb.send(cmd);
      return NextResponse.json({ items: res.Items || [], count: res.Count, scannedCount: res.ScannedCount, lastEvaluatedKey: res.LastEvaluatedKey });
    }

    if (action === "putItem") {
      await dynamodb.send(new PutItemCommand({
        TableName: rawTableName,
        Item: body.item,
        ConditionExpression: body.conditionExpression,
        ExpressionAttributeNames: body.expressionAttributeNames,
        ExpressionAttributeValues: body.expressionAttributeValues,
      }));
      return NextResponse.json({ success: true });
    }

    if (action === "getItem") {
      const res = await dynamodb.send(new GetItemCommand({
        TableName: rawTableName,
        Key: body.key,
      }));
      return NextResponse.json({ item: res.Item || null, metadata: { sdkResponseMetadata: res.$metadata } });
    }

    if (action === "deleteItem") {
      await dynamodb.send(new DeleteItemCommand({
        TableName: rawTableName,
        Key: body.key,
        ConditionExpression: body.conditionExpression,
        ExpressionAttributeNames: body.expressionAttributeNames,
        ExpressionAttributeValues: body.expressionAttributeValues,
      }));
      return NextResponse.json({ success: true });
    }

    if (action === "updateItem") {
      await dynamodb.send(new UpdateItemCommand({
        TableName: rawTableName,
        Key: body.key,
        UpdateExpression: body.updateExpression,
        ExpressionAttributeNames: body.expressionAttributeNames,
        ExpressionAttributeValues: body.expressionAttributeValues,
        ConditionExpression: body.conditionExpression,
      }));
      return NextResponse.json({ success: true });
    }

    // Backward-compatible table creation
    if (body.TableName || action === "createTable") {
      await dynamodb.send(new CreateTableCommand(body));
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action or missing tableName/TableName" }, { status: 400 });
  } catch (error: any) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get("tableName");
    await dynamodb.send(new DeleteTableCommand({ TableName: tableName! }));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
