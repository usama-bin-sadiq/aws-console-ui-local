/**
 * AWS Service Icons mapping — uses official AWS Architecture Service icons from /public/icons/
 * Each service href maps to its SVG icon path (32px for sidebar, 48px for cards)
 */

export const SERVICE_ICONS: Record<string, { small: string; large: string; category: string }> = {
  // Compute
  "/ec2": { small: "/icons/Architecture-Service/Arch_Compute/32/Arch_Amazon-EC2_32.svg", large: "/icons/Architecture-Service/Arch_Compute/48/Arch_Amazon-EC2_48.svg", category: "Compute" },
  "/lambda": { small: "/icons/Architecture-Service/Arch_Compute/32/Arch_AWS-Lambda_32.svg", large: "/icons/Architecture-Service/Arch_Compute/48/Arch_AWS-Lambda_48.svg", category: "Compute" },
  "/ecs-cluster": { small: "/icons/Architecture-Service/Arch_Compute/32/Arch_Amazon-Elastic-Container-Service_32.svg", large: "/icons/Architecture-Service/Arch_Compute/48/Arch_Amazon-Elastic-Container-Service_48.svg", category: "Compute" },
  "/ecs-service": { small: "/icons/Architecture-Service/Arch_Compute/32/Arch_Amazon-Elastic-Container-Service_32.svg", large: "/icons/Architecture-Service/Arch_Compute/48/Arch_Amazon-Elastic-Container-Service_48.svg", category: "Compute" },
  "/eks-cluster": { small: "/icons/Architecture-Service/Arch_Compute/32/Arch_Amazon-Elastic-Kubernetes-Service_32.svg", large: "/icons/Architecture-Service/Arch_Compute/48/Arch_Amazon-Elastic-Kubernetes-Service_48.svg", category: "Compute" },
  "/ecr-repo": { small: "/icons/Architecture-Service/Arch_Compute/32/Arch_Amazon-Elastic-Container-Registry_32.svg", large: "/icons/Architecture-Service/Arch_Compute/48/Arch_Amazon-Elastic-Container-Registry_48.svg", category: "Compute" },
  "/auto-scaling": { small: "/icons/Architecture-Service/Arch_Compute/32/Arch_Amazon-EC2-Auto-Scaling_32.svg", large: "/icons/Architecture-Service/Arch_Compute/48/Arch_Amazon-EC2-Auto-Scaling_48.svg", category: "Compute" },
  "/launch-template": { small: "/icons/Architecture-Service/Arch_Compute/32/Arch_Amazon-EC2_32.svg", large: "/icons/Architecture-Service/Arch_Compute/48/Arch_Amazon-EC2_48.svg", category: "Compute" },
  "/ami": { small: "/icons/Architecture-Service/Arch_Compute/32/Arch_Amazon-EC2-Image-Builder_32.svg", large: "/icons/Architecture-Service/Arch_Compute/48/Arch_Amazon-EC2-Image-Builder_48.svg", category: "Compute" },
  "/batch-job": { small: "/icons/Architecture-Service/Arch_Compute/32/Arch_AWS-Batch_32.svg", large: "/icons/Architecture-Service/Arch_Compute/48/Arch_AWS-Batch_48.svg", category: "Compute" },
  "/fargate": { small: "/icons/Architecture-Service/Arch_Compute/32/Arch_AWS-Lambda_32.svg", large: "/icons/Architecture-Service/Arch_Compute/48/Arch_AWS-Lambda_48.svg", category: "Compute" },

  // Storage
  "/s3": { small: "/icons/Architecture-Service/Arch_Storage/32/Arch_Amazon-Simple-Storage-Service_32.svg", large: "/icons/Architecture-Service/Arch_Storage/48/Arch_Amazon-Simple-Storage-Service_48.svg", category: "Storage" },
  "/s3-tables": { small: "/icons/Architecture-Service/Arch_Storage/32/Arch_Amazon-Simple-Storage-Service_32.svg", large: "/icons/Architecture-Service/Arch_Storage/48/Arch_Amazon-Simple-Storage-Service_48.svg", category: "Storage" },
  "/volume": { small: "/icons/Architecture-Service/Arch_Storage/32/Arch_Amazon-Elastic-Block-Store_32.svg", large: "/icons/Architecture-Service/Arch_Storage/48/Arch_Amazon-Elastic-Block-Store_48.svg", category: "Storage" },
  "/snapshot": { small: "/icons/Architecture-Service/Arch_Storage/32/Arch_Amazon-Elastic-Block-Store_32.svg", large: "/icons/Architecture-Service/Arch_Storage/48/Arch_Amazon-Elastic-Block-Store_48.svg", category: "Storage" },
  "/efs": { small: "/icons/Architecture-Service/Arch_Storage/32/Arch_Amazon-Elastic-File-System_32.svg", large: "/icons/Architecture-Service/Arch_Storage/48/Arch_Amazon-Elastic-File-System_48.svg", category: "Storage" },
  "/backup": { small: "/icons/Architecture-Service/Arch_Storage/32/Arch_AWS-Backup_32.svg", large: "/icons/Architecture-Service/Arch_Storage/48/Arch_AWS-Backup_48.svg", category: "Storage" },

  // Database
  "/dynamodb": { small: "/icons/Architecture-Service/Arch_Databases/32/Arch_Amazon-DynamoDB_32.svg", large: "/icons/Architecture-Service/Arch_Databases/48/Arch_Amazon-DynamoDB_48.svg", category: "Database" },
  "/rds": { small: "/icons/Architecture-Service/Arch_Databases/32/Arch_Amazon-RDS_32.svg", large: "/icons/Architecture-Service/Arch_Databases/48/Arch_Amazon-RDS_48.svg", category: "Database" },
  "/rds-data": { small: "/icons/Architecture-Service/Arch_Databases/32/Arch_Amazon-RDS_32.svg", large: "/icons/Architecture-Service/Arch_Databases/48/Arch_Amazon-RDS_48.svg", category: "Database" },
  "/elasticache": { small: "/icons/Architecture-Service/Arch_Databases/32/Arch_Amazon-ElastiCache_32.svg", large: "/icons/Architecture-Service/Arch_Databases/48/Arch_Amazon-ElastiCache_48.svg", category: "Database" },

  // Networking
  "/vpc": { small: "/icons/Architecture-Service/Arch_Networking-Content-Delivery/32/Arch_Amazon-Virtual-Private-Cloud_32.svg", large: "/icons/Architecture-Service/Arch_Networking-Content-Delivery/48/Arch_Amazon-Virtual-Private-Cloud_48.svg", category: "Networking" },
  "/subnet": { small: "/icons/Architecture-Service/Arch_Networking-Content-Delivery/32/Arch_Amazon-Virtual-Private-Cloud_32.svg", large: "/icons/Architecture-Service/Arch_Networking-Content-Delivery/48/Arch_Amazon-Virtual-Private-Cloud_48.svg", category: "Networking" },
  "/security-group": { small: "/icons/Architecture-Service/Arch_Networking-Content-Delivery/32/Arch_Amazon-Virtual-Private-Cloud_32.svg", large: "/icons/Architecture-Service/Arch_Networking-Content-Delivery/48/Arch_Amazon-Virtual-Private-Cloud_48.svg", category: "Networking" },
  "/route-table": { small: "/icons/Architecture-Service/Arch_Networking-Content-Delivery/32/Arch_Amazon-Virtual-Private-Cloud_32.svg", large: "/icons/Architecture-Service/Arch_Networking-Content-Delivery/48/Arch_Amazon-Virtual-Private-Cloud_48.svg", category: "Networking" },
  "/internet-gateway": { small: "/icons/Architecture-Service/Arch_Networking-Content-Delivery/32/Arch_Amazon-Virtual-Private-Cloud_32.svg", large: "/icons/Architecture-Service/Arch_Networking-Content-Delivery/48/Arch_Amazon-Virtual-Private-Cloud_48.svg", category: "Networking" },
  "/nat-gateway": { small: "/icons/Architecture-Service/Arch_Networking-Content-Delivery/32/Arch_Amazon-Virtual-Private-Cloud_32.svg", large: "/icons/Architecture-Service/Arch_Networking-Content-Delivery/48/Arch_Amazon-Virtual-Private-Cloud_48.svg", category: "Networking" },
  "/network-acl": { small: "/icons/Architecture-Service/Arch_Networking-Content-Delivery/32/Arch_Amazon-Virtual-Private-Cloud_32.svg", large: "/icons/Architecture-Service/Arch_Networking-Content-Delivery/48/Arch_Amazon-Virtual-Private-Cloud_48.svg", category: "Networking" },
  "/elastic-ip": { small: "/icons/Architecture-Service/Arch_Networking-Content-Delivery/32/Arch_Amazon-Virtual-Private-Cloud_32.svg", large: "/icons/Architecture-Service/Arch_Networking-Content-Delivery/48/Arch_Amazon-Virtual-Private-Cloud_48.svg", category: "Networking" },
  "/cloudfront": { small: "/icons/Architecture-Service/Arch_Networking-Content-Delivery/32/Arch_Amazon-CloudFront_32.svg", large: "/icons/Architecture-Service/Arch_Networking-Content-Delivery/48/Arch_Amazon-CloudFront_48.svg", category: "Networking" },
  "/route53": { small: "/icons/Architecture-Service/Arch_Networking-Content-Delivery/32/Arch_Amazon-Route-53_32.svg", large: "/icons/Architecture-Service/Arch_Networking-Content-Delivery/48/Arch_Amazon-Route-53_48.svg", category: "Networking" },

  // Security
  "/iam": { small: "/icons/Architecture-Service/Arch_Security-Identity/32/Arch_AWS-Identity-and-Access-Management_32.svg", large: "/icons/Architecture-Service/Arch_Security-Identity/48/Arch_AWS-Identity-and-Access-Management_48.svg", category: "Security" },
  "/kms": { small: "/icons/Architecture-Service/Arch_Security-Identity/32/Arch_AWS-Key-Management-Service_32.svg", large: "/icons/Architecture-Service/Arch_Security-Identity/48/Arch_AWS-Key-Management-Service_48.svg", category: "Security" },
  "/secrets-manager": { small: "/icons/Architecture-Service/Arch_Security-Identity/32/Arch_AWS-Secrets-Manager_32.svg", large: "/icons/Architecture-Service/Arch_Security-Identity/48/Arch_AWS-Secrets-Manager_48.svg", category: "Security" },
  "/acm": { small: "/icons/Architecture-Service/Arch_Security-Identity/32/Arch_AWS-Certificate-Manager_32.svg", large: "/icons/Architecture-Service/Arch_Security-Identity/48/Arch_AWS-Certificate-Manager_48.svg", category: "Security" },

  // Monitoring
  "/cloudwatch": { small: "/icons/Architecture-Service/Arch_Management-Tools/32/Arch_Amazon-CloudWatch_32.svg", large: "/icons/Architecture-Service/Arch_Management-Tools/48/Arch_Amazon-CloudWatch_48.svg", category: "Monitoring" },

  // Application Integration
  "/sqs": { small: "/icons/Architecture-Service/Arch_Application-Integration/32/Arch_Amazon-Simple-Queue-Service_32.svg", large: "/icons/Architecture-Service/Arch_Application-Integration/48/Arch_Amazon-Simple-Queue-Service_48.svg", category: "Application Integration" },
  "/sns": { small: "/icons/Architecture-Service/Arch_Application-Integration/32/Arch_Amazon-Simple-Notification-Service_32.svg", large: "/icons/Architecture-Service/Arch_Application-Integration/48/Arch_Amazon-Simple-Notification-Service_48.svg", category: "Application Integration" },
  "/step-functions": { small: "/icons/Architecture-Service/Arch_Application-Integration/32/Arch_AWS-Step-Functions_32.svg", large: "/icons/Architecture-Service/Arch_Application-Integration/48/Arch_AWS-Step-Functions_48.svg", category: "Application Integration" },
  "/eventbridge": { small: "/icons/Architecture-Service/Arch_Application-Integration/32/Arch_Amazon-EventBridge_32.svg", large: "/icons/Architecture-Service/Arch_Application-Integration/48/Arch_Amazon-EventBridge_48.svg", category: "Application Integration" },

  // ML/AI
  "/bedrock": { small: "/icons/Architecture-Service/Arch_Artificial-Intelligence/32/Arch_Amazon-Bedrock_32.svg", large: "/icons/Architecture-Service/Arch_Artificial-Intelligence/48/Arch_Amazon-Bedrock_48.svg", category: "Machine Learning" },
  "/bedrock-runtime": { small: "/icons/Architecture-Service/Arch_Artificial-Intelligence/32/Arch_Amazon-Bedrock_32.svg", large: "/icons/Architecture-Service/Arch_Artificial-Intelligence/48/Arch_Amazon-Bedrock_48.svg", category: "Machine Learning" },
  "/comprehend": { small: "/icons/Architecture-Service/Arch_Artificial-Intelligence/32/Arch_Amazon-Comprehend_32.svg", large: "/icons/Architecture-Service/Arch_Artificial-Intelligence/48/Arch_Amazon-Comprehend_48.svg", category: "Machine Learning" },
  "/polly": { small: "/icons/Architecture-Service/Arch_Artificial-Intelligence/32/Arch_Amazon-Polly_32.svg", large: "/icons/Architecture-Service/Arch_Artificial-Intelligence/48/Arch_Amazon-Polly_48.svg", category: "Machine Learning" },
  "/rekognition": { small: "/icons/Architecture-Service/Arch_Artificial-Intelligence/32/Arch_Amazon-Rekognition_32.svg", large: "/icons/Architecture-Service/Arch_Artificial-Intelligence/48/Arch_Amazon-Rekognition_48.svg", category: "Machine Learning" },
  "/lex": { small: "/icons/Architecture-Service/Arch_Artificial-Intelligence/32/Arch_Amazon-Lex_32.svg", large: "/icons/Architecture-Service/Arch_Artificial-Intelligence/48/Arch_Amazon-Lex_48.svg", category: "Machine Learning" },

  // Analytics
  "/athena": { small: "/icons/Architecture-Service/Arch_Analytics/32/Arch_Amazon-Athena_32.svg", large: "/icons/Architecture-Service/Arch_Analytics/48/Arch_Amazon-Athena_48.svg", category: "Analytics" },
  "/athena-workgroup": { small: "/icons/Architecture-Service/Arch_Analytics/32/Arch_Amazon-Athena_32.svg", large: "/icons/Architecture-Service/Arch_Analytics/48/Arch_Amazon-Athena_48.svg", category: "Analytics" },
  "/glue-job": { small: "/icons/Architecture-Service/Arch_Analytics/32/Arch_AWS-Glue_32.svg", large: "/icons/Architecture-Service/Arch_Analytics/48/Arch_AWS-Glue_48.svg", category: "Analytics" },
  "/glue-catalog": { small: "/icons/Architecture-Service/Arch_Analytics/32/Arch_AWS-Glue_32.svg", large: "/icons/Architecture-Service/Arch_Analytics/48/Arch_AWS-Glue_48.svg", category: "Analytics" },
  "/kinesis": { small: "/icons/Architecture-Service/Arch_Analytics/32/Arch_Amazon-Kinesis_32.svg", large: "/icons/Architecture-Service/Arch_Analytics/48/Arch_Amazon-Kinesis_48.svg", category: "Analytics" },
  "/firehose": { small: "/icons/Architecture-Service/Arch_Analytics/32/Arch_Amazon-Data-Firehose_32.svg", large: "/icons/Architecture-Service/Arch_Analytics/48/Arch_Amazon-Data-Firehose_48.svg", category: "Analytics" },
  "/opensearch": { small: "/icons/Architecture-Service/Arch_Analytics/32/Arch_OpenSearch_32.svg", large: "/icons/Architecture-Service/Arch_Analytics/48/Arch_OpenSearch_48.svg", category: "Analytics" },

  // Management
  "/cloudformation": { small: "/icons/Architecture-Service/Arch_Management-Tools/32/Arch_AWS-CloudFormation_32.svg", large: "/icons/Architecture-Service/Arch_Management-Tools/48/Arch_AWS-CloudFormation_48.svg", category: "Management" },
  "/cloudtrail": { small: "/icons/Architecture-Service/Arch_Management-Tools/32/Arch_AWS-CloudTrail_32.svg", large: "/icons/Architecture-Service/Arch_Management-Tools/48/Arch_AWS-CloudTrail_48.svg", category: "Management" },
  "/config": { small: "/icons/Architecture-Service/Arch_Management-Tools/32/Arch_AWS-Config_32.svg", large: "/icons/Architecture-Service/Arch_Management-Tools/48/Arch_AWS-Config_48.svg", category: "Management" },

  // Developer Tools
  "/code-deploy": { small: "/icons/Architecture-Service/Arch_Developer-Tools/32/Arch_AWS-CodeDeploy_32.svg", large: "/icons/Architecture-Service/Arch_Developer-Tools/48/Arch_AWS-CodeDeploy_48.svg", category: "Developer Tools" },
  "/codebuild": { small: "/icons/Architecture-Service/Arch_Developer-Tools/32/Arch_AWS-CodeBuild_32.svg", large: "/icons/Architecture-Service/Arch_Developer-Tools/48/Arch_AWS-CodeBuild_48.svg", category: "Developer Tools" },

  // Containers
  "/ecs": { small: "/icons/Architecture-Service/Arch_Compute/32/Arch_Amazon-Elastic-Container-Service_32.svg", large: "/icons/Architecture-Service/Arch_Compute/48/Arch_Amazon-Elastic-Container-Service_48.svg", category: "Containers" },
  "/eks": { small: "/icons/Architecture-Service/Arch_Compute/32/Arch_Amazon-Elastic-Kubernetes-Service_32.svg", large: "/icons/Architecture-Service/Arch_Compute/48/Arch_Amazon-Elastic-Kubernetes-Service_48.svg", category: "Containers" },
};

/**
 * Get the icon path for a service href
 */
export function getServiceIcon(href: string, size: "small" | "large" = "small"): string | null {
  const entry = SERVICE_ICONS[href];
  return entry ? entry[size] : null;
}

/**
 * Get the category for a service href
 */
export function getServiceCategory(href: string): string | null {
  const entry = SERVICE_ICONS[href];
  return entry ? entry.category : null;
}
