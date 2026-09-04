import React from 'react';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Header from '@cloudscape-design/components/header';
import Container from '@cloudscape-design/components/container';
import Tabs from '@cloudscape-design/components/tabs';

export interface ServiceLayoutProps {
  readonly serviceName: string;
  readonly serviceCategory?: string;
  readonly breadcrumbs?: { text: string; href: string }[];
  readonly navigationItems?: React.ReactElement;
  readonly headerActions?: React.ReactElement;
  readonly tabs?: React.ReactElement;
  readonly children: React.ReactNode;
  readonly splitPanel?: React.ReactElement;
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
}) => {
  return (
    <SpaceBetween size="l" direction="vertical">
      <Header variant="h1" actions={headerActions ? <SpaceBetween size="s" direction="horizontal">{headerActions}</SpaceBetween> : undefined}>
        {serviceName}
      </Header>
      <Container>
        {tabs ? <Tabs tabs={tabs as any} /> : null}
        <div style={{ padding: 'var(--awsui-spacing-m)' }}>
          {children}
        </div>
      </Container>
    </SpaceBetween>
  );
};
