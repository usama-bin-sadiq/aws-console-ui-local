/**
 * AWS Service Icons mapping — uses official AWS Architecture Service icons from /public/icons/
 * Each service href maps to its SVG icon path (32px for sidebar, 48px for cards)
 */

export const SERVICE_ICONS: Record<string, { small: string; large: string; category: string }> = {
  // Compute
  "/ec2": {
    small: "/icons/Architecture-Service/Arch_Compute/32/Arch_Amazon-EC2_32.svg",
    large: "/icons/Architecture-Service/Arch_Compute/48/Arch_Amazon-EC2_48.svg",
    category: "Compute",
  },
  "/lambda": {
    small: "/icons/Architecture-Service/Arch_Compute/32/Arch_AWS-Lambda_32.svg",
    large: "/icons/Architecture-Service/Arch_Compute/48/Arch_AWS-Lambda_48.svg",
    category: "Compute",
  },
  "/ecs-cluster": {
    small:
      "/icons/Architecture-Service/Arch_Containers/32/Arch_Amazon-Elastic-Container-Service_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Containers/48/Arch_Amazon-Elastic-Container-Service_48.svg",
    category: "Compute",
  },
  "/ecs-service": {
    small:
      "/icons/Architecture-Service/Arch_Containers/32/Arch_Amazon-Elastic-Container-Service_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Containers/48/Arch_Amazon-Elastic-Container-Service_48.svg",
    category: "Compute",
  },
  "/eks-cluster": {
    small:
      "/icons/Architecture-Service/Arch_Containers/32/Arch_Amazon-Elastic-Kubernetes-Service_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Containers/48/Arch_Amazon-Elastic-Kubernetes-Service_48.svg",
    category: "Compute",
  },
  "/ecr-repo": {
    small:
      "/icons/Architecture-Service/Arch_Containers/32/Arch_Amazon-Elastic-Container-Registry_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Containers/48/Arch_Amazon-Elastic-Container-Registry_48.svg",
    category: "Compute",
  },
  "/auto-scaling": {
    small: "/icons/Architecture-Service/Arch_Compute/32/Arch_Amazon-EC2-Auto-Scaling_32.svg",
    large: "/icons/Architecture-Service/Arch_Compute/48/Arch_Amazon-EC2-Auto-Scaling_48.svg",
    category: "Compute",
  },
  "/launch-template": {
    small: "/icons/Architecture-Service/Arch_Compute/32/Arch_Amazon-EC2_32.svg",
    large: "/icons/Architecture-Service/Arch_Compute/48/Arch_Amazon-EC2_48.svg",
    category: "Compute",
  },
  "/ami": {
    small: "/icons/Architecture-Service/Arch_Compute/32/Arch_Amazon-EC2-Image-Builder_32.svg",
    large: "/icons/Architecture-Service/Arch_Compute/48/Arch_Amazon-EC2-Image-Builder_48.svg",
    category: "Compute",
  },
  "/batch-job": {
    small: "/icons/Architecture-Service/Arch_Compute/32/Arch_AWS-Batch_32.svg",
    large: "/icons/Architecture-Service/Arch_Compute/48/Arch_AWS-Batch_48.svg",
    category: "Compute",
  },
  "/fargate": {
    small: "/icons/Architecture-Service/Arch_Compute/32/Arch_AWS-Lambda_32.svg",
    large: "/icons/Architecture-Service/Arch_Compute/48/Arch_AWS-Lambda_48.svg",
    category: "Compute",
  },

  // Storage
  "/s3": {
    small: "/icons/Architecture-Service/Arch_Storage/32/Arch_Amazon-Simple-Storage-Service_32.svg",
    large: "/icons/Architecture-Service/Arch_Storage/48/Arch_Amazon-Simple-Storage-Service_48.svg",
    category: "Storage",
  },
  "/s3-tables": {
    small: "/icons/Architecture-Service/Arch_Storage/32/Arch_Amazon-Simple-Storage-Service_32.svg",
    large: "/icons/Architecture-Service/Arch_Storage/48/Arch_Amazon-Simple-Storage-Service_48.svg",
    category: "Storage",
  },
  "/s3-files": {
    small: "/icons/Architecture-Service/Arch_Storage/32/Arch_Amazon-Simple-Storage-Service_32.svg",
    large: "/icons/Architecture-Service/Arch_Storage/48/Arch_Amazon-Simple-Storage-Service_48.svg",
    category: "Storage",
  },
  "/volume": {
    small: "/icons/Architecture-Service/Arch_Storage/32/Arch_Amazon-Elastic-Block-Store_32.svg",
    large: "/icons/Architecture-Service/Arch_Storage/48/Arch_Amazon-Elastic-Block-Store_48.svg",
    category: "Storage",
  },
  "/snapshot": {
    small: "/icons/Architecture-Service/Arch_Storage/32/Arch_Amazon-Elastic-Block-Store_32.svg",
    large: "/icons/Architecture-Service/Arch_Storage/48/Arch_Amazon-Elastic-Block-Store_48.svg",
    category: "Storage",
  },
  "/efs": {
    small: "/icons/Architecture-Service/Arch_Storage/32/Arch_Amazon-EFS_32.svg",
    large: "/icons/Architecture-Service/Arch_Storage/48/Arch_Amazon-EFS_48.svg",
    category: "Storage",
  },
  "/backup": {
    small: "/icons/Architecture-Service/Arch_Storage/32/Arch_AWS-Backup_32.svg",
    large: "/icons/Architecture-Service/Arch_Storage/48/Arch_AWS-Backup_48.svg",
    category: "Storage",
  },

  // Database
  "/dynamodb": {
    small: "/icons/Architecture-Service/Arch_Databases/32/Arch_Amazon-DynamoDB_32.svg",
    large: "/icons/Architecture-Service/Arch_Databases/48/Arch_Amazon-DynamoDB_48.svg",
    category: "Database",
  },
  "/rds": {
    small: "/icons/Architecture-Service/Arch_Databases/32/Arch_Amazon-RDS_32.svg",
    large: "/icons/Architecture-Service/Arch_Databases/48/Arch_Amazon-RDS_48.svg",
    category: "Database",
  },
  "/rds-data": {
    small: "/icons/Architecture-Service/Arch_Databases/32/Arch_Amazon-RDS_32.svg",
    large: "/icons/Architecture-Service/Arch_Databases/48/Arch_Amazon-RDS_48.svg",
    category: "Database",
  },
  "/elasticache": {
    small: "/icons/Architecture-Service/Arch_Databases/32/Arch_Amazon-ElastiCache_32.svg",
    large: "/icons/Architecture-Service/Arch_Databases/48/Arch_Amazon-ElastiCache_48.svg",
    category: "Database",
  },
  "/dsql": {
    small: "/icons/Architecture-Service/Arch_Databases/32/Arch_Amazon-Aurora_32.svg",
    large: "/icons/Architecture-Service/Arch_Databases/48/Arch_Amazon-Aurora_48.svg",
    category: "Database",
  },
  "/redshift": {
    small: "/icons/Architecture-Service/Arch_Analytics/32/Arch_Amazon-Redshift_32.svg",
    large: "/icons/Architecture-Service/Arch_Analytics/48/Arch_Amazon-Redshift_48.svg",
    category: "Database",
  },

  // Networking
  "/vpc": {
    small:
      "/icons/Architecture-Service/Arch_Networking-Content-Delivery/32/Arch_Amazon-Virtual-Private-Cloud_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Networking-Content-Delivery/48/Arch_Amazon-Virtual-Private-Cloud_48.svg",
    category: "Networking",
  },
  "/subnet": {
    small:
      "/icons/Architecture-Service/Arch_Networking-Content-Delivery/32/Arch_Amazon-Virtual-Private-Cloud_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Networking-Content-Delivery/48/Arch_Amazon-Virtual-Private-Cloud_48.svg",
    category: "Networking",
  },
  "/security-group": {
    small:
      "/icons/Architecture-Service/Arch_Networking-Content-Delivery/32/Arch_Amazon-Virtual-Private-Cloud_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Networking-Content-Delivery/48/Arch_Amazon-Virtual-Private-Cloud_48.svg",
    category: "Networking",
  },
  "/route-table": {
    small:
      "/icons/Architecture-Service/Arch_Networking-Content-Delivery/32/Arch_Amazon-Virtual-Private-Cloud_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Networking-Content-Delivery/48/Arch_Amazon-Virtual-Private-Cloud_48.svg",
    category: "Networking",
  },
  "/internet-gateway": {
    small:
      "/icons/Architecture-Service/Arch_Networking-Content-Delivery/32/Arch_Amazon-Virtual-Private-Cloud_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Networking-Content-Delivery/48/Arch_Amazon-Virtual-Private-Cloud_48.svg",
    category: "Networking",
  },
  "/nat-gateway": {
    small:
      "/icons/Architecture-Service/Arch_Networking-Content-Delivery/32/Arch_Amazon-Virtual-Private-Cloud_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Networking-Content-Delivery/48/Arch_Amazon-Virtual-Private-Cloud_48.svg",
    category: "Networking",
  },
  "/network-acl": {
    small:
      "/icons/Architecture-Service/Arch_Networking-Content-Delivery/32/Arch_Amazon-Virtual-Private-Cloud_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Networking-Content-Delivery/48/Arch_Amazon-Virtual-Private-Cloud_48.svg",
    category: "Networking",
  },
  "/elastic-ip": {
    small:
      "/icons/Architecture-Service/Arch_Networking-Content-Delivery/32/Arch_Amazon-Virtual-Private-Cloud_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Networking-Content-Delivery/48/Arch_Amazon-Virtual-Private-Cloud_48.svg",
    category: "Networking",
  },
  "/ec2-vpc-endpoint": {
    small:
      "/icons/Architecture-Service/Arch_Networking-Content-Delivery/32/Arch_AWS-PrivateLink_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Networking-Content-Delivery/48/Arch_AWS-PrivateLink_48.svg",
    category: "Networking",
  },
  "/ec2-vpc-peering": {
    small:
      "/icons/Architecture-Service/Arch_Networking-Content-Delivery/32/Arch_Amazon-Virtual-Private-Cloud_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Networking-Content-Delivery/48/Arch_Amazon-Virtual-Private-Cloud_48.svg",
    category: "Networking",
  },
  "/transit-gateway": {
    small:
      "/icons/Architecture-Service/Arch_Networking-Content-Delivery/32/Arch_AWS-Transit-Gateway_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Networking-Content-Delivery/48/Arch_AWS-Transit-Gateway_48.svg",
    category: "Networking",
  },
  "/vpn": {
    small:
      "/icons/Architecture-Service/Arch_Networking-Content-Delivery/32/Arch_AWS-Site-to-Site-VPN_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Networking-Content-Delivery/48/Arch_AWS-Site-to-Site-VPN_48.svg",
    category: "Networking",
  },
  "/direct-connect": {
    small:
      "/icons/Architecture-Service/Arch_Networking-Content-Delivery/32/Arch_AWS-Direct-Connect_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Networking-Content-Delivery/48/Arch_AWS-Direct-Connect_48.svg",
    category: "Networking",
  },
  "/cloudfront": {
    small:
      "/icons/Architecture-Service/Arch_Networking-Content-Delivery/32/Arch_Amazon-CloudFront_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Networking-Content-Delivery/48/Arch_Amazon-CloudFront_48.svg",
    category: "Networking",
  },
  "/route53": {
    small:
      "/icons/Architecture-Service/Arch_Networking-Content-Delivery/32/Arch_Amazon-Route-53_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Networking-Content-Delivery/48/Arch_Amazon-Route-53_48.svg",
    category: "Networking",
  },
  "/ec2-health-check": {
    small:
      "/icons/Architecture-Service/Arch_Networking-Content-Delivery/32/Arch_Amazon-Route-53_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Networking-Content-Delivery/48/Arch_Amazon-Route-53_48.svg",
    category: "Networking",
  },
  "/global-accelerator": {
    small:
      "/icons/Architecture-Service/Arch_Networking-Content-Delivery/32/Arch_AWS-Global-Accelerator_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Networking-Content-Delivery/48/Arch_AWS-Global-Accelerator_48.svg",
    category: "Networking",
  },
  "/ec2-elastic-loading": {
    small:
      "/icons/Architecture-Service/Arch_Networking-Content-Delivery/32/Arch_Elastic-Load-Balancing_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Networking-Content-Delivery/48/Arch_Elastic-Load-Balancing_48.svg",
    category: "Networking",
  },

  // Security
  "/iam": {
    small:
      "/icons/Architecture-Service/Arch_Security-Identity/32/Arch_AWS-Identity-and-Access-Management_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Security-Identity/48/Arch_AWS-Identity-and-Access-Management_48.svg",
    category: "Security",
  },
  "/iam/policies": {
    small:
      "/icons/Architecture-Service/Arch_Security-Identity/32/Arch_AWS-Identity-and-Access-Management_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Security-Identity/48/Arch_AWS-Identity-and-Access-Management_48.svg",
    category: "Security",
  },
  "/iam-access-key": {
    small:
      "/icons/Architecture-Service/Arch_Security-Identity/32/Arch_AWS-Identity-and-Access-Management_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Security-Identity/48/Arch_AWS-Identity-and-Access-Management_48.svg",
    category: "Security",
  },
  "/iam-group": {
    small:
      "/icons/Architecture-Service/Arch_Security-Identity/32/Arch_AWS-Identity-and-Access-Management_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Security-Identity/48/Arch_AWS-Identity-and-Access-Management_48.svg",
    category: "Security",
  },
  "/iam-instance-profile": {
    small:
      "/icons/Architecture-Service/Arch_Security-Identity/32/Arch_AWS-Identity-and-Access-Management_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Security-Identity/48/Arch_AWS-Identity-and-Access-Management_48.svg",
    category: "Security",
  },
  "/iam-saml": {
    small:
      "/icons/Architecture-Service/Arch_Security-Identity/32/Arch_AWS-Identity-and-Access-Management_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Security-Identity/48/Arch_AWS-Identity-and-Access-Management_48.svg",
    category: "Security",
  },
  "/iam-openid-connect": {
    small:
      "/icons/Architecture-Service/Arch_Security-Identity/32/Arch_AWS-Identity-and-Access-Management_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Security-Identity/48/Arch_AWS-Identity-and-Access-Management_48.svg",
    category: "Security",
  },
  "/iam-password-policy": {
    small:
      "/icons/Architecture-Service/Arch_Security-Identity/32/Arch_AWS-Identity-and-Access-Management_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Security-Identity/48/Arch_AWS-Identity-and-Access-Management_48.svg",
    category: "Security",
  },
  "/iam-credential-report": {
    small:
      "/icons/Architecture-Service/Arch_Security-Identity/32/Arch_AWS-Identity-and-Access-Management_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Security-Identity/48/Arch_AWS-Identity-and-Access-Management_48.svg",
    category: "Security",
  },
  "/iam-virtual-mfa": {
    small:
      "/icons/Architecture-Service/Arch_Security-Identity/32/Arch_AWS-Identity-and-Access-Management_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Security-Identity/48/Arch_AWS-Identity-and-Access-Management_48.svg",
    category: "Security",
  },
  "/kms": {
    small:
      "/icons/Architecture-Service/Arch_Security-Identity/32/Arch_AWS-Key-Management-Service_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Security-Identity/48/Arch_AWS-Key-Management-Service_48.svg",
    category: "Security",
  },
  "/secrets-manager": {
    small: "/icons/Architecture-Service/Arch_Security-Identity/32/Arch_AWS-Secrets-Manager_32.svg",
    large: "/icons/Architecture-Service/Arch_Security-Identity/48/Arch_AWS-Secrets-Manager_48.svg",
    category: "Security",
  },
  "/acm": {
    small:
      "/icons/Architecture-Service/Arch_Security-Identity/32/Arch_AWS-Certificate-Manager_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Security-Identity/48/Arch_AWS-Certificate-Manager_48.svg",
    category: "Security",
  },
  "/waf": {
    small: "/icons/Architecture-Service/Arch_Security-Identity/32/Arch_AWS-WAF_32.svg",
    large: "/icons/Architecture-Service/Arch_Security-Identity/48/Arch_AWS-WAF_48.svg",
    category: "Security",
  },
  "/waf-classic": {
    small: "/icons/Architecture-Service/Arch_Security-Identity/32/Arch_AWS-WAF_32.svg",
    large: "/icons/Architecture-Service/Arch_Security-Identity/48/Arch_AWS-WAF_48.svg",
    category: "Security",
  },
  "/wafv2": {
    small: "/icons/Architecture-Service/Arch_Security-Identity/32/Arch_AWS-WAF_32.svg",
    large: "/icons/Architecture-Service/Arch_Security-Identity/48/Arch_AWS-WAF_48.svg",
    category: "Security",
  },
  "/shield": {
    small: "/icons/Architecture-Service/Arch_Security-Identity/32/Arch_AWS-Shield_32.svg",
    large: "/icons/Architecture-Service/Arch_Security-Identity/48/Arch_AWS-Shield_48.svg",
    category: "Security",
  },
  "/guardduty": {
    small: "/icons/Architecture-Service/Arch_Security-Identity/32/Arch_Amazon-GuardDuty_32.svg",
    large: "/icons/Architecture-Service/Arch_Security-Identity/48/Arch_Amazon-GuardDuty_48.svg",
    category: "Security",
  },
  "/security-hub": {
    small: "/icons/Architecture-Service/Arch_Security-Identity/32/Arch_AWS-Security-Hub_32.svg",
    large: "/icons/Architecture-Service/Arch_Security-Identity/48/Arch_AWS-Security-Hub_48.svg",
    category: "Security",
  },
  "/macie": {
    small: "/icons/Architecture-Service/Arch_Security-Identity/32/Arch_Amazon-Macie_32.svg",
    large: "/icons/Architecture-Service/Arch_Security-Identity/48/Arch_Amazon-Macie_48.svg",
    category: "Security",
  },
  "/inspector": {
    small: "/icons/Architecture-Service/Arch_Security-Identity/32/Arch_Amazon-Inspector_32.svg",
    large: "/icons/Architecture-Service/Arch_Security-Identity/48/Arch_Amazon-Inspector_48.svg",
    category: "Security",
  },
  "/detective": {
    small: "/icons/Architecture-Service/Arch_Security-Identity/32/Arch_Amazon-Detective_32.svg",
    large: "/icons/Architecture-Service/Arch_Security-Identity/48/Arch_Amazon-Detective_48.svg",
    category: "Security",
  },
  "/verified-access": {
    small:
      "/icons/Architecture-Service/Arch_Networking-Content-Delivery/32/Arch_AWS-Verified-Access_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Networking-Content-Delivery/48/Arch_AWS-Verified-Access_48.svg",
    category: "Security",
  },

  // Monitoring
  "/cloudwatch": {
    small: "/icons/Architecture-Service/Arch_Management-Tools/32/Arch_Amazon-CloudWatch_32.svg",
    large: "/icons/Architecture-Service/Arch_Management-Tools/48/Arch_Amazon-CloudWatch_48.svg",
    category: "Monitoring",
  },
  "/cloudwatch-logs": {
    small: "/icons/Architecture-Service/Arch_Management-Tools/32/Arch_Amazon-CloudWatch_32.svg",
    large: "/icons/Architecture-Service/Arch_Management-Tools/48/Arch_Amazon-CloudWatch_48.svg",
    category: "Monitoring",
  },
  "/x-ray": {
    small: "/icons/Architecture-Service/Arch_Developer-Tools/32/Arch_AWS-X-Ray_32.svg",
    large: "/icons/Architecture-Service/Arch_Developer-Tools/48/Arch_AWS-X-Ray_48.svg",
    category: "Monitoring",
  },
  "/imds": {
    small: "/icons/Architecture-Service/Arch_Compute/32/Arch_Amazon-EC2_32.svg",
    large: "/icons/Architecture-Service/Arch_Compute/48/Arch_Amazon-EC2_48.svg",
    category: "Monitoring",
  },

  // Management
  "/cloudformation": {
    small: "/icons/Architecture-Service/Arch_Management-Tools/32/Arch_AWS-CloudFormation_32.svg",
    large: "/icons/Architecture-Service/Arch_Management-Tools/48/Arch_AWS-CloudFormation_48.svg",
    category: "Management",
  },
  "/cloudtrail": {
    small: "/icons/Architecture-Service/Arch_Management-Tools/32/Arch_AWS-CloudTrail_32.svg",
    large: "/icons/Architecture-Service/Arch_Management-Tools/48/Arch_AWS-CloudTrail_48.svg",
    category: "Management",
  },
  "/config": {
    small: "/icons/Architecture-Service/Arch_Management-Tools/32/Arch_AWS-Config_32.svg",
    large: "/icons/Architecture-Service/Arch_Management-Tools/48/Arch_AWS-Config_48.svg",
    category: "Management",
  },
  "/systems-manager-parameter-store": {
    small: "/icons/Architecture-Service/Arch_Management-Tools/32/Arch_AWS-Systems-Manager_32.svg",
    large: "/icons/Architecture-Service/Arch_Management-Tools/48/Arch_AWS-Systems-Manager_48.svg",
    category: "Management",
  },
  "/organizations": {
    small: "/icons/Architecture-Service/Arch_Management-Tools/32/Arch_AWS-Organizations_32.svg",
    large: "/icons/Architecture-Service/Arch_Management-Tools/48/Arch_AWS-Organizations_48.svg",
    category: "Management",
  },
  "/resource-groups": {
    small: "/icons/Architecture-Service/Arch_Management-Tools/32/Arch_AWS-Config_32.svg",
    large: "/icons/Architecture-Service/Arch_Management-Tools/48/Arch_AWS-Config_48.svg",
    category: "Management",
  },
  "/resource-groups-tagging": {
    small: "/icons/Architecture-Service/Arch_Management-Tools/32/Arch_AWS-Config_32.svg",
    large: "/icons/Architecture-Service/Arch_Management-Tools/48/Arch_AWS-Config_48.svg",
    category: "Management",
  },
  "/cost-explorer": {
    small:
      "/icons/Architecture-Service/Arch_Cloud-Financial-Management/32/Arch_AWS-Cost-Explorer_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Cloud-Financial-Management/48/Arch_AWS-Cost-Explorer_48.svg",
    category: "Management",
  },
  // AWS no longer ships an "AWS Billing Dashboard" architecture service icon: it is
  // absent from the current official package (Icon-package_07312026) and from the
  // 07312025 release. Cost Explorer is the closest glyph the Billing console leads
  // with, so it stands in rather than leaving a blank placeholder behind.
  "/billing": {
    small:
      "/icons/Architecture-Service/Arch_Cloud-Financial-Management/32/Arch_AWS-Cost-Explorer_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Cloud-Financial-Management/48/Arch_AWS-Cost-Explorer_48.svg",
    category: "Management",
  },
  "/budget": {
    small: "/icons/Architecture-Service/Arch_Cloud-Financial-Management/32/Arch_AWS-Budgets_32.svg",
    large: "/icons/Architecture-Service/Arch_Cloud-Financial-Management/48/Arch_AWS-Budgets_48.svg",
    category: "Management",
  },
  "/support": {
    small: "/icons/Architecture-Service/Arch_Customer-Enablement/32/Arch_AWS-Support_32.svg",
    large: "/icons/Architecture-Service/Arch_Customer-Enablement/48/Arch_AWS-Support_48.svg",
    category: "Management",
  },
  "/cloudcontrol": {
    small: "/icons/Architecture-Service/Arch_Developer-Tools/32/Arch_AWS-Cloud-Control-API_32.svg",
    large: "/icons/Architecture-Service/Arch_Developer-Tools/48/Arch_AWS-Cloud-Control-API_48.svg",
    category: "Management",
  },
  "/appconfig": {
    small: "/icons/Architecture-Service/Arch_Management-Tools/32/Arch_AWS-AppConfig_32.svg",
    large: "/icons/Architecture-Service/Arch_Management-Tools/48/Arch_AWS-AppConfig_48.svg",
    category: "Management",
  },

  // Application Integration
  "/sqs": {
    small:
      "/icons/Architecture-Service/Arch_Application-Integration/32/Arch_Amazon-Simple-Queue-Service_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Application-Integration/48/Arch_Amazon-Simple-Queue-Service_48.svg",
    category: "Application Integration",
  },
  "/sns": {
    small:
      "/icons/Architecture-Service/Arch_Application-Integration/32/Arch_Amazon-Simple-Notification-Service_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Application-Integration/48/Arch_Amazon-Simple-Notification-Service_48.svg",
    category: "Application Integration",
  },
  "/sns-sms": {
    small:
      "/icons/Architecture-Service/Arch_Application-Integration/32/Arch_Amazon-Simple-Notification-Service_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Application-Integration/48/Arch_Amazon-Simple-Notification-Service_48.svg",
    category: "Application Integration",
  },
  "/step-functions": {
    small:
      "/icons/Architecture-Service/Arch_Application-Integration/32/Arch_AWS-Step-Functions_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Application-Integration/48/Arch_AWS-Step-Functions_48.svg",
    category: "Application Integration",
  },
  "/eventbridge-schema": {
    small:
      "/icons/Architecture-Service/Arch_Application-Integration/32/Arch_Amazon-EventBridge_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Application-Integration/48/Arch_Amazon-EventBridge_48.svg",
    category: "Application Integration",
  },
  "/eventbridge-pipe": {
    small:
      "/icons/Architecture-Service/Arch_Application-Integration/32/Arch_Amazon-EventBridge_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Application-Integration/48/Arch_Amazon-EventBridge_48.svg",
    category: "Application Integration",
  },
  "/eventbridge-scheduler": {
    small:
      "/icons/Architecture-Service/Arch_Application-Integration/32/Arch_Amazon-EventBridge_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Application-Integration/48/Arch_Amazon-EventBridge_48.svg",
    category: "Application Integration",
  },
  "/api": {
    small:
      "/icons/Architecture-Service/Arch_Networking-Content-Delivery/32/Arch_Amazon-API-Gateway_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Networking-Content-Delivery/48/Arch_Amazon-API-Gateway_48.svg",
    category: "Application Integration",
  },
  "/appsync": {
    small: "/icons/Architecture-Service/Arch_Application-Integration/32/Arch_AWS-AppSync_32.svg",
    large: "/icons/Architecture-Service/Arch_Application-Integration/48/Arch_AWS-AppSync_48.svg",
    category: "Application Integration",
  },
  "/app-mesh": {
    small:
      "/icons/Architecture-Service/Arch_Networking-Content-Delivery/32/Arch_AWS-App-Mesh_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Networking-Content-Delivery/48/Arch_AWS-App-Mesh_48.svg",
    category: "Application Integration",
  },
  "/servicediscovery": {
    small:
      "/icons/Architecture-Service/Arch_Networking-Content-Delivery/32/Arch_AWS-Cloud-Map_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Networking-Content-Delivery/48/Arch_AWS-Cloud-Map_48.svg",
    category: "Application Integration",
  },
  "/pipes": {
    small:
      "/icons/Architecture-Service/Arch_Application-Integration/32/Arch_Amazon-EventBridge_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Application-Integration/48/Arch_Amazon-EventBridge_48.svg",
    category: "Application Integration",
  },

  // Developer Tools
  "/codebuild": {
    small: "/icons/Architecture-Service/Arch_Developer-Tools/32/Arch_AWS-CodeBuild_32.svg",
    large: "/icons/Architecture-Service/Arch_Developer-Tools/48/Arch_AWS-CodeBuild_48.svg",
    category: "Developer Tools",
  },
  "/codepipeline": {
    small: "/icons/Architecture-Service/Arch_Developer-Tools/32/Arch_AWS-CodePipeline_32.svg",
    large: "/icons/Architecture-Service/Arch_Developer-Tools/48/Arch_AWS-CodePipeline_48.svg",
    category: "Developer Tools",
  },
  "/code-deploy": {
    small: "/icons/Architecture-Service/Arch_Developer-Tools/32/Arch_AWS-CodeDeploy_32.svg",
    large: "/icons/Architecture-Service/Arch_Developer-Tools/48/Arch_AWS-CodeDeploy_48.svg",
    category: "Developer Tools",
  },
  "/app-auto-scaling": {
    small:
      "/icons/Architecture-Service/Arch_Management-Tools/32/Arch_AWS-Application-Auto-Scaling_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Management-Tools/48/Arch_AWS-Application-Auto-Scaling_48.svg",
    category: "Developer Tools",
  },

  // Analytics
  "/athena": {
    small: "/icons/Architecture-Service/Arch_Analytics/32/Arch_Amazon-Athena_32.svg",
    large: "/icons/Architecture-Service/Arch_Analytics/48/Arch_Amazon-Athena_48.svg",
    category: "Analytics",
  },
  "/athena-workgroup": {
    small: "/icons/Architecture-Service/Arch_Analytics/32/Arch_Amazon-Athena_32.svg",
    large: "/icons/Architecture-Service/Arch_Analytics/48/Arch_Amazon-Athena_48.svg",
    category: "Analytics",
  },
  "/emr": {
    small: "/icons/Architecture-Service/Arch_Analytics/32/Arch_Amazon-EMR_32.svg",
    large: "/icons/Architecture-Service/Arch_Analytics/48/Arch_Amazon-EMR_48.svg",
    category: "Analytics",
  },
  "/glue-catalog": {
    small: "/icons/Architecture-Service/Arch_Analytics/32/Arch_AWS-Glue_32.svg",
    large: "/icons/Architecture-Service/Arch_Analytics/48/Arch_AWS-Glue_48.svg",
    category: "Analytics",
  },
  "/glue-job": {
    small: "/icons/Architecture-Service/Arch_Analytics/32/Arch_AWS-Glue_32.svg",
    large: "/icons/Architecture-Service/Arch_Analytics/48/Arch_AWS-Glue_48.svg",
    category: "Analytics",
  },
  "/kinesis": {
    small: "/icons/Architecture-Service/Arch_Analytics/32/Arch_Amazon-Kinesis_32.svg",
    large: "/icons/Architecture-Service/Arch_Analytics/48/Arch_Amazon-Kinesis_48.svg",
    category: "Analytics",
  },
  "/firehose": {
    small: "/icons/Architecture-Service/Arch_Analytics/32/Arch_Amazon-Data-Firehose_32.svg",
    large: "/icons/Architecture-Service/Arch_Analytics/48/Arch_Amazon-Data-Firehose_48.svg",
    category: "Analytics",
  },
  "/quicksight": {
    small: "/icons/Architecture-Service/Arch_Analytics/32/Arch_Amazon-QuickSight_32.svg",
    large: "/icons/Architecture-Service/Arch_Analytics/48/Arch_Amazon-QuickSight_48.svg",
    category: "Analytics",
  },
  "/opensearch": {
    small: "/icons/Architecture-Service/Arch_Analytics/32/Arch_Amazon-OpenSearch-Service_32.svg",
    large: "/icons/Architecture-Service/Arch_Analytics/48/Arch_Amazon-OpenSearch-Service_48.svg",
    category: "Analytics",
  },

  // Machine Learning
  "/sagemaker": {
    small:
      "/icons/Architecture-Service/Arch_Artificial-Intelligence/32/Arch_Amazon-SageMaker-AI_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Artificial-Intelligence/48/Arch_Amazon-SageMaker-AI_48.svg",
    category: "Machine Learning",
  },
  "/bedrock": {
    small: "/icons/Architecture-Service/Arch_Artificial-Intelligence/32/Arch_Amazon-Bedrock_32.svg",
    large: "/icons/Architecture-Service/Arch_Artificial-Intelligence/48/Arch_Amazon-Bedrock_48.svg",
    category: "Machine Learning",
  },
  "/bedrock-runtime": {
    small: "/icons/Architecture-Service/Arch_Artificial-Intelligence/32/Arch_Amazon-Bedrock_32.svg",
    large: "/icons/Architecture-Service/Arch_Artificial-Intelligence/48/Arch_Amazon-Bedrock_48.svg",
    category: "Machine Learning",
  },
  "/rekognition": {
    small:
      "/icons/Architecture-Service/Arch_Artificial-Intelligence/32/Arch_Amazon-Rekognition_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Artificial-Intelligence/48/Arch_Amazon-Rekognition_48.svg",
    category: "Machine Learning",
  },
  "/comprehend": {
    small:
      "/icons/Architecture-Service/Arch_Artificial-Intelligence/32/Arch_Amazon-Comprehend_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Artificial-Intelligence/48/Arch_Amazon-Comprehend_48.svg",
    category: "Machine Learning",
  },
  "/polly": {
    small: "/icons/Architecture-Service/Arch_Artificial-Intelligence/32/Arch_Amazon-Polly_32.svg",
    large: "/icons/Architecture-Service/Arch_Artificial-Intelligence/48/Arch_Amazon-Polly_48.svg",
    category: "Machine Learning",
  },
  "/lex": {
    small: "/icons/Architecture-Service/Arch_Artificial-Intelligence/32/Arch_Amazon-Lex_32.svg",
    large: "/icons/Architecture-Service/Arch_Artificial-Intelligence/48/Arch_Amazon-Lex_48.svg",
    category: "Machine Learning",
  },

  // Mobile & IoT
  "/amplify": {
    small: "/icons/Architecture-Service/Arch_Front-End-Web-Mobile/32/Arch_AWS-Amplify_32.svg",
    large: "/icons/Architecture-Service/Arch_Front-End-Web-Mobile/48/Arch_AWS-Amplify_48.svg",
    category: "Mobile",
  },
  "/iot-core": {
    small: "/icons/Architecture-Service/Arch_Internet-of-Things/32/Arch_AWS-IoT-Core_32.svg",
    large: "/icons/Architecture-Service/Arch_Internet-of-Things/48/Arch_AWS-IoT-Core_48.svg",
    category: "IoT",
  },
  "/iot-analytics": {
    small: "/icons/Architecture-Service/Arch_Internet-of-Things/32/Arch_AWS-IoT-Core_32.svg",
    large: "/icons/Architecture-Service/Arch_Internet-of-Things/48/Arch_AWS-IoT-Core_48.svg",
    category: "IoT",
  },
  "/device-farm": {
    small: "/icons/Architecture-Service/Arch_Front-End-Web-Mobile/32/Arch_AWS-Device-Farm_32.svg",
    large: "/icons/Architecture-Service/Arch_Front-End-Web-Mobile/48/Arch_AWS-Device-Farm_48.svg",
    category: "Mobile",
  },

  // Customer Engagement
  "/connect": {
    small: "/icons/Architecture-Service/Arch_Business-Applications/32/Arch_Amazon-Connect_32.svg",
    large: "/icons/Architecture-Service/Arch_Business-Applications/48/Arch_Amazon-Connect_48.svg",
    category: "Customer Engagement",
  },
  "/pinpoint": {
    small: "/icons/Architecture-Service/Arch_Business-Applications/32/Arch_Amazon-Pinpoint_32.svg",
    large: "/icons/Architecture-Service/Arch_Business-Applications/48/Arch_Amazon-Pinpoint_48.svg",
    category: "Customer Engagement",
  },
  "/ses": {
    small:
      "/icons/Architecture-Service/Arch_Business-Applications/32/Arch_Amazon-Simple-Email-Service_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Business-Applications/48/Arch_Amazon-Simple-Email-Service_48.svg",
    category: "Customer Engagement",
  },

  // Containers (aliases)
  "/ecs": {
    small:
      "/icons/Architecture-Service/Arch_Containers/32/Arch_Amazon-Elastic-Container-Service_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Containers/48/Arch_Amazon-Elastic-Container-Service_48.svg",
    category: "Containers",
  },
  "/eks": {
    small:
      "/icons/Architecture-Service/Arch_Containers/32/Arch_Amazon-Elastic-Kubernetes-Service_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Containers/48/Arch_Amazon-Elastic-Kubernetes-Service_48.svg",
    category: "Containers",
  },

  // Additional registered services not in navigation
  "/cognito": {
    small: "/icons/Architecture-Service/Arch_Security-Identity/32/Arch_Amazon-Cognito_32.svg",
    large: "/icons/Architecture-Service/Arch_Security-Identity/48/Arch_Amazon-Cognito_48.svg",
    category: "Security",
  },
  "/msk": {
    small:
      "/icons/Architecture-Service/Arch_Analytics/32/Arch_Amazon-Managed-Streaming-for-Apache-Kafka_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Analytics/48/Arch_Amazon-Managed-Streaming-for-Apache-Kafka_48.svg",
    category: "Analytics",
  },
  "/mediaconnect": {
    small:
      "/icons/Architecture-Service/Arch_Media-Services/32/Arch_AWS-Elemental-MediaConnect_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Media-Services/48/Arch_AWS-Elemental-MediaConnect_48.svg",
    category: "Media",
  },
  "/mwaa": {
    small:
      "/icons/Architecture-Service/Arch_Application-Integration/32/Arch_Amazon-Managed-Workflows-for-Apache-Airflow_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Application-Integration/48/Arch_Amazon-Managed-Workflows-for-Apache-Airflow_48.svg",
    category: "Application Integration",
  },
  "/transfer": {
    small:
      "/icons/Architecture-Service/Arch_Migration-Modernization/32/Arch_AWS-Transfer-Family_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Migration-Modernization/48/Arch_AWS-Transfer-Family_48.svg",
    category: "Migration",
  },
  "/sts": {
    small:
      "/icons/Architecture-Service/Arch_Security-Identity/32/Arch_AWS-Identity-and-Access-Management_32.svg",
    large:
      "/icons/Architecture-Service/Arch_Security-Identity/48/Arch_AWS-Identity-and-Access-Management_48.svg",
    category: "Security",
  },
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
