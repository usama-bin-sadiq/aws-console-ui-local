import { NextResponse } from "next/server";
import { OrganizationsClient, ListAccountsCommand, DescribeOrganizationCommand, CreateAccountCommand } from "@aws-sdk/client-organizations";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const organizationsClient = getUserClientFromRequest(OrganizationsClient, request);
    const [accountsRes, orgRes] = await Promise.all([
      organizationsClient.send(new ListAccountsCommand({})).catch(() => ({ Accounts: [] })),
      organizationsClient.send(new DescribeOrganizationCommand({})).catch(() => ({ Organization: null })),
    ]);
    return NextResponse.json({
      accounts: accountsRes.Accounts || [],
      organization: orgRes.Organization || null,
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const organizationsClient = getUserClientFromRequest(OrganizationsClient, request);
    const body = await request.json();
    const res = await organizationsClient.send(new CreateAccountCommand({
      Email: body.email,
      AccountName: body.accountName,
    }));
    return NextResponse.json({ createAccountStatus: res.CreateAccountStatus });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
