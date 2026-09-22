import { NextResponse } from "next/server";
import {
  ListApplicationsCommand,
  CreateApplicationCommand,
  DeleteApplicationCommand,
  ListDeploymentGroupsCommand,
  CreateDeploymentGroupCommand,
  ListDeploymentsCommand,
  CreateDeploymentCommand,
  ListDeploymentConfigsCommand,
  CreateDeploymentConfigCommand,
} from "@aws-sdk/client-codedeploy";
import { CodeDeployClient } from "@aws-sdk/client-codedeploy";
import { getUserClientFromRequest } from "@/lib/aws-clients";
import { requirePermission } from "@/lib/data-isolation";

export async function GET(request: Request) {
  const denied = await requirePermission(request, "GET");
  if (denied) return denied;

  try {
    const codedeployClient = getUserClientFromRequest(CodeDeployClient, request);
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const appName = searchParams.get("appName");

    if (action === "deploymentGroups" && appName) {
      const res = await codedeployClient.send(
        new ListDeploymentGroupsCommand({ applicationName: appName })
      );
      return NextResponse.json({ deploymentGroups: res.deploymentGroups || [] });
    }

    if (action === "deployments" && appName) {
      const res = await codedeployClient.send(
        new ListDeploymentsCommand({ applicationName: appName })
      );
      return NextResponse.json({ deployments: res.deployments || [] });
    }

    if (action === "deploymentConfigs") {
      const res = await codedeployClient.send(new ListDeploymentConfigsCommand({}));
      const output = res as { deploymentConfigs?: any[]; deploymentConfigsList?: any[] };
      return NextResponse.json({ deploymentConfigs: output.deploymentConfigs || output.deploymentConfigsList || [] });
    }

    const res = await codedeployClient.send(new ListApplicationsCommand({}));
    return NextResponse.json({
      applications: (res.applications || []).map((name: string) => ({
        applicationName: name,
      })),
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const denied = await requirePermission(request, "POST");
  if (denied) return denied;

  try {
    const codedeployClient = getUserClientFromRequest(CodeDeployClient, request);
    const body = await request.json();

    if (body.action === "createDeploymentGroup") {
      const res = await codedeployClient.send(
        new CreateDeploymentGroupCommand({
          applicationName: body.applicationName,
          deploymentGroupName: body.deploymentGroupName,
          deploymentConfigName: body.deploymentConfigName || "CodeDeployDefault.AllAtOnce",
          serviceRoleArn:
            body.serviceRoleArn ||
            "arn:aws:iam::000000000000:role/codedeploy-service-role",
          ec2TagFilters: body.ec2TagFilters,
          onPremisesInstanceTagFilters: body.onPremisesInstanceTagFilters,
        })
      );
      return NextResponse.json({ deploymentGroup: res });
    }

    if (body.action === "createDeployment") {
      const res = await codedeployClient.send(
        new CreateDeploymentCommand({
          applicationName: body.applicationName,
          deploymentGroupName: body.deploymentGroupName,
          revision: body.revision || {
            revisionType: "S3",
            s3Location: {
              bucket: body.bucket || "code-deploy-bucket",
              key: body.key || "app.zip",
              bundleType: "zip",
            },
          },
        })
      );
      return NextResponse.json({ deploymentId: res.deploymentId });
    }

    if (body.action === "createDeploymentConfig") {
      await codedeployClient.send(
        new CreateDeploymentConfigCommand({
          deploymentConfigName: body.deploymentConfigName || "CustomConfig",
          minimumHealthyHosts: body.minimumHealthyHosts || { type: "HOST_COUNT", value: 0 },
        })
      );
      return NextResponse.json({ success: true });
    }

    await codedeployClient.send(
      new CreateApplicationCommand({
        applicationName: body.name,
        computePlatform: body.platform || "Server",
      })
    );
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const denied = await requirePermission(request, "DELETE");
  if (denied) return denied;

  try {
    const codedeployClient = getUserClientFromRequest(CodeDeployClient, request);
    const { searchParams } = new URL(request.url);
    const appName = searchParams.get("appName");
    if (appName) {
      await codedeployClient.send(
        new DeleteApplicationCommand({ applicationName: appName })
      );
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "appName required" }, { status: 400 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
