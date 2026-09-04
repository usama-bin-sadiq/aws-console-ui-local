import React from 'react';
import AppLayout from '@cloudscape-design/components/app-layout';
import SideNavigation from '@cloudscape-design/components/side-navigation';
import TopNavigation from '@cloudscape-design/components/top-navigation';
import BreadcrumbGroup from '@cloudscape-design/components/breadcrumb-group';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import Tabs from '@cloudscape-design/components/tabs';
import SpaceBetween from '@cloudscape-design/components/space-between';
import ContentLayout from '@cloudscape-design/components/content-layout';
import SplitPanel from '@cloudscape-design/components/split-panel';

/**
 * ServiceLayout — Standard service console layout per PRD Section 9
 * Matches AWS Console structure exactly:
 * - Sidebar navigation (service-level)
 * - Top header with breadcrumbs, title, actions
 * - Main content area with tabs (Overview, Details, Monitoring, Tags, etc.)
 * - Action bar with primary/secondary actions
 */
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

export const ServiceLayout: React.FC<ServiceLayoutProps> = ({
  serviceName,
  breadcrumbs,
  children,
  headerActions,
  tabs,
  splitPanel,
}) => {
  return (
    <AppLayout
      headerSelector="#awsui-top-navigation"
      breadcrumbs={breadcrumbs ? <BreadcrumbGroup items={breadcrumbs} /> : undefined}
      content={
        <ContentLayout header={
          <Header variant="h1" actions={headerActions ? <SpaceBetween size="s">{headerActions}</SpaceBetween> : undefined}>
            {serviceName}
          </Header>
        }>
          <Container>
            {tabs ? <Tabs tabs={tabs as any} /> : null}
            <div style={{ padding: 'var(--awsui-spacing-m)' }}>
              {children}
            </div>
          </Container>
        </ContentLayout>
      }
      splitPanel={splitPanel ? <SplitPanel header="Details">{splitPanel}</SplitPanel> : undefined}
      splitPanelOpen={!!splitPanel}
      splitPanelSize={400}
    />
  );
};
