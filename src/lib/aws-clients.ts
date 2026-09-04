// ─── Imports: all 98 AWS SDK v3 clients ──────────────────────────────────────

// Security & Identity
import { ACMClient } from "@aws-sdk/client-acm";
import { ACMPCAClient } from "@aws-sdk/client-acm-pca";
import { IAMClient } from "@aws-sdk/client-iam";
import { IdentitystoreClient } from "@aws-sdk/client-identitystore";
import { KMSClient } from "@aws-sdk/client-kms";
import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { STSClient } from "@aws-sdk/client-sts";
import { SSOAdminClient } from "@aws-sdk/client-sso-admin";
import { GuardDutyClient } from "@aws-sdk/client-guardduty";
import { Inspector2Client } from "@aws-sdk/client-inspector2";
import { Macie2Client } from "@aws-sdk/client-macie2";
import { SecurityHubClient } from "@aws-sdk/client-securityhub";
import { ShieldClient } from "@aws-sdk/client-shield";
import { WAFClient } from "@aws-sdk/client-waf";
import { WAFRegionalClient } from "@aws-sdk/client-waf-regional";
import { WAFV2Client } from "@aws-sdk/client-wafv2";
import { VerifiedPermissionsClient } from "@aws-sdk/client-verifiedpermissions";

// Compute
import { EC2Client } from "@aws-sdk/client-ec2";
import { ECSClient } from "@aws-sdk/client-ecs";
import { EKSClient } from "@aws-sdk/client-eks";
import { LambdaClient } from "@aws-sdk/client-lambda";
import { AutoScalingClient } from "@aws-sdk/client-auto-scaling";
import { ApplicationAutoScalingClient } from "@aws-sdk/client-application-auto-scaling";
import { BatchClient } from "@aws-sdk/client-batch";
import { ElasticBeanstalkClient } from "@aws-sdk/client-elastic-beanstalk";

// Storage
import { S3Client } from "@aws-sdk/client-s3";
import { S3ControlClient } from "@aws-sdk/client-s3-control";
import { EFSClient } from "@aws-sdk/client-efs";
import { BackupClient } from "@aws-sdk/client-backup";

// Databases
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBStreamsClient } from "@aws-sdk/client-dynamodb-streams";
import { RDSClient } from "@aws-sdk/client-rds";
import { RDSDataClient } from "@aws-sdk/client-rds-data";
import { ElastiCacheClient } from "@aws-sdk/client-elasticache";
import { DocDBClient } from "@aws-sdk/client-docdb";
import { NeptuneClient } from "@aws-sdk/client-neptune";
import { RedshiftClient } from "@aws-sdk/client-redshift";
import { MemoryDBClient } from "@aws-sdk/client-memorydb";
import { OpenSearchClient } from "@aws-sdk/client-opensearch";
import { ElasticsearchServiceClient } from "@aws-sdk/client-elasticsearch-service";
import { TimestreamQueryClient } from "@aws-sdk/client-timestream-query";
import { TimestreamWriteClient } from "@aws-sdk/client-timestream-write";

// Messaging & Eventing
import { SQSClient } from "@aws-sdk/client-sqs";
import { SNSClient } from "@aws-sdk/client-sns";
import { EventBridgeClient } from "@aws-sdk/client-eventbridge";
import { SFNClient } from "@aws-sdk/client-sfn";
import { SchedulerClient } from "@aws-sdk/client-scheduler";
import { PipesClient } from "@aws-sdk/client-pipes";
import { MqClient } from "@aws-sdk/client-mq";

// Containers
import { ECRClient } from "@aws-sdk/client-ecr";

// Streaming & Analytics
import { KinesisClient } from "@aws-sdk/client-kinesis";
import { FirehoseClient } from "@aws-sdk/client-firehose";
import { KafkaClient } from "@aws-sdk/client-kafka";
import { GlueClient } from "@aws-sdk/client-glue";
import { AthenaClient } from "@aws-sdk/client-athena";
import { EMRClient } from "@aws-sdk/client-emr";
import { LakeFormationClient } from "@aws-sdk/client-lakeformation";

// Networking
import { Route53Client } from "@aws-sdk/client-route-53";
import { Route53ResolverClient } from "@aws-sdk/client-route53resolver";
import { CloudFrontClient } from "@aws-sdk/client-cloudfront";
import { ElasticLoadBalancingV2Client } from "@aws-sdk/client-elastic-load-balancing-v2";
import { ServiceDiscoveryClient } from "@aws-sdk/client-servicediscovery";

// Management & Governance
import { CloudFormationClient } from "@aws-sdk/client-cloudformation";
import { CloudControlClient } from "@aws-sdk/client-cloudcontrol";
import { CloudTrailClient } from "@aws-sdk/client-cloudtrail";
import { CloudWatchClient } from "@aws-sdk/client-cloudwatch";
import { CloudWatchLogsClient } from "@aws-sdk/client-cloudwatch-logs";
import { ConfigServiceClient } from "@aws-sdk/client-config-service";
import { SSMClient } from "@aws-sdk/client-ssm";
import { OrganizationsClient } from "@aws-sdk/client-organizations";
import { ResourceGroupsClient } from "@aws-sdk/client-resource-groups";
import { ResourceGroupsTaggingAPIClient } from "@aws-sdk/client-resource-groups-tagging-api";
import { SupportClient } from "@aws-sdk/client-support";
import { RAMClient } from "@aws-sdk/client-ram";
import { XRayClient } from "@aws-sdk/client-xray";

// Developer Tools
import { CodeBuildClient } from "@aws-sdk/client-codebuild";
import { CodeCommitClient } from "@aws-sdk/client-codecommit";
import { CodeDeployClient } from "@aws-sdk/client-codedeploy";
import { CodePipelineClient } from "@aws-sdk/client-codepipeline";

// Application Services
import { SESClient } from "@aws-sdk/client-ses";
import { SESv2Client } from "@aws-sdk/client-sesv2";
import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";
import { PinpointClient } from "@aws-sdk/client-pinpoint";
import { AmplifyClient } from "@aws-sdk/client-amplify";
import { AppSyncClient } from "@aws-sdk/client-appsync";
import { APIGatewayClient } from "@aws-sdk/client-api-gateway";
import { ApiGatewayV2Client } from "@aws-sdk/client-apigatewayv2";
import { TranscribeClient } from "@aws-sdk/client-transcribe";
import { TextractClient } from "@aws-sdk/client-textract";
import { TransferClient } from "@aws-sdk/client-transfer";

// AI / ML
import { BedrockClient } from "@aws-sdk/client-bedrock";
import { BedrockAgentClient } from "@aws-sdk/client-bedrock-agent";
import { BedrockAgentRuntimeClient } from "@aws-sdk/client-bedrock-agent-runtime";
import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { SageMakerClient } from "@aws-sdk/client-sagemaker";

// Media
import { MediaConvertClient } from "@aws-sdk/client-mediaconvert";

// IoT
import { IoTClient } from "@aws-sdk/client-iot";
import { IoTDataPlaneClient } from "@aws-sdk/client-iot-data-plane";

// ─── Client config type ───────────────────────────────────────────────────────

export interface AwsClientConfig {
  endpoint: string;
  region: string;
  credentials: { accessKeyId: string; secretAccessKey: string };
  forcePathStyle?: boolean;
}

// ─── Client factory ───────────────────────────────────────────────────────────

/**
 * Cache keyed by `{ClientClassName}::{region}` so each (client type, region)
 * pair is instantiated once per server process lifetime.
 */
const clientCache = new Map<string, unknown>();

/**
 * Returns a cached SDK client instance for the given class and region.
 *
 * All clients point to `process.env.AWS_ENDPOINT_URL` (LocalStack / Ministack).
 * S3Client automatically receives `forcePathStyle: true` for path-style URL
 * compatibility required by local emulators.
 *
 * @param ClientClass - AWS SDK v3 client constructor
 * @param region      - AWS region string; defaults to `AWS_DEFAULT_REGION` env var
 */
export function getClient<T>(
  ClientClass: new (config: AwsClientConfig) => T,
  region: string = process.env.AWS_DEFAULT_REGION ?? "us-east-1"
): T {
  const key = `${ClientClass.name}::${region}`;

  if (!clientCache.has(key)) {
    const config: AwsClientConfig = {
      endpoint: process.env.AWS_ENDPOINT_URL ?? "http://localhost:4566",
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "test",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "test",
      },
      // S3 requires path-style URLs with LocalStack / Ministack
      forcePathStyle: ClientClass.name === "S3Client" ? true : undefined,
    };
    clientCache.set(key, new ClientClass(config));
  }

  return clientCache.get(key) as T;
}

// ─── Provider detection ───────────────────────────────────────────────────────

/**
 * Pings the local emulator health endpoints to identify which provider is
 * running. Called by the health API route.
 */
export async function detectProvider(): Promise<
  "ministack" | "localstack" | "unknown"
> {
  const base = process.env.AWS_ENDPOINT_URL ?? "http://localhost:4566";

  try {
    const res = await fetch(`${base}/_ministack/health`);
    if (res.ok) return "ministack";
  } catch {
    // provider not available — try next
  }

  try {
    const res = await fetch(`${base}/_localstack/health`);
    if (res.ok) return "localstack";
  } catch {
    // provider not available
  }

  return "unknown";
}

// ─── Singleton exports — Security & Identity ─────────────────────────────────

export const acm = getClient(ACMClient);
export const acmpca = getClient(ACMPCAClient);
export const iam = getClient(IAMClient);
export const identitystore = getClient(IdentitystoreClient);
export const kms = getClient(KMSClient);
export const secretsManager = getClient(SecretsManagerClient);
export const sts = getClient(STSClient);
export const ssoAdmin = getClient(SSOAdminClient);
export const guardduty = getClient(GuardDutyClient);
export const inspector2 = getClient(Inspector2Client);
export const macie2 = getClient(Macie2Client);
export const securityhub = getClient(SecurityHubClient);
export const shield = getClient(ShieldClient);
export const waf = getClient(WAFClient);
export const wafRegional = getClient(WAFRegionalClient);
export const wafv2 = getClient(WAFV2Client);
export const verifiedpermissions = getClient(VerifiedPermissionsClient);

// ─── Singleton exports — Compute ─────────────────────────────────────────────

export const ec2 = getClient(EC2Client);
export const ecs = getClient(ECSClient);
export const eks = getClient(EKSClient);
export const lambda = getClient(LambdaClient);
export const autoscaling = getClient(AutoScalingClient);
export const applicationAutoscaling = getClient(ApplicationAutoScalingClient);
export const batch = getClient(BatchClient);
export const elasticbeanstalk = getClient(ElasticBeanstalkClient);

// ─── Singleton exports — Storage ─────────────────────────────────────────────

export const s3 = getClient(S3Client);
export const s3control = getClient(S3ControlClient);
export const efs = getClient(EFSClient);
export const backup = getClient(BackupClient);

// ─── Singleton exports — Databases ───────────────────────────────────────────

export const dynamodb = getClient(DynamoDBClient);
export const dynamodbStreams = getClient(DynamoDBStreamsClient);
export const rds = getClient(RDSClient);
export const rdsData = getClient(RDSDataClient);
export const elasticache = getClient(ElastiCacheClient);
export const docdb = getClient(DocDBClient);
export const neptune = getClient(NeptuneClient);
export const redshift = getClient(RedshiftClient);
export const memorydb = getClient(MemoryDBClient);
export const opensearch = getClient(OpenSearchClient);
export const elasticsearch = getClient(ElasticsearchServiceClient);
export const timestreamQuery = getClient(TimestreamQueryClient);
export const timestreamWrite = getClient(TimestreamWriteClient);

// ─── Singleton exports — Messaging & Eventing ────────────────────────────────

export const sqs = getClient(SQSClient);
export const sns = getClient(SNSClient);
export const eventbridge = getClient(EventBridgeClient);
export const sfn = getClient(SFNClient);
export const scheduler = getClient(SchedulerClient);
export const pipes = getClient(PipesClient);
export const mq = getClient(MqClient);

// ─── Singleton exports — Containers ──────────────────────────────────────────

export const ecr = getClient(ECRClient);

// ─── Singleton exports — Streaming & Analytics ───────────────────────────────

export const kinesis = getClient(KinesisClient);
export const firehose = getClient(FirehoseClient);
export const kafka = getClient(KafkaClient);
export const glue = getClient(GlueClient);
export const athena = getClient(AthenaClient);
export const emr = getClient(EMRClient);
export const lakeformation = getClient(LakeFormationClient);

// ─── Singleton exports — Networking ──────────────────────────────────────────

export const route53 = getClient(Route53Client);
export const route53resolver = getClient(Route53ResolverClient);
export const cloudfront = getClient(CloudFrontClient);
export const elbv2 = getClient(ElasticLoadBalancingV2Client);
export const servicediscovery = getClient(ServiceDiscoveryClient);

// ─── Singleton exports — Management & Governance ─────────────────────────────

export const cloudformation = getClient(CloudFormationClient);
export const cloudcontrol = getClient(CloudControlClient);
export const cloudtrail = getClient(CloudTrailClient);
export const cloudwatch = getClient(CloudWatchClient);
export const cloudwatchLogs = getClient(CloudWatchLogsClient);
export const configService = getClient(ConfigServiceClient);
export const ssm = getClient(SSMClient);
export const organizations = getClient(OrganizationsClient);
export const resourceGroups = getClient(ResourceGroupsClient);
export const resourceGroupsTagging = getClient(ResourceGroupsTaggingAPIClient);
export const support = getClient(SupportClient);
export const ram = getClient(RAMClient);
export const xray = getClient(XRayClient);

// ─── Singleton exports — Developer Tools ─────────────────────────────────────

export const codebuild = getClient(CodeBuildClient);
export const codecommit = getClient(CodeCommitClient);
export const codedeploy = getClient(CodeDeployClient);
export const codepipeline = getClient(CodePipelineClient);

// ─── Singleton exports — Application Services ────────────────────────────────

export const ses = getClient(SESClient);
export const sesv2 = getClient(SESv2Client);
export const cognitoIdp = getClient(CognitoIdentityProviderClient);
export const pinpoint = getClient(PinpointClient);
export const amplify = getClient(AmplifyClient);
export const appsync = getClient(AppSyncClient);
export const apigateway = getClient(APIGatewayClient);
export const apigatewayv2 = getClient(ApiGatewayV2Client);
export const transcribe = getClient(TranscribeClient);
export const textract = getClient(TextractClient);
export const transfer = getClient(TransferClient);

// ─── Singleton exports — AI / ML ─────────────────────────────────────────────

export const bedrock = getClient(BedrockClient);
export const bedrockAgent = getClient(BedrockAgentClient);
export const bedrockAgentRuntime = getClient(BedrockAgentRuntimeClient);
export const bedrockRuntime = getClient(BedrockRuntimeClient);
export const sagemaker = getClient(SageMakerClient);

// ─── Singleton exports — Media ────────────────────────────────────────────────

export const mediaconvert = getClient(MediaConvertClient);

// ─── Singleton exports — IoT ──────────────────────────────────────────────────

export const iot = getClient(IoTClient);
export const iotData = getClient(IoTDataPlaneClient);

// ─── Re-export all client classes ────────────────────────────────────────────
// API routes can do: import { S3Client, getClient } from "@/lib/aws-clients"

// Security & Identity
export {
  ACMClient,
  ACMPCAClient,
  IAMClient,
  IdentitystoreClient,
  KMSClient,
  SecretsManagerClient,
  STSClient,
  SSOAdminClient,
  GuardDutyClient,
  Inspector2Client,
  Macie2Client,
  SecurityHubClient,
  ShieldClient,
  WAFClient,
  WAFRegionalClient,
  WAFV2Client,
  VerifiedPermissionsClient,
  // Compute
  EC2Client,
  ECSClient,
  EKSClient,
  LambdaClient,
  AutoScalingClient,
  ApplicationAutoScalingClient,
  BatchClient,
  ElasticBeanstalkClient,
  // Storage
  S3Client,
  S3ControlClient,
  EFSClient,
  BackupClient,
  // Databases
  DynamoDBClient,
  DynamoDBStreamsClient,
  RDSClient,
  RDSDataClient,
  ElastiCacheClient,
  DocDBClient,
  NeptuneClient,
  RedshiftClient,
  MemoryDBClient,
  OpenSearchClient,
  ElasticsearchServiceClient,
  TimestreamQueryClient,
  TimestreamWriteClient,
  // Messaging & Eventing
  SQSClient,
  SNSClient,
  EventBridgeClient,
  SFNClient,
  SchedulerClient,
  PipesClient,
  MqClient,
  // Containers
  ECRClient,
  // Streaming & Analytics
  KinesisClient,
  FirehoseClient,
  KafkaClient,
  GlueClient,
  AthenaClient,
  EMRClient,
  LakeFormationClient,
  // Networking
  Route53Client,
  Route53ResolverClient,
  CloudFrontClient,
  ElasticLoadBalancingV2Client,
  ServiceDiscoveryClient,
  // Management & Governance
  CloudFormationClient,
  CloudControlClient,
  CloudTrailClient,
  CloudWatchClient,
  CloudWatchLogsClient,
  ConfigServiceClient,
  SSMClient,
  OrganizationsClient,
  ResourceGroupsClient,
  ResourceGroupsTaggingAPIClient,
  SupportClient,
  RAMClient,
  XRayClient,
  // Developer Tools
  CodeBuildClient,
  CodeCommitClient,
  CodeDeployClient,
  CodePipelineClient,
  // Application Services
  SESClient,
  SESv2Client,
  CognitoIdentityProviderClient,
  PinpointClient,
  AmplifyClient,
  AppSyncClient,
  APIGatewayClient,
  ApiGatewayV2Client,
  TranscribeClient,
  TextractClient,
  TransferClient,
  // AI / ML
  BedrockClient,
  BedrockAgentClient,
  BedrockAgentRuntimeClient,
  BedrockRuntimeClient,
  SageMakerClient,
  // Media
  MediaConvertClient,
  // IoT
  IoTClient,
  IoTDataPlaneClient,
};
