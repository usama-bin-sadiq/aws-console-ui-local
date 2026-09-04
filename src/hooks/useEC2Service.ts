/**
 * useEC2Service — Adapter-aware hook for all EC2 SDK actions.
 * Uses adapter SDK factory; routes to localstack endpoint.
 */

import { useState, useCallback } from 'react';
import { ec2 } from '@/lib/aws-clients'
import { DescribeInstancesCommand, RunInstancesCommand, TerminateInstancesCommand } from '@aws-sdk/client-ec2';
import { ADAPTER_CONFIG } from '@/config/adapter-config';

export interface EC2ServiceState {
  readonly instances: unknown[];
  readonly volumes: unknown[];
  readonly securityGroups: unknown[];
  readonly loadBalancers: unknown[];
  readonly loading: boolean;
  readonly error: string | null;
}

export function useEC2Service() {
  const [state, setState] = useState<EC2ServiceState>({
    instances: [],
    volumes: [],
    securityGroups: [],
    loadBalancers: [],
    loading: false,
    error: null,
  });

  const describeInstances = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await ec2.send(new DescribeInstancesCommand({}));
      setState((prev) => ({ ...prev, instances: (result as any)?.Reservations || [], loading: false }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown EC2 error';
      setState((prev) => ({ ...prev, error: message, loading: false }));
    }
  }, []);

  const runInstances = useCallback(async (params: Record<string, unknown>) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await ec2.send(new RunInstancesCommand(params as any));
      setState((prev) => ({ ...prev, loading: false }));
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown EC2 error';
      setState((prev) => ({ ...prev, error: message, loading: false }));
      throw err;
    }
  }, []);

  const terminateInstances = useCallback(async (instanceIds: string[]) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await ec2.send(new TerminateInstancesCommand({ InstanceIds: instanceIds }));
      setState((prev) => ({ ...prev, loading: false }));
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown EC2 error';
      setState((prev) => ({ ...prev, error: message, loading: false }));
      throw err;
    }
  }, []);

  return {
    ...state,
    describeInstances,
    runInstances,
    terminateInstances,
    adapterMode: ADAPTER_CONFIG.adapterMode,
  };
}
