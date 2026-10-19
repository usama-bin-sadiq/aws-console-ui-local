"use client";

import React, { useMemo } from "react";
import { AwsConsoleOverlay, type OverlayAnchor } from "@/components/aws-console/AwsConsoleOverlay";
import { AWS_REGIONS, type AWSRegionItem } from "@/constants/regions";

export interface AwsRegionSelectorProps {
  open: boolean;
  onClose: () => void;
  anchor: OverlayAnchor | null;
  selectedRegion: string;
  onSelect: (region: AWSRegionItem) => void;
}

const AREA_LABELS: Record<AWSRegionItem["geographicArea"], string> = {
  "north-america": "North America",
  "south-america": "South America",
  europe: "Europe",
  "asia-pacific": "Asia Pacific",
  "middle-east": "Middle East",
  africa: "Africa",
  china: "China",
};

const AREA_ORDER: AWSRegionItem["geographicArea"][] = [
  "north-america",
  "south-america",
  "europe",
  "asia-pacific",
  "middle-east",
  "africa",
  "china",
];

/**
 * AwsRegionSelector — the AWS region menu: a scrollable dark panel grouped by
 * geography, with the region code in orange on the right of each row and the
 * active region highlighted in orange.
 */
export function AwsRegionSelector({
  open,
  onClose,
  anchor,
  selectedRegion,
  onSelect,
}: AwsRegionSelectorProps) {
  const groups = useMemo(
    () =>
      AREA_ORDER.map((area) => ({
        area,
        regions: AWS_REGIONS.filter((region) => region.geographicArea === area),
      })).filter((group) => group.regions.length > 0),
    [],
  );

  return (
    <AwsConsoleOverlay
      open={open}
      onClose={onClose}
      anchor={anchor}
      id="aws-region-selector"
      width={330}
      align="end"
      className="aws-console-overlay-panel--region"
    >
      <div className="aws-region-selector" role="listbox" aria-label="AWS Regions">
        {groups.map((group, index) => (
          <React.Fragment key={group.area}>
            {index > 0 && <hr className="aws-region-selector__divider" />}
            <div
              className="aws-region-selector__group"
              role="group"
              aria-label={AREA_LABELS[group.area]}
            >
              {group.regions.map((region) => {
                const isSelected = region.value === selectedRegion;
                return (
                  <button
                    key={region.value}
                    type="button"
                    role="option"
                    data-overlay-item
                    aria-selected={isSelected}
                    className={`aws-region-selector__row${isSelected ? " is-selected" : ""}`}
                    onClick={() => {
                      onSelect(region);
                      onClose();
                    }}
                  >
                    <span className="aws-region-selector__name">{region.label}</span>
                    <span className="aws-region-selector__code">{region.value}</span>
                  </button>
                );
              })}
            </div>
          </React.Fragment>
        ))}
      </div>
    </AwsConsoleOverlay>
  );
}
