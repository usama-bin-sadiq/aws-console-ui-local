import { NextResponse } from "next/server";
import {
  OrganizationsClient,
  ListAccountsCommand,
  DescribeOrganizationCommand,
  CreateAccountCommand,
} from "@aws-sdk/client-organizations";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const organizationsClient = getUserClientFromRequest(OrganizationsClient, request);
    const [accountsRes, orgRes] = await Promise.all([
      organizationsClient.send(new ListAccountsCommand({})).catch(() => ({ Accounts: [] })),
      organizationsClient
        .send(new DescribeOrganizationCommand({}))
        .catch(() => ({ Organization: null })),
    ]);
    return NextResponse.json({
      accounts: accountsRes.Accounts || [],
      organization: orgRes.Organization || null,
    });
  } catch (error) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const organizationsClient = getUserClientFromRequest(OrganizationsClient, request);
    const body = await request.json();
    const res = await organizationsClient.send(
      new CreateAccountCommand({
        Email: body.email,
        AccountName: body.accountName,
      }),
    );
    return NextResponse.json({ createAccountStatus: res.CreateAccountStatus });
  } catch (error) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
