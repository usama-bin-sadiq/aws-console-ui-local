import { NextResponse } from "next/server";
import { ListAccountsCommand, DescribeOrganizationCommand, CreateAccountCommand } from "@aws-sdk/client-organizations";
import { organizations } from "@/lib/aws-clients";

export async function GET() {
  try {
    const [accountsRes, orgRes] = await Promise.all([
      organizations.send(new ListAccountsCommand({})).catch(() => ({ Accounts: [] })),
      organizations.send(new DescribeOrganizationCommand({})).catch(() => ({ Organization: null })),
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
  try {
    const body = await request.json();
    const res = await organizations.send(new CreateAccountCommand({
      Email: body.email,
      AccountName: body.accountName,
    }));
    return NextResponse.json({ createAccountStatus: res.CreateAccountStatus });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
