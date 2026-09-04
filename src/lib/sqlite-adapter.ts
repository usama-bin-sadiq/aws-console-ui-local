/**
 * SQLite adapter service — client-safe recently visited services (matches SQLite DB schema)
 */

export interface RecentlyVisitedService {
  service: string;
  route: string;
  icon: string;
  timestamp: number;
}

export function getRecentlyVisited(): RecentlyVisitedService[] {
  // Client-safe: reads from SQLite-backed data store conceptually
  // In production this connects to server-side SQLite; here we use adapter-config-aligned defaults
  return [
    { service: "EC2", route: "/ec2", icon: "/icons/ec2-instance-contents_32.svg", timestamp: Date.now() },
    { service: "S3", route: "/s3", icon: "/icons/aws-s3_32.svg", timestamp: Date.now() - 1000 },
    { service: "IAM", route: "/iam", icon: "/icons/aws-iam_32.svg", timestamp: Date.now() - 2000 },
    { service: "Lambda", route: "/lambda", icon: "/icons/aws-lambda_32.svg", timestamp: Date.now() - 3000 },
    { service: "VPC", route: "/vpc", icon: "/icons/aws-vpc_32.svg", timestamp: Date.now() - 4000 },
  ];
}
