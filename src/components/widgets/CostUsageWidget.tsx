"use client";

import React from "react";
import Widget from "./Widget";
import Box from "@cloudscape-design/components/box";
import Link from "@cloudscape-design/components/link";
import SpaceBetween from "@cloudscape-design/components/space-between";
import ProgressBar from "@cloudscape-design/components/progress-bar";

export default function CostUsageWidget({
  widgetId = "cost-usage",
  isCustomizing,
  onResize,
  onRemove,
}: {
  widgetId?: string;
  isCustomizing?: boolean;
  onResize?: (widgetId: string, newSize: "regular" | "extended") => void;
  onRemove?: (widgetId: string) => void;
}) {
  // Mock cost data
  const totalCost = 127.43;
  const budget = 200.0;
  const percentUsed = (totalCost / budget) * 100;

  const topServices = [
    { name: "Amazon EC2", cost: 45.23, percentage: 35 },
    { name: "Amazon S3", cost: 32.10, percentage: 25 },
    { name: "Amazon RDS", cost: 28.50, percentage: 22 },
    { name: "AWS Lambda", cost: 21.60, percentage: 18 },
  ];

  return (
    <Widget
      id="cost-usage"
      widgetId={widgetId}
      title="Cost and usage"
      isCustomizing={isCustomizing}
      onResize={onResize}
      onRemove={onRemove}
      actions={
        <Link fontSize="body-s" href="/billing">
          View details
        </Link>
      }
    >
      <SpaceBetween size="m">
        <Box>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: "8px",
            }}
          >
            <span
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--awsui-color-text-body-default)",
              }}
            >
              Month-to-date costs
            </span>
            <span
              style={{
                fontSize: "24px",
                fontWeight: 700,
                color: "var(--awsui-color-text-heading-default)",
              }}
            >
              ${totalCost.toFixed(2)}
            </span>
          </div>
          <ProgressBar
            value={percentUsed}
            additionalInfo={`${percentUsed.toFixed(1)}% of $${budget.toFixed(2)} budget`}
            status={percentUsed > 80 ? "error" : "success"}
          />
        </Box>

        <Box>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--awsui-color-text-label)",
              marginBottom: "8px",
            }}
          >
            Top services by cost
          </div>
          <SpaceBetween size="xs">
            {topServices.map((service) => (
              <div key={service.name}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "4px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "14px",
                      color: "var(--awsui-color-text-body-default)",
                    }}
                  >
                    {service.name}
                  </span>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "var(--awsui-color-text-body-default)",
                    }}
                  >
                    ${service.cost.toFixed(2)}
                  </span>
                </div>
                <ProgressBar
                  value={service.percentage}
                  additionalInfo=""
                />
              </div>
            ))}
          </SpaceBetween>
        </Box>

        <Box textAlign="center">
          <Link fontSize="body-s" href="/billing">
            Go to Cost Explorer
          </Link>
        </Box>
      </SpaceBetween>
    </Widget>
  );
}
