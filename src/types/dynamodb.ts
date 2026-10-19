/**
 * DynamoDB Types
 */

export interface DynamoDBTableConfig {
  TableName?: string;
  KeySchema?: Array<{ AttributeName?: string; KeyType?: "HASH" | "RANGE" }>;
  AttributeDefinitions?: Array<{ AttributeName?: string; AttributeType?: "S" | "N" | "B" }>;
  BillingMode?: "PAY_PER_REQUEST" | "PROVISIONED";
  Tags?: Array<{ Key?: string; Value?: string }>;
}
