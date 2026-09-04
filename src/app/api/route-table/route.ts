// VERIFICATION GATE: Phase 4 VPC Full — Route Table CRUD + Routes + Associations
// Commands: @aws-sdk/client-ec2 (DescribeRouteTables, CreateRouteTable, DeleteRouteTable,
// CreateRoute, DeleteRoute, AssociateRouteTable)
import { NextResponse } from "next/server";
import {
  DescribeRouteTablesCommand,
  CreateRouteTableCommand,
  DeleteRouteTableCommand,
  CreateRouteCommand,
  DeleteRouteCommand,
  AssociateRouteTableCommand,
} from "@aws-sdk/client-ec2";
import { ec2 } from "@/lib/aws-clients";

export async function GET() {
  try {
    const res = await ec2.send(new DescribeRouteTablesCommand({}));
    return NextResponse.json({ routeTables: res.RouteTables || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await ec2.send(new CreateRouteTableCommand({ VpcId: body.vpcId }));
    return NextResponse.json({ routeTable: res.RouteTable });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    // Create a route in a route table
    if (body.action === "create-route" && body.routeTableId) {
      await ec2.send(
        new CreateRouteCommand({
          RouteTableId: body.routeTableId,
          DestinationCidrBlock: body.destinationCidrBlock || "0.0.0.0/0",
          GatewayId: body.gatewayId,
          NatGatewayId: body.natGatewayId,
          InstanceId: body.instanceId,
          VpcPeeringConnectionId: body.vpcPeeringConnectionId,
        })
      );
      return NextResponse.json({ success: true, action: "create-route" });
    }
    // Delete a route
    if (body.action === "delete-route" && body.routeTableId) {
      await ec2.send(
        new DeleteRouteCommand({
          RouteTableId: body.routeTableId,
          DestinationCidrBlock: body.destinationCidrBlock || "0.0.0.0/0",
        })
      );
      return NextResponse.json({ success: true, action: "delete-route" });
    }
    // Associate route table with subnet
    if (body.action === "associate-route-table" && body.subnetId && body.routeTableId) {
      await ec2.send(
        new AssociateRouteTableCommand({
          RouteTableId: body.routeTableId,
          SubnetId: body.subnetId,
        })
      );
      return NextResponse.json({ success: true, action: "associate-route-table" });
    }
    return NextResponse.json({ error: "Unknown PUT action for route-table" }, { status: 400 });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    await ec2.send(new DeleteRouteTableCommand({ RouteTableId: searchParams.get("routeTableId")! }));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
