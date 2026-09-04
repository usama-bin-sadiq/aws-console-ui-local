/**
 * GlobalSearch — PRD Section 11 (Search & Command Palette)
 * Enhanced autosuggest with resource search, documentation links,
 * quick actions, and keyboard navigation.
 */
import React, { useState, useCallback, useMemo } from 'react';
import Autosuggest from '@cloudscape-design/components/autosuggest';
import Input from '@cloudscape-design/components/input';
import Box from '@cloudscape-design/components/box';
import SpaceBetween from '@cloudscape-design/components/space-between';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import Icon from '@cloudscape-design/components/icon';
import { AWACS_DESIGN_TOKENS } from '@/constants/design-tokens';

export interface SearchResultItem {
  readonly id: string;
  readonly category: 'service' | 'resource' | 'documentation' | 'action';
  readonly text: string;
  readonly description?: string;
  readonly href?: string;
  readonly icon?: string;
}

export interface GlobalSearchProps {
  readonly onSearch?: (query: string, category?: string) => void;
  readonly onSelect?: (item: SearchResultItem) => void;
  readonly placeholder?: string;
  readonly width?: number | string;
}

export function GlobalSearch({
  onSearch,
  onSelect,
  placeholder = 'Search AWS resources, services, features, docs...',
  width = 400,
}: GlobalSearchProps): React.ReactElement {
  const [value, setValue] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = useCallback(
    (query: string) => {
      setValue(query);
      onSearch?.(query);
      // Simulated adapter-backed search results
      if (!query.trim()) {
        setResults([]);
        setShowResults(false);
        return;
      }
      const mockResults: SearchResultItem[] = [
        {
          id: 'ec2-service',
          category: 'service',
          text: 'EC2 — Elastic Compute Cloud',
          description: 'Virtual servers in the cloud',
          href: '/ec2',
          icon: 'compute',
        },
        {
          id: 's3-bucket-resource',
          category: 'resource',
          text: 'my-bucket (S3)',
          description: 'Resource: S3 Bucket',
          href: '/s3/bucket/my-bucket',
        },
        {
          id: 'lambda-function-resource',
          category: 'resource',
          text: 'process-data (Lambda)',
          description: 'Resource: Lambda Function',
          href: '/lambda/function/process-data',
        },
        {
          id: 'ec2-doc',
          category: 'documentation',
          text: 'EC2 Instance Types — AWS Docs',
          description: 'Documentation reference',
          href: 'https://docs.aws.amazon.com/ec2/latest/userguide/instance-types.html',
          icon: 'file',
        },
        {
          id: 'launch-ec2-action',
          category: 'action',
          text: 'Launch EC2 Instance',
          description: 'Quick action wizard',
          href: '/ec2/launch',
          icon: 'bolt',
        },
      ];
      const filtered = mockResults.filter(
        (r) => r.text.toLowerCase().includes(query.toLowerCase()) || r.description?.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
      setShowResults(true);
    },
    [onSearch]
  );

  const grouped = useMemo(() => {
    const groups: Record<string, SearchResultItem[]> = {};
    results.forEach((r) => {
      const key = r.category.toUpperCase();
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });
    return groups;
  }, [results]);

  return (
    <div style={{ position: 'relative', width }}>
      <Autosuggest
        onChange={({ detail }) => handleSearch(detail.value || '')}
        value={value}
        ariaLabel="Global AWS Console search"
        placeholder={placeholder}
        empty="No results found"
        onSelect={({ detail }) => {
          const item = results.find((r) => r.id === detail.value);
          if (item) {
            onSelect?.(item);
            setShowResults(false);
          }
        }}
      />
      {showResults && results.length > 0 && (
        <Box
          padding="n"
          variant="div"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            backgroundColor: AWACS_DESIGN_TOKENS.colors.backgroundSecondary,
            border: `1px solid ${AWACS_DESIGN_TOKENS.colors.border}`,
            borderRadius: AWACS_DESIGN_TOKENS.borderRadius.default,
            zIndex: 9999,
            maxHeight: 520,
            overflow: 'auto',
            boxShadow: AWACS_DESIGN_TOKENS.elevation.level3,
          }}
        >
          <SpaceBetween size="xs" direction="vertical">
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <div
                  style={{
                    padding: AWACS_DESIGN_TOKENS.spacing.xs,
                    fontSize: AWACS_DESIGN_TOKENS.typography.fontSizeXs,
                    fontWeight: 700,
                    color: AWACS_DESIGN_TOKENS.colors.textSecondary,
                    borderBottom: `1px solid ${AWACS_DESIGN_TOKENS.colors.border}`,
                    backgroundColor: AWACS_DESIGN_TOKENS.colors.backgroundLayout,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {category}
                </div>
                {items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      onSelect?.(item);
                      setShowResults(false);
                      setValue('');
                    }}
                    style={{
                      padding: `${AWACS_DESIGN_TOKENS.spacing.s} ${AWACS_DESIGN_TOKENS.spacing.m}`,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: AWACS_DESIGN_TOKENS.spacing.s,
                      borderBottom: `1px solid ${AWACS_DESIGN_TOKENS.colors.border}`,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = AWACS_DESIGN_TOKENS.colors.interactiveHover;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                    }}
                  >
                    <Icon name={item.icon || 'search'} size="small" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: AWACS_DESIGN_TOKENS.colors.textPrimary }}>
                        {item.text}
                      </div>
                      <div style={{ fontSize: AWACS_DESIGN_TOKENS.typography.fontSizeXs, color: AWACS_DESIGN_TOKENS.colors.textSecondary }}>
                        {item.description}
                      </div>
                    </div>
                    <StatusIndicator type={item.category === 'service' ? 'success' : 'info'}>
                      {item.category}
                    </StatusIndicator>
                  </div>
                ))}
              </div>
            ))}
          </SpaceBetween>
        </Box>
      )}
    </div>
  );
}
