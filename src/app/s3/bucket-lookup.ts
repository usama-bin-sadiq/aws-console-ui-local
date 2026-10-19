"use client";

/**
 * Bucket existence check for the /s3/[bucketName] routes.
 *
 * The [bucketName] segment is user input: a stale link, a pasted URL or a typo
 * produces any string at all. Both bucket routes used to render their complete
 * working UI for every one of those strings, so `/s3/buckets` and
 * `/s3/typo-here` both answered 200 with a populated, editable configuration
 * screen. A form full of "None" defaults reads as real emulator state, which is
 * worse than an error: it invites edits to a bucket that is not there.
 *
 * A per-resource 404 cannot answer "does this bucket exist". S3 answers
 * GetBucketPolicy, GetBucketTagging and GetBucketLifecycleConfiguration with
 * 404 NoSuch*Configuration when the *bucket exists* and the *configuration
 * does not*, so on those operations the status code is ambiguous. ListBuckets
 * is the one call whose failure describes the request rather than the resource,
 * so membership in that list is the only honest signal available from a
 * browser.
 *
 * A failed or unreadable ListBuckets is reported as "unavailable" and never as
 * "missing": an emulator that cannot be reached has said nothing about the
 * bucket, and telling the user the bucket is absent would send them hunting for
 * a typo that is not the problem.
 */

import { apiFetch } from "@/lib/api-client";

/**
 * The four states a bucket route can be in. "missing" and "unavailable" are
 * separate on purpose — only "missing" may claim the bucket does not exist.
 */
export type BucketState =
  | { status: "pending" }
  | { status: "found" }
  | { status: "missing" }
  | { status: "unavailable"; message: string };

interface ListBucketsPayload {
  buckets?: Array<{ Name?: string } | null> | null;
  error?: string;
  message?: string;
}

export async function lookupBucket(bucketName: string): Promise<BucketState> {
  let res: Response;
  try {
    res = await apiFetch("/api/s3");
  } catch (err: unknown) {
    return {
      status: "unavailable",
      message: err instanceof Error ? err.message : "The S3 emulator did not respond",
    };
  }

  const data = (await res.json().catch(() => null)) as ListBucketsPayload | null;
  if (!res.ok || data?.error) {
    return {
      status: "unavailable",
      message: data?.message || data?.error || `Listing buckets failed (HTTP ${res.status})`,
    };
  }
  if (!Array.isArray(data?.buckets)) {
    // A payload this console cannot read is not evidence of absence.
    return {
      status: "unavailable",
      message: "The emulator returned a bucket list this console could not read",
    };
  }

  return data.buckets.some((entry) => entry?.Name === bucketName)
    ? { status: "found" }
    : { status: "missing" };
}
