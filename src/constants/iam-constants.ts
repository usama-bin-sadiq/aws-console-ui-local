/**
 * IAM Constants
 */
export const IAM_DEFAULT_PATH = "/";
export const IAM_MAX_SESSION_DURATION = 3600;
export const IAM_DEFAULT_POLICY_VERSION = "2012-10-17";
export const IAM_POLICY_TEMPLATE_ADMIN = JSON.stringify(
  {
    Version: "2012-10-17",
    Statement: [{ Effect: "Allow", Action: "*", Resource: "*" }],
  },
  null,
  2,
);
export const IAM_POLICY_TEMPLATE_READONLY = JSON.stringify(
  {
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Action: ["s3:GetObject", "s3:ListBucket", "s3:GetBucketLocation"],
        Resource: "*",
      },
    ],
  },
  null,
  2,
);
