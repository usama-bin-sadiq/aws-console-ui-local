"use client";

import React from "react";
import { BreadcrumbGroup } from "@cloudscape-design/components";
import SpaceBetween from "@cloudscape-design/components/space-between";
import { ResourceTable, type ResourceTableConfig, type ActionDefinition } from "@/features/resource-table";
import { CrossServiceLinks } from "@/components/CrossServiceLinks";
import { AwsServiceHeader } from "./AwsServiceHeader";

interface AwsServicePageProps<T extends Record<string, unknown> = Record<string, unknown>> {
  /** Service display name (e.g. "EC2", "Amazon S3") */
  serviceName: string;
  /** AWS Architecture Service icon name */
  serviceIcon?: string;
  /** Breadcrumb items (e.g. [{ text: "Home", href: "/" }, { text: "EC2", href: "/ec2" }]) */
  breadcrumbs: Array<{ text: string; href?: string }>;
  /** Table configuration */
  config: ResourceTableConfig<T>;
  /** All items */
  items: T[];
  /** Loading state */
  loading?: boolean;
  /** Selected items */
  selectedItems?: T[];
  /** Selection change handler */
  onSelectionChange?: (items: T[]) => void;
  /** Refresh handler */
  onRefresh?: () => void;
  /** Table actions */
  actions?: ActionDefinition<T>[];
  /** Create button click handler (if not using createHref) */
  onCreateClick?: () => void;
  /** Cross-service dependent links */
  crossServiceLinks?: Array<{ label: string; href: string; description?: string }>;
  /** Extra header actions rendered next to the create button */
  extraHeaderActions?: React.ReactNode;
  /** Resource count for the header counter */
  counter?: number | string;
  /** Children rendered after the table (e.g. detail panel) */
  children?: React.ReactNode;
}

/**
 * AwsServicePage — the standard AWS Console service page layout.
 *
 * Structure:
 *   BreadcrumbGroup
 *   AwsServiceHeader (icon + name + counter + primary create action)
 *   ResourceTable (filter, actions dropdown, pagination, selection)
 *   CrossServiceLinks (dependent service actions)
 *   children (optional, e.g. detail panel)
 *
 * Every service page should use this so all pages look identical to AWS Console.
 */
export function AwsServicePage<T extends Record<string, unknown> = Record<string, unknown>>({
  serviceName,
  serviceIcon = "aws-service-icon",
  breadcrumbs,
  config,
  items,
  loading = false,
  selectedItems = [],
  onSelectionChange,
  onRefresh,
  actions,
  onCreateClick,
  crossServiceLinks,
  extraHeaderActions,
  counter,
  children,
}: AwsServicePageProps<T>) {
  return (
    <SpaceBetween size="l" direction="vertical">
      <BreadcrumbGroup
        items={breadcrumbs.map((crumb) => ({
          text: crumb.text,
          href: crumb.href ?? "/",
        }))}
      />

      <AwsServiceHeader
        serviceName={serviceName}
        serviceIcon={serviceIcon}
        counter={counter ?? items.length}
        primaryAction={
          config.createHref || onCreateClick ? (
            <button
              type="button"
              className="aws-service-page__create"
              onClick={onCreateClick ?? (() => {})}
              disabled={!config.createHref && !onCreateClick}
            >
              {config.createLabel ?? `Create ${config.resourceName}`}
            </button>
          ) : null
        }
        actions={extraHeaderActions}
      />

      <ResourceTable
        config={config}
        items={items}
        loading={loading}
        selectedItems={selectedItems}
        onSelectionChange={onSelectionChange}
        onRefresh={onRefresh}
        actions={actions}
        onCreateClick={onCreateClick}
      />

      {crossServiceLinks && crossServiceLinks.length > 0 && (
        <CrossServiceLinks links={crossServiceLinks} triggerText="Create" />
      )}

      {children}
    </SpaceBetween>
  );
}
