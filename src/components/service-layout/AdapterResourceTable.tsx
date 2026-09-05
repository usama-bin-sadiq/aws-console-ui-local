"use client";

import React from "react";
import Header from "@cloudscape-design/components/header";
import Table, { TableProps } from "@cloudscape-design/components/table";
import TextFilter from "@cloudscape-design/components/text-filter";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";

export interface AdapterResourceTableProps<T extends object> {
    readonly resourceName: string;
    readonly items: T[];
    readonly loading: boolean;
    readonly error: string | null;
    readonly filterText: string;
    readonly onFilterChange: (value: string) => void;
    readonly onRefresh: () => void;
    readonly columns: ReadonlyArray<TableProps.ColumnDefinition<T>>;
}

export function AdapterResourceTable<T extends object>({
    resourceName,
    items,
    loading,
    error,
    filterText,
    onFilterChange,
    onRefresh,
    columns,
}: AdapterResourceTableProps<T>): React.ReactElement {
    const filteredItems = filterText.trim()
        ? items.filter((item) => Object.values(item).some((value) => String(value ?? "").toLowerCase().includes(filterText.toLowerCase())))
        : items;

    return (
        <Table
            items={filteredItems}
            columnDefinitions={columns}
            loading={loading}
            loadingText={`Loading ${resourceName.toLowerCase()}`}
            filter={<TextFilter filteringText={filterText} filteringPlaceholder={`Filter ${resourceName.toLowerCase()}`} filteringAriaLabel={`Filter ${resourceName.toLowerCase()}`} onChange={({ detail }) => onFilterChange(detail.filteringText)} countText={filterText ? `${filteredItems.length} matches` : undefined} />}
            header={<Header counter={`(${items.length})`} actions={<Button iconName="refresh" ariaLabel={`Refresh ${resourceName.toLowerCase()}`} onClick={onRefresh} />}>{resourceName}</Header>}
            empty={error ? <Box textAlign="center" padding="l">Unable to load {resourceName.toLowerCase()}.</Box> : <Box textAlign="center" padding="l">No {resourceName.toLowerCase()} found.</Box>}
            ariaLabels={{ selectionGroupLabel: resourceName, allItemsSelectionLabel: "Select all", itemSelectionLabel: (_data, item) => `Select ${String(Object.values(item)[0] ?? resourceName)}` }}
        />
    );
}
