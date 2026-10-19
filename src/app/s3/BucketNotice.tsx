"use client";

/**
 * The screens a bucket route shows instead of the bucket's working UI.
 *
 * "Not found" and "could not be read" are different facts and stay different
 * components, because only the emulator saying NoSuchBucket may claim the
 * bucket does not exist. An unreachable emulator says nothing about the bucket,
 * and must not be reported as a missing one.
 *
 * Both leave the configuration UI unmounted rather than merely disabled. A
 * form pre-filled with "None" and "Disabled" is indistinguishable from real
 * state, so an error above it is not enough — the form has to be gone.
 */

import Alert from "@cloudscape-design/components/alert";
import Button from "@cloudscape-design/components/button";
import Link from "@cloudscape-design/components/link";
import SpaceBetween from "@cloudscape-design/components/space-between";

export function BucketNotFound({ bucketName }: { bucketName: string }) {
  return (
    <SpaceBetween size="m" direction="vertical">
      <Alert type="error" header="Bucket not found">
        {`The bucket "${bucketName}" does not exist in the active emulator. It may have been deleted, or the link may be out of date.`}
      </Alert>
      <Link href="/s3">Back to buckets</Link>
    </SpaceBetween>
  );
}

export function BucketUnreadable({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <SpaceBetween size="m" direction="vertical">
      <Alert type="error" header="Bucket could not be read">
        {message}
      </Alert>
      <SpaceBetween direction="horizontal" size="xs">
        <Button onClick={onRetry} formAction="none">
          Retry
        </Button>
        <Link href="/s3">Back to buckets</Link>
      </SpaceBetween>
    </SpaceBetween>
  );
}
