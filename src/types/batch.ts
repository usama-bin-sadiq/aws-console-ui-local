// ─── AWS Batch Types ────────────────────────────────────────────────────────────

// Enums matching AWS Batch API
export type CEType = "MANAGED" | "UNMANAGED";
export type CEState = "ENABLED" | "DISABLED";
export type CEStatus = "CREATING" | "VALID" | "INVALID" | "DELETING" | "DELETED" | "UPDATING";
export type JQState = "ENABLED" | "DISABLED";
export type JQStatus = "CREATING" | "VALID" | "INVALID" | "DELETING" | "DELETED" | "UPDATING";
export type JobStatus =
  | "SUBMITTED"
  | "PENDING"
  | "RUNNABLE"
  | "STARTING"
  | "RUNNING"
  | "SUCCEEDED"
  | "FAILED";
export type JobDefinitionType = "container" | "multinode";
export type CRAllocationStrategy =
  | "BEST_FIT"
  | "BEST_FIT_PROGRESSIVE"
  | "BEST_FIT_PROGRESSIVE_ORDERED"
  | "SPOT_CAPACITY_OPTIMIZED"
  | "SPOT_CAPACITY_OPTIMIZED_PRIORITIZED"
  | "SPOT_PRICE_CAPACITY_OPTIMIZED";
export type PlatformCapability = "EC2" | "FARGATE" | "MANAGED_INSTANCES";
export type OrchestrationType = "ECS" | "EKS";
export type RetryAction = "RETRY" | "EXIT";
export type JQType = "ECS" | "ECS_FARGATE" | "ECS_MANAGED_INSTANCES" | "EKS" | "SAGEMAKER_TRAINING";
export type UserdataType = "EKS_BOOTSTRAP_SH" | "EKS_NODEADM";
export type CRType = "EC2" | "SPOT" | "FARGATE" | "FARGATE_SPOT" | "ECS_MANAGED_INSTANCES";

// Core types
export interface Tag {
  Key: string;
  Value: string;
}

export interface ComputeResource {
  type?: CRType;
  allocationStrategy?: CRAllocationStrategy;
  minvCpus?: number;
  maxvCpus?: number;
  desiredvCpus?: number;
  instanceTypes?: string[];
  imageId?: string;
  subnets?: string[];
  securityGroupIds?: string[];
  ec2KeyPair?: string;
  instanceRole?: string;
  tags?: Record<string, string>;
  placementGroup?: string;
  bidPercentage?: number;
  spotIamFleetRole?: string;
  launchTemplate?: LaunchTemplateSpecification;
  ec2Configuration?: Ec2Configuration[];
}

export interface LaunchTemplateSpecification {
  launchTemplateId?: string;
  launchTemplateName?: string;
  version?: string;
}

export interface Ec2Configuration {
  imageType: string;
  imageIdOverride?: string;
  imageKubernetesVersion?: string;
}

export interface ComputeEnvironmentDetail {
  computeEnvironmentName?: string;
  computeEnvironmentArn?: string;
  unmanagedvCpus?: number;
  ecsClusterArn?: string;
  tags?: Record<string, string>;
  type?: CEType;
  state?: CEState;
  status?: CEStatus;
  statusReason?: string;
  computeResources?: ComputeResource;
  serviceRole?: string;
  updatePolicy?: UpdatePolicy;
  eksConfiguration?: EksConfiguration;
  containerOrchestrationType?: OrchestrationType;
  uuid?: string;
  context?: string;
  ecsSettings?: EcsSettings;
}

export interface UpdatePolicy {
  terminateJobsOnUpdate?: boolean;
  jobExecutionTimeoutMinutes?: number;
}

export interface EksConfiguration {
  eksClusterArn?: string;
  kubernetesNamespace?: string;
}

export interface EcsSettings {
  containerInsights?: "DISABLED" | "ENABLED" | "ENHANCED";
}

export interface ComputeEnvironmentOrder {
  order: number;
  computeEnvironment: string;
}

export interface JobQueueDetail {
  jobQueueName?: string;
  jobQueueArn?: string;
  state?: JQState;
  schedulingPolicyArn?: string;
  status?: JQStatus;
  statusReason?: string;
  priority?: number;
  computeEnvironmentOrder?: ComputeEnvironmentOrder[];
  serviceEnvironmentOrder?: ServiceEnvironmentOrder[];
  jobQueueType?: JQType;
  tags?: Record<string, string>;
  jobStateTimeLimitActions?: JobStateTimeLimitAction[];
}

export interface ServiceEnvironmentOrder {
  order: number;
  serviceEnvironment: string;
}

export interface JobStateTimeLimitAction {
  reason: string;
  state: "RUNNABLE";
  maxTimeSeconds: number;
  action: "CANCEL" | "TERMINATE";
}

export interface JobDefinition {
  jobDefinitionName?: string;
  jobDefinitionArn?: string;
  revision?: number;
  status?: string;
  type?: JobDefinitionType;
  schedulingPriority?: number;
  parameters?: Record<string, string>;
  retryStrategy?: RetryStrategy;
  containerProperties?: ContainerProperties;
  timeout?: JobTimeout;
  nodeProperties?: NodeProperties;
  tags?: Record<string, string>;
  propagateTags?: boolean;
  platformCapabilities?: PlatformCapability[];
  ecsProperties?: EcsProperties;
  eksProperties?: EksProperties;
  containerOrchestrationType?: OrchestrationType;
  consumableResourceProperties?: ConsumableResourceProperties;
}

export interface RetryStrategy {
  attempts?: number;
  evaluateOnExit?: EvaluateOnExit[];
}

export interface EvaluateOnExit {
  onStatusReason?: string;
  onReason?: string;
  onExitCode?: string;
  action: RetryAction;
}

export interface JobTimeout {
  attemptDurationSeconds?: number;
}

export interface ContainerProperties {
  image?: string;
  vcpus?: number;
  memory?: number;
  command?: string[];
  jobRoleArn?: string;
  executionRoleArn?: string;
  volumes?: Volume[];
  environment?: KeyValuePair[];
  mountPoints?: MountPoint[];
  readonlyRootFilesystem?: boolean;
  privileged?: boolean;
  ulimits?: Ulimit[];
  user?: string;
  instanceType?: string;
  resourceRequirements?: ResourceRequirement[];
  linuxParameters?: LinuxParameters;
  logConfiguration?: LogConfiguration;
  secrets?: Secret[];
  networkConfiguration?: NetworkConfiguration;
  fargatePlatformConfiguration?: FargatePlatformConfiguration;
  ephemeralStorage?: EphemeralStorage;
}

export interface NodeProperties {
  numNodes?: number;
  mainNode?: number;
  nodeRangeProperties?: NodeRangeProperty[];
}

export interface NodeRangeProperty {
  targetNodes?: string;
  container?: ContainerProperties;
}

export interface EcsProperties {
  taskProperties?: TaskProperty[];
}

export interface TaskProperty {
  containers?: EcsContainerProperties[];
  volumes?: Volume[];
  ipcMode?: string;
  pidMode?: string;
}

export interface EcsContainerProperties {
  name?: string;
  image?: string;
  command?: string[];
  environment?: KeyValuePair[];
  resourceRequirements?: ResourceRequirement[];
  mountPoints?: MountPoint[];
  volumesFrom?: VolumeFrom[];
  linuxParameters?: LinuxParameters;
  logConfiguration?: LogConfiguration;
  secrets?: Secret[];
  networkConfiguration?: NetworkConfiguration;
  executionRoleArn?: string;
  jobRoleArn?: string;
  ulimits?: Ulimit[];
  user?: string;
  readonlyRootFilesystem?: boolean;
  privileged?: boolean;
  essential?: boolean;
  entryPoint?: string[];
  portMappings?: PortMapping[];
  ephemeralStorage?: EphemeralStorage;
}

export interface EksProperties {
  podProperties?: PodProperties;
}

export interface PodProperties {
  serviceAccountName?: string;
  hostNetwork?: boolean;
  dnsPolicy?: string;
  containers?: EksContainerProperties[];
  initContainers?: EksContainerProperties[];
  volumes?: EksVolume[];
  metadata?: Metadata;
}

export interface EksContainerProperties {
  name?: string;
  image?: string;
  command?: string[];
  args?: string[];
  env?: KeyValuePair[];
  resources?: ResourceRequirements;
  volumeMounts?: VolumeMount[];
  securityContext?: SecurityContext;
  imagePullPolicy?: string;
}

export interface ResourceRequirements {
  limits?: Record<string, string>;
  requests?: Record<string, string>;
}

export interface VolumeMount {
  name?: string;
  mountPath?: string;
  readOnly?: boolean;
}

export interface SecurityContext {
  runAsUser?: number;
  runAsGroup?: number;
  privileged?: boolean;
  allowPrivilegeEscalation?: boolean;
  readOnlyRootFilesystem?: boolean;
}

export interface EksVolume {
  name?: string;
  hostPath?: HostPath;
  emptyDir?: EmptyDir;
  secret?: SecretVolume;
  configMap?: ConfigMapVolume;
  persistentVolumeClaim?: PersistentVolumeClaimVolume;
}

export interface HostPath {
  path?: string;
  type?: string;
}

export interface EmptyDir {
  medium?: string;
  sizeLimit?: string;
}

export interface SecretVolume {
  secretName?: string;
  optional?: boolean;
}

export interface ConfigMapVolume {
  name?: string;
  optional?: boolean;
}

export interface PersistentVolumeClaimVolume {
  claimName?: string;
  readOnly?: boolean;
}

export interface Metadata {
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  namespace?: string;
}

export interface ConsumableResourceProperties {
  consumableResourceList?: ConsumableResourceRequirement[];
}

export interface ConsumableResourceRequirement {
  consumableResource?: string;
  quantity?: number;
}

// Job types
export interface JobDetail {
  jobArn?: string;
  jobName?: string;
  jobId?: string;
  jobQueue?: string;
  status?: JobStatus;
  shareIdentifier?: string;
  schedulingPriority?: number;
  attempts?: AttemptDetail[];
  statusReason?: string;
  createdAt?: number;
  retryStrategy?: RetryStrategy;
  startedAt?: number;
  stoppedAt?: number;
  dependsOn?: JobDependency[];
  jobDefinition?: string;
  parameters?: Record<string, string>;
  container?: ContainerDetail;
  nodeDetails?: NodeDetails;
  nodeProperties?: NodeProperties;
  arrayProperties?: ArrayPropertiesDetail;
  timeout?: JobTimeout;
  tags?: Record<string, string>;
  propagateTags?: boolean;
  platformCapabilities?: PlatformCapability[];
  eksProperties?: EksPropertiesDetail;
  isCancelled?: boolean;
  isTerminated?: boolean;
  consumableResourceProperties?: ConsumableResourceProperties;
}

export interface AttemptDetail {
  container?: AttemptContainerDetail;
  startedAt?: number;
  stoppedAt?: number;
  statusReason?: string;
  taskProperties?: AttemptEcsTaskDetails[];
}

export interface AttemptContainerDetail {
  containerInstanceArn?: string;
  taskArn?: string;
  exitCode?: number;
  reason?: string;
  logStreamName?: string;
  networkInterfaces?: NetworkInterface[];
}

export interface AttemptEcsTaskDetails {
  containerInstanceArn?: string;
  taskArn?: string;
  containers?: AttemptTaskContainerDetails[];
}

export interface AttemptTaskContainerDetails {
  exitCode?: number;
  name?: string;
  reason?: string;
  logStreamName?: string;
  networkInterfaces?: NetworkInterface[];
}

export interface JobDependency {
  jobId?: string;
  type?: "N_TO_N" | "SEQUENTIAL";
}

export interface ContainerDetail {
  image?: string;
  vcpus?: number;
  memory?: number;
  command?: string[];
  jobRoleArn?: string;
  executionRoleArn?: string;
  volumes?: Volume[];
  environment?: KeyValuePair[];
  mountPoints?: MountPoint[];
  readonlyRootFilesystem?: boolean;
  ulimits?: Ulimit[];
  user?: string;
  instanceType?: string;
  resourceRequirements?: ResourceRequirement[];
  linuxParameters?: LinuxParameters;
  logConfiguration?: LogConfiguration;
  secrets?: Secret[];
  networkConfiguration?: NetworkConfiguration;
  fargatePlatformConfiguration?: FargatePlatformConfiguration;
  ephemeralStorage?: EphemeralStorage;
  exitCode?: number;
  reason?: string;
  containerInstanceArn?: string;
  taskArn?: string;
  logStreamName?: string;
}

export interface NodeDetails {
  nodeIndex?: number;
  isMainNode?: boolean;
}

export interface ArrayPropertiesDetail {
  statusSummary?: Record<string, number>;
  statusSummaryLastUpdatedAt?: number;
  size?: number;
  index?: number;
}

export interface JobSummary {
  jobArn?: string;
  jobId?: string;
  jobName?: string;
  capacityUsage?: JobCapacityUsageSummary[];
  createdAt?: number;
  scheduledAt?: number;
  shareIdentifier?: string;
  status?: JobStatus;
  statusReason?: string;
  startedAt?: number;
  stoppedAt?: number;
  container?: ContainerSummary;
  arrayProperties?: ArrayPropertiesSummary;
  nodeProperties?: NodePropertiesSummary;
  jobDefinition?: string;
}

export interface ArrayPropertiesSummary {
  size?: number;
  index?: number;
  statusSummary?: Record<string, number>;
  statusSummaryLastUpdatedAt?: number;
}

export interface NodePropertiesSummary {
  isMainNode?: boolean;
  numNodes?: number;
  nodeIndex?: number;
}

export interface ContainerSummary {
  exitCode?: number;
  reason?: string;
  containerInstanceArn?: string;
  taskArn?: string;
  logStreamName?: string;
  networkInterfaces?: NetworkInterface[];
  instanceType?: string;
  vcpus?: number;
  memory?: number;
  resourceRequirements?: ResourceRequirement[];
}

export interface JobCapacityUsageSummary {
  resourceType?: string;
  quantity?: number;
}

// Supporting types
export interface KeyValuePair {
  name?: string;
  value?: string;
}

export interface Volume {
  host?: HostVolumeProperties;
  name?: string;
  efsVolumeConfiguration?: EFSVolumeConfiguration;
}

export interface HostVolumeProperties {
  sourcePath?: string;
}

export interface EFSVolumeConfiguration {
  fileSystemId?: string;
  rootDirectory?: string;
  transitEncryption?: "ENABLED" | "DISABLED";
  transitEncryptionPort?: number;
  authorizationConfig?: EFSAuthorizationConfig;
}

export interface EFSAuthorizationConfig {
  accessPointId?: string;
  iam?: "ENABLED" | "DISABLED";
}

export interface MountPoint {
  sourceVolume?: string;
  containerPath?: string;
  readOnly?: boolean;
}

export interface Ulimit {
  hardLimit?: number;
  name?: string;
  softLimit?: number;
}

export interface ResourceRequirement {
  value?: string;
  type?: "GPU" | "VCPU" | "MEMORY";
}

export interface LinuxParameters {
  devices?: Device[];
  initProcessEnabled?: boolean;
  sharedMemorySize?: number;
  tmpfs?: Tmpfs[];
  maxSwap?: number;
  swappiness?: number;
}

export interface Device {
  hostPath?: string;
  containerPath?: string;
  permissions?: ("READ" | "WRITE" | "MKNOD")[];
}

export interface Tmpfs {
  containerPath?: string;
  size?: number;
  mountOptions?: string[];
}

export interface LogConfiguration {
  logDriver?:
    | "awslogs"
    | "awsfirelens"
    | "fluentd"
    | "gelf"
    | "journald"
    | "json-file"
    | "splunk"
    | "syslog";
  options?: Record<string, string>;
  secretOptions?: Secret[];
}

export interface Secret {
  name?: string;
  valueFrom?: string;
}

export interface NetworkConfiguration {
  assignPublicIp?: "ENABLED" | "DISABLED";
}

export interface FargatePlatformConfiguration {
  platformVersion?: string;
}

export interface EphemeralStorage {
  sizeInGiB?: number;
}

export interface VolumeFrom {
  sourceContainer?: string;
  readOnly?: boolean;
}

export interface PortMapping {
  containerPort?: number;
  hostPort?: number;
  protocol?: "tcp" | "udp";
}

export interface NetworkInterface {
  attachmentId?: string;
  ipv6Address?: string;
  privateIpv4Address?: string;
}

export interface EksPropertiesDetail {
  podProperties?: PodPropertiesDetail;
}

export interface PodPropertiesDetail {
  serviceAccountName?: string;
  hostNetwork?: boolean;
  dnsPolicy?: string;
  containers?: EksContainerDetail[];
  initContainers?: EksContainerDetail[];
  volumes?: EksVolumeDetail[];
  metadata?: Metadata;
}

export interface EksContainerDetail {
  name?: string;
  image?: string;
  command?: string[];
  args?: string[];
  env?: KeyValuePair[];
  resources?: ResourceRequirements;
  volumeMounts?: VolumeMount[];
  securityContext?: SecurityContext;
  imagePullPolicy?: string;
}

export interface EksVolumeDetail {
  name?: string;
  hostPath?: HostPath;
  emptyDir?: EmptyDir;
  secret?: SecretVolume;
  configMap?: ConfigMapVolume;
  persistentVolumeClaim?: PersistentVolumeClaimVolume;
}

export interface ConfigMapVolume {
  name?: string;
  optional?: boolean;
}

export interface PersistentVolumeClaimVolume {
  claimName?: string;
  readOnly?: boolean;
}

// API Request/Response types
export interface DescribeComputeEnvironmentsResponse {
  computeEnvironments?: ComputeEnvironmentDetail[];
  nextToken?: string;
}

export interface DescribeJobQueuesResponse {
  jobQueues?: JobQueueDetail[];
  nextToken?: string;
}

export interface DescribeJobDefinitionsResponse {
  jobDefinitions?: JobDefinition[];
  nextToken?: string;
}

export interface DescribeJobsResponse {
  jobs?: JobDetail[];
}

export interface ListJobsResponse {
  jobSummaryList?: JobSummary[];
  nextToken?: string;
}

export interface CreateComputeEnvironmentRequest {
  computeEnvironmentName: string;
  type?: CEType;
  state?: CEState;
  computeResources?: ComputeResource;
  serviceRole?: string;
  tags?: Record<string, string>;
  unmanagedvCpus?: number;
  eksConfiguration?: EksConfiguration;
  containerOrchestrationType?: OrchestrationType;
}

export interface CreateJobQueueRequest {
  jobQueueName: string;
  state?: JQState;
  schedulingPolicyArn?: string;
  priority: number;
  computeEnvironmentOrder?: ComputeEnvironmentOrder[];
  serviceEnvironmentOrder?: ServiceEnvironmentOrder[];
  jobQueueType?: JQType;
  tags?: Record<string, string>;
  jobStateTimeLimitActions?: JobStateTimeLimitAction[];
}

export interface RegisterJobDefinitionRequest {
  jobDefinitionName: string;
  type: JobDefinitionType;
  parameters?: Record<string, string>;
  schedulingPriority?: number;
  retryStrategy?: RetryStrategy;
  containerProperties?: ContainerProperties;
  timeout?: JobTimeout;
  nodeProperties?: NodeProperties;
  tags?: Record<string, string>;
  propagateTags?: boolean;
  platformCapabilities?: PlatformCapability[];
  ecsProperties?: EcsProperties;
  eksProperties?: EksProperties;
  containerOrchestrationType?: OrchestrationType;
  consumableResourceProperties?: ConsumableResourceProperties;
}

export interface SubmitJobRequest {
  jobName: string;
  jobQueue: string;
  jobDefinition: string;
  arrayProperties?: { size: number };
  dependsOn?: JobDependency[];
  parameters?: Record<string, string>;
  containerOverrides?: ContainerOverrides;
  nodeOverrides?: NodeOverrides;
  retryStrategy?: RetryStrategy;
  propagateTags?: boolean;
  timeout?: JobTimeout;
  tags?: Record<string, string>;
  schedulingPriorityOverride?: number;
  shareIdentifier?: string;
}

export interface ContainerOverrides {
  vcpus?: number;
  memory?: number;
  command?: string[];
  instanceType?: string;
  environment?: KeyValuePair[];
  resourceRequirements?: ResourceRequirement[];
}

export interface NodeOverrides {
  nodePropertyOverrides?: NodePropertyOverride[];
  numNodes?: number;
}

export interface NodePropertyOverride {
  targetNodes?: string;
  containerOverrides?: ContainerOverrides;
  ec2Configuration?: Ec2Configuration[];
}

export interface TerminateJobRequest {
  jobId: string;
  reason: string;
}

export interface CancelJobRequest {
  jobId: string;
  reason: string;
}

export interface DeregisterJobDefinitionRequest {
  jobDefinition: string;
}

export interface ListTagsForResourceRequest {
  resourceArn: string;
}

export interface TagResourceRequest {
  resourceArn: string;
  tags: Record<string, string>;
}

export interface UntagResourceRequest {
  resourceArn: string;
  tagKeys: string[];
}

export interface UpdateComputeEnvironmentRequest {
  computeEnvironment: string;
  state?: CEState;
  computeResources?: ComputeResource;
  serviceRole?: string;
  unmanagedvCpus?: number;
}

export interface UpdateJobQueueRequest {
  jobQueue: string;
  state?: JQState;
  schedulingPolicyArn?: string;
  priority?: number;
  computeEnvironmentOrder?: ComputeEnvironmentOrder[];
  serviceEnvironmentOrder?: ServiceEnvironmentOrder[];
}

export interface BatchApiResponse {
  success?: boolean;
  error?: string;
  computeEnvironments?: ComputeEnvironmentDetail[];
  computeEnvironment?: ComputeEnvironmentDetail;
  jobQueues?: JobQueueDetail[];
  jobQueue?: JobQueueDetail;
  jobDefinitions?: JobDefinition[];
  jobDefinition?: JobDefinition;
  jobs?: JobDetail[];
  job?: JobDetail;
  jobSummaryList?: JobSummary[];
  jobId?: string;
  jobArn?: string;
  computeEnvironmentArn?: string;
  jobDefinitionArn?: string;
  jobQueueName?: string;
  jobQueueArn?: string;
  revision?: number;
  tags?: Record<string, string>;
  nextToken?: string;
  message?: string;
  [key: string]: unknown;
}
