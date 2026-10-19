/**
 * Config Types
 */
export interface ConfigRuleConfig {
  ConfigRuleName?: string;
  Source?: { SourceIdentifier?: string; Owner?: "AWS" | "CUSTOM_LAMBDA" };
  InputParameters?: string;
}
