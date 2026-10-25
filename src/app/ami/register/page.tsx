"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@cloudscape-design/components/header";
import Wizard from "@cloudscape-design/components/wizard";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";
import Button from "@cloudscape-design/components/button";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Select, { SelectProps } from "@cloudscape-design/components/select";
import RadioGroup, { RadioGroupProps } from "@cloudscape-design/components/radio-group";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import TruncatedText from "@/components/TruncatedText";
import {
  AmiPostBody,
  ARCHITECTURE_OPTIONS,
  ROOT_DEVICE_OPTIONS,
  VIRTUALIZATION_OPTIONS,
} from "@/types/ami";
import { amiPost } from "../ami-api";

// ─── Constants ───────────────────────────────────────────────────────────────

const ARCHITECTURE_SELECT_OPTIONS: SelectProps.Options = ARCHITECTURE_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}));

const VIRTUALIZATION_SELECT_OPTIONS: SelectProps.Options = VIRTUALIZATION_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}));

const ROOT_DEVICE_RADIO_OPTIONS: ReadonlyArray<RadioGroupProps.RadioButtonDefinition> =
  ROOT_DEVICE_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
    description:
      option.value === "ebs"
        ? "Root volume stored on EBS — persists until explicitly deleted."
        : "Root device backed by instance storage (ephemeral).",
  }));

interface FormErrors {
  name?: string;
  rootDeviceName?: string;
  s3?: string;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AMIRegisterPage() {
  const router = useRouter();

  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdImageId, setCreatedImageId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [s3Bucket, setS3Bucket] = useState("");
  const [s3Key, setS3Key] = useState("");
  const [architecture, setArchitecture] = useState<SelectProps.Option | null>(
    ARCHITECTURE_SELECT_OPTIONS[0] as SelectProps.Option | null,
  );
  const [rootDevice, setRootDevice] = useState<string>(ROOT_DEVICE_OPTIONS[0].value);
  const [rootDeviceName, setRootDeviceName] = useState("/dev/sda1");
  const [virtualization, setVirtualization] = useState<SelectProps.Option | null>(
    VIRTUALIZATION_SELECT_OPTIONS[0] as SelectProps.Option | null,
  );
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const hasS3Location = Boolean(s3Bucket.trim()) || Boolean(s3Key.trim());

  const validateForm = useCallback((): boolean => {
    const errors: FormErrors = {};
    if (!name.trim()) errors.name = "Image name is required";
    if (!rootDeviceName.trim()) errors.rootDeviceName = "Root device name is required";
    if (Boolean(s3Bucket.trim()) !== Boolean(s3Key.trim())) {
      errors.s3 = "Both S3 bucket and S3 key are required to register from S3";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [name, rootDeviceName, s3Bucket, s3Key]);

  const handleRegister = useCallback(async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    setError(null);
    try {
      const data = await amiPost({
        action: "registerImage",
        Name: name.trim(),
        Description: description.trim() || undefined,
        S3Bucket: s3Bucket.trim() || undefined,
        S3Key: s3Key.trim() || undefined,
        Architecture: architecture?.value as AmiPostBody["Architecture"],
        RootDeviceName: rootDeviceName.trim(),
        RootDeviceType: rootDevice as AmiPostBody["RootDeviceType"],
        VirtualizationType: virtualization?.value as AmiPostBody["VirtualizationType"],
      });
      if (!data.imageId) throw new Error("The emulator did not return an image ID");
      setCreatedImageId(data.imageId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to register image");
    } finally {
      setSubmitting(false);
    }
  }, [
    validateForm,
    name,
    description,
    s3Bucket,
    s3Key,
    architecture,
    rootDevice,
    rootDeviceName,
    virtualization,
  ]);

  // ── Success screen ───────────────────────────────────────────────────────

  if (createdImageId) {
    return (
      <Box padding="m">
        <SpaceBetween size="l">
          <Header variant="h1">Register image</Header>
          <Alert type="success" statusIconAriaLabel="Success">
            Image{" "}
            <Box variant="span" fontWeight="bold">
              {createdImageId}
            </Box>{" "}
            registered. It becomes available once its state is “available”.
          </Alert>
          <SpaceBetween direction="horizontal" size="xs">
            <Button
              variant="primary"
              formAction="none"
              onClick={() => router.push(`/ami/${createdImageId}`)}
            >
              View new image
            </Button>
            <Button formAction="none" onClick={() => router.push("/ami")}>
              Back to AMIs
            </Button>
          </SpaceBetween>
        </SpaceBetween>
      </Box>
    );
  }

  // ── Wizard steps ─────────────────────────────────────────────────────────

  const wizardSteps = [
    {
      title: "Configure image",
      description:
        "Provide the image name, an optional S3 manifest location, and boot characteristics.",
      content: (
        <SpaceBetween size="l">
          <FormField
            label="Name"
            constraintText="Required. The name of the image to register."
            errorText={formErrors.name}
          >
            <Input
              value={name}
              onChange={({ detail }) => {
                setName(detail.value);
                setFormErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder="my-registered-image"
              ariaLabel="Image name"
            />
          </FormField>

          <FormField label="Description" description="Optional. Stored with the image.">
            <Input
              value={description}
              onChange={({ detail }) => setDescription(detail.value)}
              ariaLabel="Image description"
            />
          </FormField>

          <Container header={<Header variant="h3">S3 manifest (optional)</Header>}>
            <SpaceBetween size="m">
              <Box variant="small" color="text-body-secondary">
                Register from an AMI manifest stored in S3. When an S3 location is provided, the
                manifest defines architecture, root device, and virtualization — those settings
                below are not sent.
              </Box>
              <ColumnLayout columns={2} variant="default">
                <FormField
                  label="S3 bucket"
                  constraintText="Bucket containing the AMI manifest."
                  errorText={formErrors.s3}
                >
                  <Input
                    value={s3Bucket}
                    onChange={({ detail }) => {
                      setS3Bucket(detail.value);
                      setFormErrors((prev) => ({ ...prev, s3: undefined }));
                    }}
                    placeholder="my-ami-bucket"
                    ariaLabel="S3 bucket"
                  />
                </FormField>
                <FormField
                  label="S3 key"
                  constraintText="Object key of the manifest, e.g. images/my-image.manifest.xml."
                  errorText={formErrors.s3}
                >
                  <Input
                    value={s3Key}
                    onChange={({ detail }) => {
                      setS3Key(detail.value);
                      setFormErrors((prev) => ({ ...prev, s3: undefined }));
                    }}
                    placeholder="images/my-image.manifest.xml"
                    ariaLabel="S3 key"
                  />
                </FormField>
              </ColumnLayout>
            </SpaceBetween>
          </Container>

          <FormField label="Architecture" description="Processor architecture of the image.">
            <Select
              selectedOption={architecture}
              onChange={({ detail }) =>
                setArchitecture(detail.selectedOption as SelectProps.Option | null)
              }
              options={ARCHITECTURE_SELECT_OPTIONS}
              ariaLabel="Architecture"
            />
          </FormField>

          <Box variant="strong">Root device</Box>
          <RadioGroup
            value={rootDevice}
            onChange={({ detail }) => setRootDevice(detail.value)}
            items={ROOT_DEVICE_RADIO_OPTIONS}
          />
          <FormField
            label="Root device name"
            constraintText="Required. Device name of the root volume, for example /dev/sda1."
            errorText={formErrors.rootDeviceName}
          >
            <Input
              value={rootDeviceName}
              onChange={({ detail }) => {
                setRootDeviceName(detail.value);
                setFormErrors((prev) => ({ ...prev, rootDeviceName: undefined }));
              }}
              ariaLabel="Root device name"
            />
          </FormField>

          <FormField
            label="Virtualization type"
            description="Hardware virtualization used to launch instances from this image."
          >
            <Select
              selectedOption={virtualization}
              onChange={({ detail }) =>
                setVirtualization(detail.selectedOption as SelectProps.Option | null)
              }
              options={VIRTUALIZATION_SELECT_OPTIONS}
              ariaLabel="Virtualization type"
            />
          </FormField>
        </SpaceBetween>
      ),
    },
    {
      title: "Review",
      description: "Review the image configuration before registering it.",
      content: (
        <Container header={<Header variant="h3">Review summary</Header>}>
          <SpaceBetween size="m">
            {hasS3Location && (
              <Alert type="info" statusIconAriaLabel="Information">
                This image is registered from an S3 manifest — the manifest defines architecture,
                root device, and virtualization instead of the values shown below.
              </Alert>
            )}
            <ColumnLayout columns={3} variant="default">
              <div>
                <Box variant="small" color="text-label">
                  Name
                </Box>
                <Box>{name.trim() || "—"}</Box>
              </div>
              <div>
                <Box variant="small" color="text-label">
                  Description
                </Box>
                <Box>
                  <TruncatedText>{description.trim() || "—"}</TruncatedText>
                </Box>
              </div>
              <div>
                <Box variant="small" color="text-label">
                  S3 location
                </Box>
                <Box>
                  <TruncatedText>
                    {hasS3Location ? `${s3Bucket.trim()}/${s3Key.trim()}` : "—"}
                  </TruncatedText>
                </Box>
              </div>
              <div>
                <Box variant="small" color="text-label">
                  Architecture
                </Box>
                <Box>{architecture?.value ?? "—"}</Box>
              </div>
              <div>
                <Box variant="small" color="text-label">
                  Root device
                </Box>
                <Box>
                  {ROOT_DEVICE_OPTIONS.find((option) => option.value === rootDevice)?.label ??
                    rootDevice}
                </Box>
              </div>
              <div>
                <Box variant="small" color="text-label">
                  Root device name
                </Box>
                <Box>{rootDeviceName.trim() || "—"}</Box>
              </div>
              <div>
                <Box variant="small" color="text-label">
                  Virtualization type
                </Box>
                <Box>{virtualization?.value ?? "—"}</Box>
              </div>
            </ColumnLayout>
          </SpaceBetween>
        </Container>
      ),
    },
  ];

  return (
    <Box padding="m">
      <SpaceBetween size="l">
        <Header
          variant="h2"
          actions={
            <Button formAction="none" onClick={() => router.push("/ami")}>
              Back to AMIs
            </Button>
          }
        >
          Register image
        </Header>

        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Container>
          <Wizard
            steps={wizardSteps}
            activeStepIndex={stepIndex}
            onNavigate={({ detail }) => {
              if (detail.requestedStepIndex > stepIndex && !validateForm()) return;
              setStepIndex(detail.requestedStepIndex);
            }}
            onCancel={() => router.push("/ami")}
            onSubmit={() => void handleRegister()}
            submitButtonText={submitting ? "Registering…" : "Register image"}
            i18nStrings={{
              stepNumberLabel: (stepNumber: number) => `Step ${stepNumber}`,
              navigationAriaLabel: "Register image wizard navigation",
              nextButton: "Next",
              previousButton: "Previous",
              cancelButton: "Cancel",
            }}
          />
        </Container>
      </SpaceBetween>
    </Box>
  );
}
