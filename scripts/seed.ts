import { S3Client, CreateBucketCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient, CreateTableCommand } from "@aws-sdk/client-dynamodb";

const endpoint = "http://localhost:4566";
const s3 = new S3Client({ endpoint, region: "us-east-1", credentials: { accessKeyId: "test", secretAccessKey: "test" }, forcePathStyle: true });
const ddb = new DynamoDBClient({ endpoint, region: "us-east-1", credentials: { accessKeyId: "test", secretAccessKey: "test" } });

async function seed() {
  await s3.send(new CreateBucketCommand({ Bucket: "demo-bucket" }));
  await ddb.send(new CreateTableCommand({
    TableName: "demo-table",
    KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
    BillingMode: "PAY_PER_REQUEST",
  }));
  console.log("Seed complete: demo-bucket, demo-table");
}
seed();
