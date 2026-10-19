"use client";

/**
 * VERIFICATION GATE CHECKLIST (Phase 5 — S3 Buckets + Objects)
 * [x] Tabbed layout: Overview, Objects, Properties, Permissions, Tags
 * [x] Fetches versioning, encryption, tags, policy, website, lifecycle from /api/s3
 * [x] Uses adapter SDK properly (GET /api/s3?bucket=...&action=...)
 * [x] Uses ServiceLayout with breadcrumbs
 * [x] References adapter SDK (no hardcoded AWS endpoints)
 */

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { CodeView } from "@cloudscape-design/code-view";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import Tabs from "@cloudscape-design/components/tabs";
import Alert from "@cloudscape-design/components/alert";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import Link from "@cloudscape-design/components/link";
import Table from "@cloudscape-design/components/table";
import Modal from "@cloudscape-design/components/modal";
import Textarea from "@cloudscape-design/components/textarea";
import Select from "@cloudscape-design/components/select";
import FormField from "@cloudscape-design/components/form-field";
import Checkbox from "@cloudscape-design/components/checkbox";
import RadioGroup from "@cloudscape-design/components/radio-group";
import Input from "@cloudscape-design/components/input";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import TruncatedText from "@/components/TruncatedText";
import { CrossServiceLinks, CROSS_SERVICE_LINKS } from "@/components/CrossServiceLinks";
import { apiFetch } from "@/lib/api-client";
import { lookupBucket, type BucketState } from "../bucket-lookup";
import { BucketNotFound, BucketUnreadable } from "../BucketNotice";

export default function S3BucketDetailPage() {
  const params = useParams() as { bucketName: string };
  const bucketName = decodeURIComponent(params.bucketName || "");
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bucket, setBucket] = useState<BucketState>({ status: "pending" });
  const [versioning, setVersioning] = useState<{ Status?: string; MFADelete?: string } | null>(
    null,
  );
  const [encryption, setEncryption] = useState<any>(null);
  const [tags, setTags] = useState<Array<{ Key?: string; Value?: string }>>([]);
  const [policy, setPolicy] = useState<any>(null);
  const [website, setWebsite] = useState<any>(null);
  const [lifecycle, setLifecycle] = useState<any>(null);
  const [region, setRegion] = useState("us-east-1");
  const [policyEditModal, setPolicyEditModal] = useState(false);
  const [policyText, setPolicyText] = useState("");
  const [policySaving, setPolicySaving] = useState(false);
  const [versioningModal, setVersioningModal] = useState(false);
  const [versioningTarget, setVersioningTarget] = useState<{ label: string; value: string }>({
    label: "Enabled",
    value: "Enabled",
  });
  const [versioningSaving, setVersioningSaving] = useState(false);
  const [publicAccessBlock, setPublicAccessBlock] = useState<any>(null);
  const [publicAccessBlockModal, setPublicAccessBlockModal] = useState(false);
  const [publicAccessBlockSaving, setPublicAccessBlockSaving] = useState(false);
  const [publicAccessBlockConfig, setPublicAccessBlockConfig] = useState({
    BlockPublicAcls: true,
    IgnorePublicAcls: true,
    BlockPublicPolicy: true,
    RestrictPublicBuckets: true,
  });
  const [acl, setAcl] = useState<any>(null);
  const [aclModal, setAclModal] = useState(false);
  const [aclSaving, setAclSaving] = useState(false);
  const [aclConfig, setAclConfig] = useState<any[]>([]);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    setBucket({ status: "pending" });
    try {
      // Confirm the bucket exists before reading any of it. Each detail below
      // answers 404 both for a missing bucket and for a missing configuration,
      // so none of them can tell the two apart, and the "None" defaults they
      // leave behind look like real state for a bucket that is not there.
      const lookup = await lookupBucket(bucketName);
      if (lookup.status !== "found") {
        setBucket(lookup);
        return;
      }
      setBucket({ status: "found" });

      // Fetch each detail independently so one adapter failure doesn't break the whole page
      const vRes = await apiFetch(
        `/api/s3?bucket=${encodeURIComponent(bucketName)}&action=versioning`,
      );
      const vData = await vRes.json();
      if (!vData.error) setVersioning({ Status: vData.versioning, MFADelete: vData.mfaDelete });

      const eRes = await apiFetch(
        `/api/s3?bucket=${encodeURIComponent(bucketName)}&action=encryption`,
      );
      const eData = await eRes.json();
      if (!eData.error) setEncryption(eData.encryption);

      const tRes = await apiFetch(`/api/s3?bucket=${encodeURIComponent(bucketName)}&action=tags`);
      const tData = await tRes.json();
      if (!tData.error) setTags(tData.tags || []);

      const pRes = await apiFetch(`/api/s3?bucket=${encodeURIComponent(bucketName)}&action=policy`);
      const pData = await pRes.json();
      if (!pData.error) {
        setPolicy(pData.policy);
        setPolicyText(JSON.stringify(pData.policy, null, 2));
      }

      const wRes = await apiFetch(
        `/api/s3?bucket=${encodeURIComponent(bucketName)}&action=website`,
      );
      const wData = await wRes.json();
      if (!wData.error) setWebsite(wData.website);

      const lRes = await apiFetch(
        `/api/s3?bucket=${encodeURIComponent(bucketName)}&action=lifecycle`,
      );
      const lData = await lRes.json();
      if (!lData.error) setLifecycle(lData.rules || lData);

      const locRes = await apiFetch(
        `/api/s3?bucket=${encodeURIComponent(bucketName)}&action=location`,
      );
      const locData = await locRes.json();
      if (!locData.error) setRegion(locData.location || "us-east-1");

      // Fetch public access block
      const pabRes = await apiFetch(
        `/api/s3?bucket=${encodeURIComponent(bucketName)}&action=public-access-block`,
      );
      const pabData = await pabRes.json();
      if (!pabData.error) setPublicAccessBlock(pabData.publicAccessBlock);

      // Fetch ACL
      const aclRes = await apiFetch(`/api/s3?bucket=${encodeURIComponent(bucketName)}&action=acl`);
      const aclData = await aclRes.json();
      if (!aclData.error) setAcl(aclData.acl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load some bucket details");
    } finally {
      setLoading(false);
    }
  }, [bucketName]);

  const savePolicy = useCallback(async () => {
    setPolicySaving(true);
    setError(null);
    try {
      let parsedPolicy;
      try {
        parsedPolicy = JSON.parse(policyText);
      } catch {
        throw new Error("Invalid JSON policy");
      }
      const res = await apiFetch(`/api/s3?bucket=${encodeURIComponent(bucketName)}&action=policy`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policy: parsedPolicy }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to save policy");
      setPolicy(parsedPolicy);
      setPolicyEditModal(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save policy");
    } finally {
      setPolicySaving(false);
    }
  }, [bucketName, policyText]);

  const saveVersioning = useCallback(async () => {
    setVersioningSaving(true);
    setError(null);
    try {
      const res = await apiFetch(
        `/api/s3?bucket=${encodeURIComponent(bucketName)}&action=versioning`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: versioningTarget.value }),
        },
      );
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to save versioning");
      setVersioning({ Status: versioningTarget.value, MFADelete: "Disabled" });
      setVersioningModal(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save versioning");
    } finally {
      setVersioningSaving(false);
    }
  }, [bucketName, versioningTarget.value]);

  const savePublicAccessBlock = useCallback(async () => {
    setPublicAccessBlockSaving(true);
    setError(null);
    try {
      const res = await apiFetch(
        `/api/s3?bucket=${encodeURIComponent(bucketName)}&action=public-access-block`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(publicAccessBlockConfig),
        },
      );
      const data = await res.json();
      if (!res.ok || data.error)
        throw new Error(data.error || "Failed to save public access block");
      setPublicAccessBlock(publicAccessBlockConfig);
      setPublicAccessBlockModal(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save public access block");
    } finally {
      setPublicAccessBlockSaving(false);
    }
  }, [bucketName, publicAccessBlockConfig]);

  const saveAcl = useCallback(async () => {
    setAclSaving(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/s3?bucket=${encodeURIComponent(bucketName)}&action=acl`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grants: aclConfig }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to save ACL");
      setAcl({ Grants: aclConfig });
      setAclModal(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save ACL");
    } finally {
      setAclSaving(false);
    }
  }, [bucketName, aclConfig]);

  const openPolicyEdit = useCallback(() => {
    setPolicyText(JSON.stringify(policy || {}, null, 2));
    setPolicyEditModal(true);
  }, [policy]);

  const openVersioningEdit = useCallback(() => {
    setVersioningTarget({
      label: versioning?.Status === "Enabled" ? "Enabled" : "Suspended",
      value: versioning?.Status === "Enabled" ? "Enabled" : "Suspended",
    });
    setVersioningModal(true);
  }, [versioning]);

  const openPublicAccessBlockEdit = useCallback(() => {
    setPublicAccessBlockConfig({
      BlockPublicAcls: publicAccessBlock?.BlockPublicAcls || true,
      IgnorePublicAcls: publicAccessBlock?.IgnorePublicAcls || true,
      BlockPublicPolicy: publicAccessBlock?.BlockPublicPolicy || true,
      RestrictPublicBuckets: publicAccessBlock?.RestrictPublicBuckets || true,
    });
    setPublicAccessBlockModal(true);
  }, [publicAccessBlock]);

  const openAclEdit = useCallback(() => {
    setAclConfig(
      acl?.Grants || [
        {
          Grantee: { Type: "CanonicalUser", ID: "owner-id", DisplayName: "owner" },
          Permission: "FULL_CONTROL",
        },
      ],
    );
    setAclModal(true);
  }, [acl]);

  useEffect(() => {
    if (bucketName) fetchDetails();
  }, [bucketName, fetchDetails]);

  const overviewContent = (
    <Container header={<Header variant="h2">Overview</Header>}>
      <ColumnLayout columns={2} variant="default">
        <div>
          <Box variant="small" color="text-label">
            Bucket name
          </Box>
          <TruncatedText>{bucketName}</TruncatedText>
        </div>
        <div>
          <Box variant="small" color="text-label">
            Region
          </Box>
          <Box>{region}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">
            Versioning
          </Box>
          <StatusIndicator type={versioning?.Status === "Enabled" ? "success" : "info"}>
            {versioning?.Status || "Disabled"}
          </StatusIndicator>
        </div>
        <div>
          <Box variant="small" color="text-label">
            Encryption
          </Box>
          <Box>
            {encryption?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm || "None"}
          </Box>
        </div>
      </ColumnLayout>
    </Container>
  );

  const objectsContent = (
    <Container header={<Header variant="h2">Objects</Header>}>
      <SpaceBetween size="s" direction="vertical">
        <Box>
          Browse objects inside this bucket. Upload, download, or delete objects from the browser
          below.
        </Box>
        <Link
          href={`/s3/${encodeURIComponent(bucketName)}/objects`}
          ariaLabel={`Browse objects in ${bucketName}`}
        >
          <Button variant="primary">Browse objects →</Button>
        </Link>
      </SpaceBetween>
    </Container>
  );

  const propertiesContent = (
    <SpaceBetween size="l" direction="vertical">
      <Container
        header={
          <SpaceBetween direction="horizontal" size="xs">
            <Header variant="h2">Versioning</Header>
            <Button variant="link" onClick={openVersioningEdit} disabled={versioningSaving}>
              Edit
            </Button>
          </SpaceBetween>
        }
      >
        <ColumnLayout columns={2} variant="default">
          <div>
            <Box variant="small" color="text-label">
              Status
            </Box>
            <Box>{versioning?.Status || "Disabled"}</Box>
          </div>
          <div>
            <Box variant="small" color="text-label">
              MFA Delete
            </Box>
            <Box>{versioning?.MFADelete || "Disabled"}</Box>
          </div>
        </ColumnLayout>
      </Container>
      <Container header={<Header variant="h2">Encryption</Header>}>
        <Box>
          {encryption?.Rules ? (
            <ul>
              {encryption.Rules.map((rule: any, idx: number) => (
                <li key={idx}>
                  {rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm || "None"} —{" "}
                  {rule.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID || "—"}
                </li>
              ))}
            </ul>
          ) : (
            <Box>No default encryption configured.</Box>
          )}
        </Box>
      </Container>
      <Container header={<Header variant="h2">Website</Header>}>
        <ColumnLayout columns={2} variant="default">
          <div>
            <Box variant="small" color="text-label">
              Index Document
            </Box>
            <Box>{website?.IndexDocument?.Suffix || "—"}</Box>
          </div>
          <div>
            <Box variant="small" color="text-label">
              Error Document
            </Box>
            <Box>{website?.ErrorDocument?.Key || "—"}</Box>
          </div>
        </ColumnLayout>
      </Container>
      <Container header={<Header variant="h2">Lifecycle</Header>}>
        <Box>
          {Array.isArray(lifecycle) && lifecycle.length > 0 ? (
            <ul>
              {lifecycle.map((rule: any, idx: number) => (
                <li key={idx}>
                  {rule.ID || `Rule ${idx + 1}`} — Status: {rule.Status || "—"}
                </li>
              ))}
            </ul>
          ) : (
            <Box>No lifecycle rules configured.</Box>
          )}
        </Box>
      </Container>
    </SpaceBetween>
  );

  const permissionsContent = (
    <Container header={<Header variant="h2">Permissions</Header>} className="aws-table-card">
      <SpaceBetween size="l" direction="vertical">
        <div>
          <SpaceBetween direction="horizontal" size="xs">
            <Header variant="h3">Bucket Policy</Header>
            <Button variant="link" onClick={openPolicyEdit} disabled={policySaving}>
              Edit
            </Button>
          </SpaceBetween>
          <Box>
            {policy ? (
              <CodeView content={JSON.stringify(policy, null, 2)} lineNumbers wrapLines />
            ) : (
              <Box>No bucket policy set.</Box>
            )}
          </Box>
        </div>
        <div>
          <SpaceBetween direction="horizontal" size="xs">
            <Header variant="h3">Public Access Block</Header>
            <Button
              variant="link"
              onClick={openPublicAccessBlockEdit}
              disabled={publicAccessBlockSaving}
            >
              Edit
            </Button>
          </SpaceBetween>
          <Box>
            {publicAccessBlock ? (
              <ColumnLayout columns={4} variant="default">
                <div>
                  <Box variant="small" color="text-label">
                    Block public access to buckets and objects granted through new access control
                    lists (ACLs)
                  </Box>
                  <StatusIndicator type={publicAccessBlock.BlockPublicAcls ? "success" : "info"}>
                    {publicAccessBlock.BlockPublicAcls ? "On" : "Off"}
                  </StatusIndicator>
                </div>
                <div>
                  <Box variant="small" color="text-label">
                    Block public access to buckets and objects granted through any access control
                    lists (ACLs)
                  </Box>
                  <StatusIndicator type={publicAccessBlock.IgnorePublicAcls ? "success" : "info"}>
                    {publicAccessBlock.IgnorePublicAcls ? "On" : "Off"}
                  </StatusIndicator>
                </div>
                <div>
                  <Box variant="small" color="text-label">
                    Block public access to buckets and objects granted through new public bucket or
                    access point policies
                  </Box>
                  <StatusIndicator type={publicAccessBlock.BlockPublicPolicy ? "success" : "info"}>
                    {publicAccessBlock.BlockPublicPolicy ? "On" : "Off"}
                  </StatusIndicator>
                </div>
                <div>
                  <Box variant="small" color="text-label">
                    Block public and cross-account access to buckets and objects through any public
                    bucket or access point policies
                  </Box>
                  <StatusIndicator
                    type={publicAccessBlock.RestrictPublicBuckets ? "success" : "info"}
                  >
                    {publicAccessBlock.RestrictPublicBuckets ? "On" : "Off"}
                  </StatusIndicator>
                </div>
              </ColumnLayout>
            ) : (
              <Box>Public access block not configured.</Box>
            )}
          </Box>
        </div>
        <div>
          <SpaceBetween direction="horizontal" size="xs">
            <Header variant="h3">Access Control List (ACL)</Header>
            <Button variant="link" onClick={openAclEdit} disabled={aclSaving}>
              Edit
            </Button>
          </SpaceBetween>
          <Box>
            {acl?.Grants && acl.Grants.length > 0 ? (
              <Table
                columnDefinitions={[
                  {
                    header: "Grantee",
                    cell: (item: any) =>
                      item.Grantee?.DisplayName || item.Grantee?.ID || item.Grantee?.URI || "—",
                  },
                  { header: "Permission", cell: (item: any) => item.Permission },
                ]}
                items={acl.Grants}
                empty={<Box>No ACL grants</Box>}
              />
            ) : (
              <Box>No ACL grants configured.</Box>
            )}
          </Box>
        </div>
      </SpaceBetween>
    </Container>
  );

  const tagsContent = (
    <Container header={<Header variant="h2">Tags</Header>} className="aws-table-card">
      {tags.length > 0 ? (
        <Table
          items={tags}
          variant="borderless"
          columnDefinitions={[
            { id: "key", header: "Key", cell: (tag) => tag.Key || "—" },
            { id: "value", header: "Value", cell: (tag) => tag.Value || "—" },
          ]}
          ariaLabels={{
            itemSelectionLabel: (_data, tag) =>
              `Select tag ${(tag as { Key?: string }).Key || "without a key"}`,
            selectionGroupLabel: "Bucket tags",
          }}
          empty={<Box>No tags assigned.</Box>}
        />
      ) : (
        <Box>No tags assigned.</Box>
      )}
    </Container>
  );

  // Modals
  const policyModal = (
    <Modal
      visible={policyEditModal}
      onDismiss={() => setPolicyEditModal(false)}
      header="Edit Bucket Policy"
      footer={
        <SpaceBetween direction="horizontal" size="xs">
          <Button
            onClick={() => setPolicyEditModal(false)}
            formAction="none"
            disabled={policySaving}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={savePolicy} loading={policySaving}>
            Save policy
          </Button>
        </SpaceBetween>
      }
    >
      <Box>
        <Alert type="info">
          Enter a valid JSON bucket policy. See{" "}
          <Link
            href="https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucket-policies.html"
            external
          >
            AWS documentation
          </Link>{" "}
          for policy structure.
        </Alert>
        <Textarea value={policyText} onChange={(e) => setPolicyText(e.detail.value)} rows={20} />
      </Box>
    </Modal>
  );

  const versioningModalComponent = (
    <Modal
      visible={versioningModal}
      onDismiss={() => setVersioningModal(false)}
      header="Edit Versioning"
      footer={
        <SpaceBetween direction="horizontal" size="xs">
          <Button
            onClick={() => setVersioningModal(false)}
            formAction="none"
            disabled={versioningSaving}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={saveVersioning} loading={versioningSaving}>
            Save
          </Button>
        </SpaceBetween>
      }
    >
      <Box>
        <FormField label="Versioning status">
          <Select
            selectedOption={{ value: versioningTarget.value, label: versioningTarget.value }}
            options={[
              { value: "Enabled", label: "Enabled" },
              { value: "Suspended", label: "Suspended" },
            ]}
            onChange={({ detail }) => {
              const val = detail.selectedOption?.value || "Suspended";
              setVersioningTarget({ label: val, value: val });
            }}
          />
        </FormField>
        <Box variant="small" color="text-body-secondary" margin={{ top: "m" }}>
          Suspending versioning stops new object versions from being created but retains existing
          versions.
        </Box>
      </Box>
    </Modal>
  );

  // Public Access Block Modal
  const publicAccessBlockModalComponent = (
    <Modal
      visible={publicAccessBlockModal}
      onDismiss={() => setPublicAccessBlockModal(false)}
      header="Edit Public Access Block"
      footer={
        <SpaceBetween direction="horizontal" size="xs">
          <Button
            onClick={() => setPublicAccessBlockModal(false)}
            formAction="none"
            disabled={publicAccessBlockSaving}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={savePublicAccessBlock}
            loading={publicAccessBlockSaving}
          >
            Save
          </Button>
        </SpaceBetween>
      }
    >
      <Box>
        <Alert type="info">
          Public access block settings help you prevent public access to your bucket and its
          objects. Turning these settings on overrides any existing policies or ACLs that allow
          public access.
        </Alert>
        <FormField label="Block public access to buckets and objects granted through new access control lists (ACLs)">
          <Checkbox
            checked={publicAccessBlockConfig.BlockPublicAcls}
            onChange={({ detail }) =>
              setPublicAccessBlockConfig({
                ...publicAccessBlockConfig,
                BlockPublicAcls: detail.checked,
              })
            }
          />
        </FormField>
        <FormField label="Block public access to buckets and objects granted through any access control lists (ACLs)">
          <Checkbox
            checked={publicAccessBlockConfig.IgnorePublicAcls}
            onChange={({ detail }) =>
              setPublicAccessBlockConfig({
                ...publicAccessBlockConfig,
                IgnorePublicAcls: detail.checked,
              })
            }
          />
        </FormField>
        <FormField label="Block public access to buckets and objects granted through new public bucket or access point policies">
          <Checkbox
            checked={publicAccessBlockConfig.BlockPublicPolicy}
            onChange={({ detail }) =>
              setPublicAccessBlockConfig({
                ...publicAccessBlockConfig,
                BlockPublicPolicy: detail.checked,
              })
            }
          />
        </FormField>
        <FormField label="Block public and cross-account access to buckets and objects through any public bucket or access point policies">
          <Checkbox
            checked={publicAccessBlockConfig.RestrictPublicBuckets}
            onChange={({ detail }) =>
              setPublicAccessBlockConfig({
                ...publicAccessBlockConfig,
                RestrictPublicBuckets: detail.checked,
              })
            }
          />
        </FormField>
      </Box>
    </Modal>
  );

  // ACL Modal
  const aclModalComponent = (
    <Modal
      visible={aclModal}
      onDismiss={() => setAclModal(false)}
      header="Edit Access Control List (ACL)"
      footer={
        <SpaceBetween direction="horizontal" size="xs">
          <Button onClick={() => setAclModal(false)} formAction="none" disabled={aclSaving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={saveAcl} loading={aclSaving}>
            Save
          </Button>
        </SpaceBetween>
      }
    >
      <Box>
        <Alert type="info">
          ACLs are legacy access control mechanisms. For most use cases, we recommend using bucket
          policies instead. Each grant specifies a grantee and a permission.
        </Alert>
        <SpaceBetween size="xs">
          <Button
            variant="link"
            onClick={() =>
              setAclConfig([
                ...aclConfig,
                { Grantee: { Type: "CanonicalUser", ID: "", DisplayName: "" }, Permission: "READ" },
              ])
            }
            formAction="none"
          >
            Add grant
          </Button>
        </SpaceBetween>
        <Table
          columnDefinitions={[
            {
              header: "Grantee Type",
              cell: (item: any) => {
                const idx = aclConfig.indexOf(item);
                return (
                  <Select
                    selectedOption={{
                      value: item.Grantee?.Type || "CanonicalUser",
                      label: item.Grantee?.Type || "CanonicalUser",
                    }}
                    options={[
                      { value: "CanonicalUser", label: "Canonical User (AWS Account)" },
                      { value: "AmazonCustomerByEmail", label: "Amazon Customer by Email" },
                      { value: "Group", label: "Group (All Authenticated Users / All Users)" },
                    ]}
                    onChange={({ detail }) => {
                      const newGrants = [...aclConfig];
                      newGrants[idx] = {
                        ...newGrants[idx],
                        Grantee: { ...newGrants[idx].Grantee, Type: detail.selectedOption.value },
                      };
                      setAclConfig(newGrants);
                    }}
                  />
                );
              },
            },
            {
              header: "Grantee ID / Email / URI",
              cell: (item: any) => {
                const idx = aclConfig.indexOf(item);
                return (
                  <Input
                    value={
                      item.Grantee?.ID || item.Grantee?.EmailAddress || item.Grantee?.URI || ""
                    }
                    onChange={({ detail }) => {
                      const newGrants = [...aclConfig];
                      const grantee = { ...newGrants[idx].Grantee };
                      if (grantee.Type === "Group") grantee.URI = detail.value;
                      else if (grantee.Type === "AmazonCustomerByEmail")
                        grantee.EmailAddress = detail.value;
                      else grantee.ID = detail.value;
                      newGrants[idx] = { ...newGrants[idx], Grantee: grantee };
                      setAclConfig(newGrants);
                    }}
                    placeholder={
                      item.Grantee?.Type === "Group"
                        ? "URI (e.g., http://acs.amazonaws.com/groups/global/AllUsers)"
                        : item.Grantee?.Type === "AmazonCustomerByEmail"
                          ? "Email address"
                          : "Canonical User ID"
                    }
                  />
                );
              },
            },
            {
              header: "Display Name",
              cell: (item: any) => {
                const idx = aclConfig.indexOf(item);
                return (
                  <Input
                    value={item.Grantee?.DisplayName || ""}
                    onChange={({ detail }) => {
                      const newGrants = [...aclConfig];
                      newGrants[idx] = {
                        ...newGrants[idx],
                        Grantee: { ...newGrants[idx].Grantee, DisplayName: detail.value },
                      };
                      setAclConfig(newGrants);
                    }}
                    placeholder="Display name"
                  />
                );
              },
            },
            {
              header: "Permission",
              cell: (item: any) => {
                const idx = aclConfig.indexOf(item);
                return (
                  <Select
                    selectedOption={{
                      value: item.Permission || "READ",
                      label: item.Permission || "READ",
                    }}
                    options={[
                      { value: "READ", label: "READ" },
                      { value: "WRITE", label: "WRITE" },
                      { value: "READ_ACP", label: "READ_ACP" },
                      { value: "WRITE_ACP", label: "WRITE_ACP" },
                      { value: "FULL_CONTROL", label: "FULL_CONTROL" },
                    ]}
                    onChange={({ detail }) => {
                      const newGrants = [...aclConfig];
                      newGrants[idx] = {
                        ...newGrants[idx],
                        Permission: detail.selectedOption.value,
                      };
                      setAclConfig(newGrants);
                    }}
                  />
                );
              },
            },
            {
              header: "Actions",
              cell: (item: any) => {
                const idx = aclConfig.indexOf(item);
                return (
                  <Button
                    variant="inline-link"
                    onClick={() => setAclConfig(aclConfig.filter((_, i) => i !== idx))}
                    formAction="none"
                  >
                    Remove
                  </Button>
                );
              },
            },
          ]}
          items={aclConfig}
          empty={<Box>No grants configured. Add a grant to begin.</Box>}
        />
      </Box>
    </Modal>
  );

  // An "Objects" action on a page that says the bucket is not there is the same
  // claim as the form would have been, so it goes too. "Back" is the way out
  // and stays.
  const bucketUnavailable = bucket.status === "missing" || bucket.status === "unavailable";

  return (
    <ServiceLayout
      serviceName={`Bucket: ${bucketName}`}
      serviceCategory="Storage"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "Storage", href: "#" },
        { text: "S3", href: "/s3" },
        { text: bucketName, href: `/s3/${encodeURIComponent(bucketName)}` },
      ]}
      headerActions={
        <SpaceBetween direction="horizontal" size="xs">
          {!bucketUnavailable && (
            <Button
              onClick={() => router.push(`/s3/${encodeURIComponent(bucketName)}/objects`)}
              formAction="none"
            >
              Objects
            </Button>
          )}
          <Button onClick={() => router.push("/s3")} formAction="none">
            Back to Buckets
          </Button>
        </SpaceBetween>
      }

      headingLevel="h2"
    >
      <SpaceBetween size="l" direction="vertical">
        <Header
          variant="h2"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              {!bucketUnavailable && (
                <Button
                  onClick={() => router.push(`/s3/${encodeURIComponent(bucketName)}/objects`)}
                >
                  Browse objects
                </Button>
              )}
              <Button onClick={() => router.push("/s3")} formAction="none">
                Back
              </Button>
            </SpaceBetween>
          }
        >
          {bucketName}
        </Header>
        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}
        {loading || bucket.status === "pending" ? (
          <Box>Loading bucket details...</Box>
        ) : bucket.status === "missing" ? (
          <BucketNotFound bucketName={bucketName} />
        ) : bucket.status === "unavailable" ? (
          <BucketUnreadable message={bucket.message} onRetry={fetchDetails} />
        ) : (
          <Tabs
            tabs={[
              { label: "Overview", id: "overview", content: overviewContent },
              { label: "Objects", id: "objects", content: objectsContent },
              { label: "Properties", id: "properties", content: propertiesContent },
              { label: "Permissions", id: "permissions", content: permissionsContent },
              { label: "Tags", id: "tags", content: tagsContent },
            ]}
          />
        )}
        {/* The edit dialogs go with the form: a bucket that is not there has no
            policy, ACL, versioning or public-access block to write. */}
        {!bucketUnavailable && (
          <>
            {policyModal}
            {versioningModalComponent}
            {publicAccessBlockModalComponent}
            {aclModalComponent}
          </>
        )}
      </SpaceBetween>
    </ServiceLayout>
  );
}
