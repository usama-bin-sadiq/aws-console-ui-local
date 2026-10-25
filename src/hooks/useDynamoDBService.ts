/**
 * useDynamoDBService — DynamoDB adapter hook.
 */

import { useState, useCallback } from "react";
import { dynamodb } from "@/lib/aws-clients";
import { ListTablesCommand } from "@aws-sdk/client-dynamodb";
import { ADAPTER_CONFIG } from "@/config/adapter-config";

export interface DynamoDBServiceState {
  tables: unknown[];
  loading: boolean;
  error: string | null;
}

export function useDynamoDBService() {
  const [state, setState] = useState<DynamoDBServiceState>({
    tables: [],
    loading: false,
    error: null,
  });

  const listTables = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await dynamodb.send(new ListTablesCommand({}));
      setState((prev) => ({ ...prev, tables: result.TableNames || [], loading: false }));
    } catch (err: unknown) {
      setState((prev) => ({ ...prev, error: String(err), loading: false }));
    }
  }, []);

  return { ...state, listTables, adapterMode: ADAPTER_CONFIG.adapterMode };
}
