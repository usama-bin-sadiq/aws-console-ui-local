/**
 * useEFSService — EFS adapter hook.
 */

import { useState, useCallback } from "react";
import { efs } from "@/lib/aws-clients";
import { DescribeFileSystemsCommand } from "@aws-sdk/client-efs";
import { ADAPTER_CONFIG } from "@/config/adapter-config";

export interface EFSServiceState {
  fileSystems: unknown[];
  loading: boolean;
  error: string | null;
}

export function useEFSService() {
  const [state, setState] = useState<EFSServiceState>({
    fileSystems: [],
    loading: false,
    error: null,
  });

  const describeFileSystems = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await efs.send(new DescribeFileSystemsCommand({}));
      setState((prev) => ({
        ...prev,
        fileSystems: result.FileSystems || [],
        loading: false,
      }));
    } catch (err: unknown) {
      setState((prev) => ({ ...prev, error: String(err), loading: false }));
    }
  }, []);

  return { ...state, describeFileSystems, adapterMode: ADAPTER_CONFIG.adapterMode };
}
