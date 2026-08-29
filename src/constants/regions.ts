export const AWS_REGIONS = [
  { label: "US East (N. Virginia)", value: "us-east-1" },
  { label: "US East (Ohio)", value: "us-east-2" },
  { label: "US West (N. California)", value: "us-west-1" },
  { label: "US West (Oregon)", value: "us-west-2" },
  { label: "Europe (Ireland)", value: "eu-west-1" },
  { label: "Europe (London)", value: "eu-west-2" },
  { label: "Europe (Frankfurt)", value: "eu-central-1" },
  { label: "Asia Pacific (Singapore)", value: "ap-southeast-1" },
  { label: "Asia Pacific (Tokyo)", value: "ap-northeast-1" },
] as const;

export type AWSRegion = typeof AWS_REGIONS[number]["value"];
