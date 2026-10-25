"use client";

import ButtonDropdown from "@cloudscape-design/components/button-dropdown";
import FormField from "@cloudscape-design/components/form-field";
import SpaceBetween from "@cloudscape-design/components/space-between";
import JsonEditor from "@/components/JsonEditor";

interface PolicyTemplate {
  id: string;
  label: string;
  document: object;
}

const POLICY_TEMPLATES: PolicyTemplate[] = [
  {
    id: "readonly-s3",
    label: "S3 Read Only",
    document: {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: ["s3:GetObject", "s3:ListBucket", "s3:GetBucketLocation"],
          Resource: "*",
        },
      ],
    },
  },
  {
    id: "admin",
    label: "Administrator Access",
    document: {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: "*",
          Resource: "*",
        },
      ],
    },
  },
  {
    id: "lambda-exec",
    label: "Lambda Execution Role",
    document: {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents",
            "xray:PutTraceSegments",
            "xray:PutTelemetryRecords",
          ],
          Resource: "*",
        },
      ],
    },
  },
  {
    id: "blank",
    label: "Blank policy",
    document: {
      Version: "2012-10-17",
      Statement: [],
    },
  },
];

interface IamPolicyEditorProps {
  label?: string;
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
}

export default function IamPolicyEditor({
  label = "Policy document",
  value,
  onChange = () => undefined,
  readOnly = false,
}: IamPolicyEditorProps) {
  const handleTemplateSelect = (templateId: string) => {
    const template = POLICY_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      onChange(JSON.stringify(template.document, null, 2));
    }
  };

  return (
    <SpaceBetween size="s">
      {!readOnly ? (
        <FormField label="Load a template (optional)">
          <ButtonDropdown
            items={POLICY_TEMPLATES.map((t) => ({ id: t.id, text: t.label }))}
            onItemClick={(e) => handleTemplateSelect(e.detail.id)}
          >
            Choose a policy template
          </ButtonDropdown>
        </FormField>
      ) : null}
      <JsonEditor label={label} value={value} onChange={onChange} readOnly={readOnly} />
    </SpaceBetween>
  );
}
