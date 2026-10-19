/**
 * AWS Regions — PRD Section 7.2 (Region Selector)
 * Complete list of AWS regions with service availability indicators.
 */
export interface AWSRegionItem {
  readonly label: string;
  readonly value: string;
  readonly geographicArea:
    | "north-america"
    | "south-america"
    | "europe"
    | "asia-pacific"
    | "middle-east"
    | "africa"
    | "china";
  readonly status: "available" | "limited" | "new";
}

export const AWS_REGIONS: readonly AWSRegionItem[] = [
  // North America
  {
    label: "US East (N. Virginia)",
    value: "us-east-1",
    geographicArea: "north-america",
    status: "available",
  },
  {
    label: "US East (Ohio)",
    value: "us-east-2",
    geographicArea: "north-america",
    status: "available",
  },
  {
    label: "US West (N. California)",
    value: "us-west-1",
    geographicArea: "north-america",
    status: "available",
  },
  {
    label: "US West (Oregon)",
    value: "us-west-2",
    geographicArea: "north-america",
    status: "available",
  },
  {
    label: "Canada (Central)",
    value: "ca-central-1",
    geographicArea: "north-america",
    status: "available",
  },
  // South America
  {
    label: "South America (São Paulo)",
    value: "sa-east-1",
    geographicArea: "south-america",
    status: "available",
  },
  // Europe
  { label: "Europe (Ireland)", value: "eu-west-1", geographicArea: "europe", status: "available" },
  { label: "Europe (London)", value: "eu-west-2", geographicArea: "europe", status: "available" },
  {
    label: "Europe (Frankfurt)",
    value: "eu-central-1",
    geographicArea: "europe",
    status: "available",
  },
  { label: "Europe (Paris)", value: "eu-west-3", geographicArea: "europe", status: "available" },
  {
    label: "Europe (Stockholm)",
    value: "eu-north-1",
    geographicArea: "europe",
    status: "available",
  },
  { label: "Europe (Milan)", value: "eu-south-1", geographicArea: "europe", status: "available" },
  // Asia Pacific
  {
    label: "Asia Pacific (Singapore)",
    value: "ap-southeast-1",
    geographicArea: "asia-pacific",
    status: "available",
  },
  {
    label: "Asia Pacific (Tokyo)",
    value: "ap-northeast-1",
    geographicArea: "asia-pacific",
    status: "available",
  },
  {
    label: "Asia Pacific (Sydney)",
    value: "ap-southeast-2",
    geographicArea: "asia-pacific",
    status: "available",
  },
  {
    label: "Asia Pacific (Seoul)",
    value: "ap-northeast-2",
    geographicArea: "asia-pacific",
    status: "available",
  },
  {
    label: "Asia Pacific (Mumbai)",
    value: "ap-south-1",
    geographicArea: "asia-pacific",
    status: "available",
  },
  {
    label: "Asia Pacific (Osaka)",
    value: "ap-northeast-3",
    geographicArea: "asia-pacific",
    status: "available",
  },
  {
    label: "Asia Pacific (Hong Kong)",
    value: "ap-east-1",
    geographicArea: "asia-pacific",
    status: "available",
  },
  // Middle East
  {
    label: "Middle East (UAE)",
    value: "me-central-1",
    geographicArea: "middle-east",
    status: "new",
  },
  {
    label: "Middle East (Bahrain)",
    value: "me-south-1",
    geographicArea: "middle-east",
    status: "available",
  },
  // Africa
  {
    label: "Africa (Cape Town)",
    value: "af-south-1",
    geographicArea: "africa",
    status: "available",
  },
  // China
  { label: "China (Beijing)", value: "cn-north-1", geographicArea: "china", status: "limited" },
  { label: "China (Ningxia)", value: "cn-northwest-1", geographicArea: "china", status: "limited" },
] as const;

export type AWSRegionValue = (typeof AWS_REGIONS)[number]["value"];
