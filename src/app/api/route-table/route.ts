// VERIFICATION GATE: Phase 4 VPC Full — Route Table CRUD + Routes + Associations
// Commands: @aws-sdk/client-ec2 (DescribeRouteTables, CreateRouteTable, DeleteRouteTable,
// CreateRoute, DeleteRoute, AssociateRouteTable)
import { NextResponse } from "next/server";
import {
  EC2Client,
  DescribeRouteTablesCommand,
  CreateRouteTableCommand,
  DeleteRouteTableCommand,
  CreateRouteCommand,
  DeleteRouteCommand,
  AssociateRouteTableCommand,
} from "@aws-sdk/client-ec2";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";
import { getAdapterStatus, handleAdapterError } from "@/lib/adapter-error-handler";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const ec2Client = getUserClientFromRequest(EC2Client, request);
    const res = await ec2Client.send(new DescribeRouteTablesCommand({}));
    return NextResponse.json({ routeTables: res.RouteTables || [] });
  } catch (error) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const ec2Client = getUserClientFromRequest(EC2Client, request);
    const body = await request.json();
    const res = await ec2Client.send(new CreateRouteTableCommand({ VpcId: body.vpcId }));
    return NextResponse.json({ routeTable: res.RouteTable });
  } catch (error) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}

export async function PUT(request: Request) {
  const denied = await requirePermission(request, "PUT");
  if (denied) return denied;

  try {
    const ec2Client = getUserClientFromRequest(EC2Client, request);
    const body = await request.json();
    // Create a route in a route table
    if (body.action === "create-route" && body.routeTableId) {
      await ec2Client.send(
        new CreateRouteCommand({
          RouteTableId: body.routeTableId,
          DestinationCidrBlock: body.destinationCidrBlock || "0.0.0.0/0",
          GatewayId: body.gatewayId,
          NatGatewayId: body.natGatewayId,
          InstanceId: body.instanceId,
          VpcPeeringConnectionId: body.vpcPeeringConnectionId,
        }),
      );
      return NextResponse.json({ success: true, action: "create-route" });
    }
    // Delete a route
    if (body.action === "delete-route" && body.routeTableId) {
      await ec2Client.send(
        new DeleteRouteCommand({
          RouteTableId: body.routeTableId,
          DestinationCidrBlock: body.destinationCidrBlock || "0.0.0.0/0",
        }),
      );
      return NextResponse.json({ success: true, action: "delete-route" });
    }
    // Associate route table with subnet
    if (body.action === "associate-route-table" && body.subnetId && body.routeTableId) {
      await ec2Client.send(
        new AssociateRouteTableCommand({
          RouteTableId: body.routeTableId,
          SubnetId: body.subnetId,
        }),
      );
      return NextResponse.json({ success: true, action: "associate-route-table" });
    }
    return NextResponse.json({ error: "Unknown PUT action for route-table" }, { status: 400 });
  } catch (error) {
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
    await ec2Client.send(
      new DeleteRouteTableCommand({ RouteTableId: searchParams.get("routeTableId")! }),
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    const adapter = getAdapterStatus();
    return handleAdapterError(error, adapter.mode, adapter.endpoint);
  }
}
