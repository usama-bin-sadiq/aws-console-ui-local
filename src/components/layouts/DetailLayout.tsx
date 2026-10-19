import React from "react";
import Header from "@cloudscape-design/components/header";
import Tabs from "@cloudscape-design/components/tabs";
import SpaceBetween from "@cloudscape-design/components/space-between";

interface DetailTab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface DetailLayoutProps {
  title: string;
  actions?: React.ReactNode;
  tabs?: DetailTab[];
  activeTabId?: string;
  onTabChange?: (tabId: string) => void;
  children: React.ReactNode;
}

/**
 * Standard detail page layout with header and optional tabs.
 * Used for all AWS resource detail pages (instance detail, bucket detail, etc.)
 *
 * Usage:
 * ```tsx
 * <DetailLayout
 *   title={`Instance ${instanceId}`}
 *   actions={<Button>Stop</Button>}
 *   tabs={[
 *     { id: 'details', label: 'Details', content: <DetailsTab /> },
 *     { id: 'security', label: 'Security', content: <SecurityTab /> },
 *     { id: 'tags', label: 'Tags', content: <TagsTab /> },
 *   ]}
 *   activeTabId={activeTab}
 *   onTabChange={setActiveTab}
 * >
 *   {/* fallback content if no tabs *\/}
 * </DetailLayout>
 * ```
 */
export function DetailLayout({
  title,
  actions,
  tabs,
  activeTabId,
  onTabChange,
  children,
}: DetailLayoutProps) {
  const activeTab = tabs?.find((t) => t.id === activeTabId) ?? tabs?.[0];

  return (
    <div style={{ padding: 16 }}>
      <SpaceBetween size="l">
        <Header variant="h1" actions={actions}>
          {title}
        </Header>

        {tabs && tabs.length > 0 ? (
          <Tabs
            activeTabId={activeTabId ?? tabs[0].id}
            onChange={({ detail }) => onTabChange?.(detail.activeTabId)}
            tabs={tabs.map((tab) => ({
              id: tab.id,
              label: tab.label,
              content: tab.content,
            }))}
          />
        ) : (
          children
        )}
      </SpaceBetween>
    </div>
  );
}
