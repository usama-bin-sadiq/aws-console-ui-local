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
import { codedeploy } from "@/lib/aws-clients";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const appName = searchParams.get("appName");

    if (action === "deploymentGroups" && appName) {
      const res = await codedeploy.send(
        new ListDeploymentGroupsCommand({ applicationName: appName })
      );
      return NextResponse.json({ deploymentGroups: res.deploymentGroups || [] });
    }

    if (action === "deployments" && appName) {
      const res = await codedeploy.send(
        new ListDeploymentsCommand({ applicationName: appName })
      );
      return NextResponse.json({ deployments: res.deployments || [] });
    }

    if (action === "deploymentConfigs") {
      const res = await codedeploy.send(new ListDeploymentConfigsCommand({}));
      const output = res as { deploymentConfigs?: any[]; deploymentConfigsList?: any[] };
      return NextResponse.json({ deploymentConfigs: output.deploymentConfigs || output.deploymentConfigsList || [] });
    }

    const res = await codedeploy.send(new ListApplicationsCommand({}));
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
  try {
    const body = await request.json();

    if (body.action === "createDeploymentGroup") {
      const res = await codedeploy.send(
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
      const res = await codedeploy.send(
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
      await codedeploy.send(
        new CreateDeploymentConfigCommand({
          deploymentConfigName: body.deploymentConfigName || "CustomConfig",
          minimumHealthyHosts: body.minimumHealthyHosts || { type: "HOST_COUNT", value: 0 },
        })
      );
      return NextResponse.json({ success: true });
    }

    await codedeploy.send(
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
  try {
    const { searchParams } = new URL(request.url);
    const appName = searchParams.get("appName");
    if (appName) {
      await codedeploy.send(
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
