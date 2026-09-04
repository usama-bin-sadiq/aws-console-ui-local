/**
 * CloudFormation Types
 */
export interface CloudFormationStackConfig {
  StackName?: string;
  TemplateBody?: string;
  Capabilities?: string[];
  Tags?: Array<{ Key?: string; Value?: string }>;
}
