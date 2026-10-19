/**
 * CloudFront Types
 */
export interface CloudFrontDistributionConfig {
  Origins?: Array<{ Id?: string; DomainName?: string; OriginPath?: string }>;
  DefaultCacheBehavior?: {
    TargetOriginId?: string;
    ViewerProtocolPolicy?: "redirect-to-https" | "https-only" | "allow-all";
  };
  Enabled?: boolean;
  Tags?: Array<{ Key?: string; Value?: string }>;
}
