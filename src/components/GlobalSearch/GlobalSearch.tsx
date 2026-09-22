/**
 * GlobalSearch — PRD Section 11 (Search & Command Palette)
 * Uses Cloudscape Autosuggest with grouping for resource search, documentation links,
 * quick actions, and keyboard navigation.
 */
import React, { useState, useCallback, useMemo } from 'react';
import Autosuggest from '@cloudscape-design/components/autosuggest';

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

  const handleSearch = useCallback(
    (query: string) => {
      setValue(query);
      onSearch?.(query);
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setResults([]);
    },
    [onSearch]
  );

  const options = useMemo(() => {
    if (!results.length) return [];
    const grouped: { label: string; options: Array<{ value: string; label: string; description?: string }> }[] = [];
    const groups: Record<string, typeof results> = {};
    results.forEach((r) => {
      const key = r.category.toUpperCase();
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });
    Object.entries(groups).forEach(([category, items]) => {
      grouped.push({
        label: category,
        options: items.map((item) => ({
          value: item.id,
          label: item.text,
          description: item.description,
        })),
      });
    });
    return grouped;
  }, [results]);

  return (
    <div style={{ position: 'relative', width }}>
      <Autosuggest
        onChange={({ detail }) => handleSearch(detail.value || '')}
        value={value}
        ariaLabel="Global AWS Console search"
        placeholder={placeholder}
        empty="No results found"
        filteringType="manual"
        options={options}
        onSelect={({ detail }) => {
          const item = results.find((r) => r.id === detail.value);
          if (item) {
            onSelect?.(item);
            setValue('');
          }
        }}
      />
    </div>
  );
}
