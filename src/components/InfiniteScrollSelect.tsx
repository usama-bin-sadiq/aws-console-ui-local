"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import Select, { SelectProps } from "@cloudscape-design/components/select";
import TextFilter from "@cloudscape-design/components/text-filter";

const PAGE_SIZE = 50;

interface InfiniteScrollSelectProps {
  items: SelectProps.Option[];
  selectedOption: SelectProps.Option | null;
  onChange?: (event: { detail: SelectProps.ChangeDetail }) => void;
  placeholder?: string;
  filteringPlaceholder?: string;
}

export default function InfiniteScrollSelect({
  items,
  selectedOption,
  onChange,
  placeholder = "Choose an option",
  filteringPlaceholder = "Filter options...",
}: InfiniteScrollSelectProps) {
  const [filteringText, setFilteringText] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filteredItems = useMemo(() => {
    if (!filteringText.trim()) return items;
    const lower = filteringText.toLowerCase();
    return items.filter(
      (item) =>
        item.label?.toLowerCase().includes(lower) ||
        item.value?.toLowerCase().includes(lower) ||
        item.description?.toLowerCase().includes(lower)
    );
  }, [items, filteringText]);

  const visibleItems = useMemo(
    () => filteredItems.slice(0, visibleCount),
    [filteredItems, visibleCount]
  );

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filteringText]);

  const handleLoadItems = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredItems.length));
  }, [filteredItems.length]);

  return (
    <div>
      <TextFilter
        filteringText={filteringText}
        filteringPlaceholder={filteringPlaceholder}
        onChange={({ detail }) => {
          setFilteringText(detail.filteringText);
          setVisibleCount(PAGE_SIZE);
        }}
      />
      <Select
        selectedOption={selectedOption}
        options={visibleItems}
        onChange={onChange}
        placeholder={placeholder}
        onLoadItems={handleLoadItems}
        filteringType="manual"
      />
    </div>
  );
}
