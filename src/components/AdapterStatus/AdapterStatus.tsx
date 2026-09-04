"use client";

/**
 * AdapterStatus Component — Shows adapter connection status.
 * Uses Cloudscape StatusIndicator exactly.
 */

import React, { useState, useEffect } from 'react';
import StatusIndicator from '@cloudscape-design/components/status-indicator';

export type AdapterConnectionStatus = 'connected' | 'disconnected' | 'checking';

export interface AdapterStatusProps {
  readonly status?: AdapterConnectionStatus;
  readonly endpointUrl?: string;
}

export function AdapterStatus({ status = 'checking', endpointUrl }: AdapterStatusProps): React.ReactElement {
  const [currentStatus, setCurrentStatus] = useState<AdapterConnectionStatus>(status);

  useEffect(() => {
    setCurrentStatus('checking');
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setCurrentStatus(data.status === 'healthy' ? 'connected' : data.status === 'unreachable' ? 'disconnected' : 'checking');
      })
      .catch(() => setCurrentStatus('disconnected'));
  }, [endpointUrl]);

  const statusType = currentStatus === 'connected' ? 'success' : currentStatus === 'disconnected' ? 'error' : 'loading';

  return (
    <div className="adapter-status-container" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <StatusIndicator type={statusType}>{currentStatus}</StatusIndicator>
      {endpointUrl ? <span style={{ fontSize: '12px', color: '#666' }}>{endpointUrl}</span> : null}
    </div>
  );
}
