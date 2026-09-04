/**
 * useS3Service — S3 adapter hook.
 */

import { useState, useCallback } from 'react';
import { s3 } from '@/lib/aws-clients'
import { ListBucketsCommand } from '@aws-sdk/client-s3';
import { ADAPTER_CONFIG } from '@/config/adapter-config';

export interface S3ServiceState {
  buckets: unknown[];
  loading: boolean;
  error: string | null;
}

export function useS3Service() {
  const [state, setState] = useState<S3ServiceState>({ buckets: [], loading: false, error: null });

  const listBuckets = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await s3.send(new ListBucketsCommand({}));
      setState((prev) => ({ ...prev, buckets: (result as any)?.Buckets || [], loading: false }));
    } catch (err: unknown) {
      setState((prev) => ({ ...prev, error: String(err), loading: false }));
    }
  }, []);

  return { ...state, listBuckets, adapterMode: ADAPTER_CONFIG.adapterMode };
}
