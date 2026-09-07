import { useState, useEffect, useCallback } from "react";

export interface ServiceResourceCounts {
  [serviceHref: string]: number;
}

export interface UseResourceCountsResult {
  counts: ServiceResourceCounts;
  loading: boolean;
  refresh: () => void;
}

const API_ENDPOINTS: Record<string, string> = {
  "/ec2": "/api/ec2",
  "/lambda": "/api/lambda",
  "/s3": "/api/s3",
  "/dynamodb": "/api/dynamodb",
  "/rds": "/api/rds",
  "/vpc": "/api/vpc",
  "/subnet": "/api/subnet",
  "/security-group": "/api/security-group",
  "/iam": "/api/iam",
  "/sqs": "/api/sqs",
  "/sns": "/api/sns",
  "/sfn": "/api/sfn",
  "/step-functions": "/api/sfn",
  "/apigateway": "/api/apigateway",
  "/api": "/api/apigateway",
  "/cloudwatch": "/api/cloudwatch",
  "/cloudformation": "/api/cloudformation",
  "/route-table": "/api/route-table",
  "/internet-gateway": "/api/internet-gateway",
  "/nat-gateway": "/api/nat-gateway",
  "/elastic-ip": "/api/elastic-ip",
  "/network-acl": "/api/network-acl",
  "/volume": "/api/volume",
  "/snapshot": "/api/snapshot",
  "/efs": "/api/efs",
  "/ecr-repo": "/api/ecr",
  "/ecs-cluster": "/api/ecs",
  "/ecs-service": "/api/ecs",
  "/eks-cluster": "/api/eks",
  "/auto-scaling": "/api/auto-scaling",
  "/launch-template": "/api/launch-template",
  "/ami": "/api/ami",
  "/bedrock": "/api/bedrock",
  "/athena": "/api/athena",
  "/glue-catalog": "/api/glue-catalog",
  "/glue-job": "/api/glue-job",
  "/kinesis": "/api/kinesis",
  "/firehose": "/api/firehose",
  "/opensearch": "/api/opensearch",
  "/codebuild": "/api/codebuild",
  "/code-deploy": "/api/code-deploy",
  "/codepipeline": "/api/codepipeline",
  "/cloudfront": "/api/cloudfront",
  "/route53": "/api/route53",
  "/secrets-manager": "/api/secrets-manager",
  "/kms": "/api/kms",
  "/acm": "/api/acm",
  "/eventbridge": "/api/eventbridge",
  "/eventbridge-schema": "/api/eventbridge",
  "/eventbridge-pipe": "/api/eventbridge-pipe",
  "/eventbridge-scheduler": "/api/eventbridge-scheduler",
  "/sns-sms": "/api/sns",
  "/systems-manager-parameter-store": "/api/ssm",
  "/config": "/api/config",
  "/cloudtrail": "/api/cloudtrail",
  "/batch-job": "/api/batch",
  "/fargate": "/api/fargate",
  "/dsql": "/api/dsql",
  "/rds-data": "/api/rds-data",
  "/elasticache": "/api/elasticache",
  "/backup": "/api/backup",
  "/s3-tables": "/api/s3-tables",
  "/sagemaker": "/api/sagemaker",
  "/bedrock-runtime": "/api/bedrock",
  "/comprehend": "/api/comprehend",
  "/polly": "/api/polly",
  "/rekognition": "/api/rekognition",
  "/lex": "/api/lex",
  "/amplify": "/api/amplify",
  "/iot-core": "/api/iot",
  "/connect": "/api/connect",
  "/pinpoint": "/api/pinpoint",
  "/ses": "/api/ses",
  "/x-ray": "/api/xray",
  "/cost-explorer": "/api/cost-explorer",
  "/billing": "/api/billing",
  "/budget": "/api/budget",
  "/support": "/api/support",
  "/organizations": "/api/organizations",
  "/resource-groups": "/api/resource-groups",
  "/resource-groups-tagging": "/api/resource-groups-tagging",
  "/cloudcontrol": "/api/cloudcontrol",
  "/appconfig": "/api/appconfig",
  "/appsync": "/api/appsync",
  "/app-mesh": "/api/app-mesh",
  "/servicediscovery": "/api/servicediscovery",
  "/pipes": "/api/pipes",
  "/quicksight": "/api/quicksight",
  "/emr": "/api/emr",
  "/iot-analytics": "/api/iot-analytics",
  "/device-farm": "/api/device-farm",
  "/imds": "/api/imds",
};

function extractCount(data: any, href: string): number {
  if (!data || typeof data !== "object") return 0;

  const extractListLength = (obj: any): number => {
    if (Array.isArray(obj)) return obj.length;
    if (obj && typeof obj === "object") {
      for (const key of Object.keys(obj)) {
        if (Array.isArray(obj[key])) return obj[key].length;
      }
    }
    return 0;
  };

  switch (href) {
    case "/ec2":
      return extractListLength(data.instances);
    case "/lambda":
      return extractListLength(data.functions);
    case "/s3":
      return extractListLength(data.buckets);
    case "/dynamodb":
      return extractListLength(data.tables);
    case "/rds":
      return extractListLength(data.dbInstances);
    case "/vpc":
      return extractListLength(data.vpcs);
    case "/subnet":
      return extractListLength(data.subnets);
    case "/security-group":
      return extractListLength(data.securityGroups);
    case "/iam":
      return extractListLength(data.users) + extractListLength(data.roles) + extractListLength(data.policies);
    case "/sqs":
      return extractListLength(data.queues);
    case "/sns":
      return extractListLength(data.topics);
    case "/sfn":
    case "/step-functions":
      return extractListLength(data.stateMachines);
    case "/apigateway":
    case "/api":
      return extractListLength(data.apis);
    case "/cloudwatch":
      return extractListLength(data.alarms);
    case "/cloudformation":
      return extractListLength(data.stacks);
    case "/route-table":
      return extractListLength(data.routeTables);
    case "/internet-gateway":
      return extractListLength(data.internetGateways);
    case "/nat-gateway":
      return extractListLength(data.natGateways);
    case "/elastic-ip":
      return extractListLength(data.addresses);
    case "/network-acl":
      return extractListLength(data.networkAcls);
    case "/volume":
      return extractListLength(data.volumes);
    case "/snapshot":
      return extractListLength(data.snapshots);
    case "/efs":
      return extractListLength(data.fileSystems);
    case "/ecr-repo":
      return extractListLength(data.repositories);
    case "/ecs-cluster":
      return extractListLength(data.clusters);
    case "/ecs-service":
      return extractListLength(data.services);
    case "/eks-cluster":
      return extractListLength(data.clusters);
    case "/auto-scaling":
    case "/app-auto-scaling":
      return extractListLength(data.scalingGroups);
    case "/launch-template":
      return extractListLength(data.launchTemplates);
    case "/ami":
      return extractListLength(data.images);
    case "/bedrock":
    case "/bedrock-runtime":
      return extractListLength(data.foundationModels);
    case "/athena":
      return extractListLength(data.workGroups);
    case "/glue-catalog":
      return extractListLength(data.databases);
    case "/glue-job":
      return extractListLength(data.jobs);
    case "/kinesis":
      return extractListLength(data.streams);
    case "/firehose":
      return extractListLength(data.deliveryStreams);
    case "/opensearch":
      return extractListLength(data.domainNames);
    case "/codebuild":
      return extractListLength(data.projects);
    case "/code-deploy":
      return extractListLength(data.applications);
    case "/codepipeline":
      return extractListLength(data.pipelines);
    case "/cloudfront":
      return extractListLength(data.distributions);
    case "/route53":
      return extractListLength(data.hostedZones);
    case "/secrets-manager":
      return extractListLength(data.secretList);
    case "/kms":
      return extractListLength(data.keys);
    case "/acm":
      return extractListLength(data.certificateArnList) || extractListLength(data.certificates);
    case "/eventbridge":
    case "/eventbridge-schema":
      return extractListLength(data.registries);
    case "/eventbridge-pipe":
      return extractListLength(data.pipes);
    case "/eventbridge-scheduler":
      return extractListLength(data.schedules);
    case "/systems-manager-parameter-store":
    case "/ssm":
      return extractListLength(data.parameters);
    case "/config":
      return extractListLength(data.configRules);
    case "/cloudtrail":
      return extractListLength(data.trails);
    default:
      return extractListLength(data);
  }
}

export function useResourceCounts(): UseResourceCountsResult {
  const [counts, setCounts] = useState<ServiceResourceCounts>({});
  const [loading, setLoading] = useState(true);

  const fetchCounts = useCallback(async () => {
    setLoading(true);
    const newCounts: ServiceResourceCounts = {};
    const entries = Object.entries(API_ENDPOINTS);

    await Promise.allSettled(
      entries.map(async ([href, endpoint]) => {
        try {
          const res = await fetch(endpoint);
          if (res.ok) {
            const data = await res.json();
            newCounts[href] = extractCount(data, href);
          } else {
            newCounts[href] = 0;
          }
        } catch {
          newCounts[href] = 0;
        }
      })
    );

    setCounts(newCounts);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 60000);
    return () => clearInterval(interval);
  }, [fetchCounts]);

  return { counts, loading, refresh: fetchCounts };
}
