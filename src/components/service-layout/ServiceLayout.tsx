import React from 'react';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Header from '@cloudscape-design/components/header';
import Container from '@cloudscape-design/components/container';
import Tabs from '@cloudscape-design/components/tabs';
import Box from '@cloudscape-design/components/box';
import type { TabsProps } from '@cloudscape-design/components/tabs';
import StatusIndicator from '@cloudscape-design/components/status-indicator';

export interface ServiceLayoutProps {
  readonly serviceName: string;
  readonly serviceCategory?: string;
  readonly breadcrumbs?: { text: string; href: string }[];
  readonly navigationItems?: React.ReactElement;
  readonly headerActions?: React.ReactElement;
  readonly tabs?: ReadonlyArray<TabsProps.Tab>;
  readonly children: React.ReactNode;
  readonly splitPanel?: React.ReactElement;
  readonly provider?: string;
  readonly region?: string;
  readonly healthStatus?: 'healthy' | 'degraded' | 'unreachable' | 'checking';
  readonly healthReason?: string;
}

/**
 * ServiceLayout — Standard service console layout per PRD Section 9
 * Matches AWS Console structure exactly:
 * - Works INSIDE AppShell (no nested AppLayout)
 * - Header with breadcrumbs (provided by AppShell), title, actions
 * - Main content area with tabs (Overview, Details, Monitoring, Tags, etc.)
 */
export const ServiceLayout: React.FC<ServiceLayoutProps> = ({
  serviceName,
  headerActions,
  tabs,
  children,
  provider,
  region,
  healthStatus,
  healthReason,
}) => {
  const statusType = healthStatus === 'healthy' ? 'success' : healthStatus === 'degraded' ? 'warning' : healthStatus === 'unreachable' ? 'error' : 'in-progress';
  const headerDescription = [provider, region].filter(Boolean).join(' | ');

  return (
    <SpaceBetween size="l" direction="vertical" className="aws-service-layout">
      <Header
        variant="h1"
        className="aws-service-layout__header"
        description={headerDescription || undefined}
        info={healthStatus ? <StatusIndicator type={statusType}>{healthReason || healthStatus}</StatusIndicator> : undefined}
        actions={headerActions ? <SpaceBetween size="s" direction="horizontal">{headerActions}</SpaceBetween> : undefined}
      >
        {serviceName}
      </Header>
      <Container className="aws-service-layout__container">
        {tabs ? <Tabs tabs={tabs} /> : null}
        <Box padding="m" className="service-content">
          {children}
        </Box>
      </Container>
    </SpaceBetween>
  );
};
