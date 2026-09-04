import { NextResponse } from "next/server";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";
import { ListFunctionsCommand, CreateFunctionCommand, DeleteFunctionCommand, InvokeCommand } from "@aws-sdk/client-lambda";
import { lambda } from "@/lib/aws-clients";

export async function GET() {
  try {
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
    if (body.action === "invoke") {
      const res = await lambda.send(new InvokeCommand({
        FunctionName: body.functionName,
        Payload: body.payload ? Buffer.from(body.payload) : undefined,
      }));
      return NextResponse.json({ result: res });
    }
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
    await lambda.send(new DeleteFunctionCommand({ FunctionName: functionName! }));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
