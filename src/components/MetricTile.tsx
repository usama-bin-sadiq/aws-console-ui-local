import Box from "@cloudscape-design/components/box";

/**
 * A labelled number, as AWS shows in the "at a glance" rows of a service
 * dashboard.
 *
 * This exists because the obvious markup is wrong. Cloudscape's
 * `awsui-value-large` Box renders a `<span>` and the `small` Box renders a
 * `<small>`, both inline, so a value and its label end up on the same line as
 * "0Functions" rather than stacked. Making the wrapper a flex column blockifies
 * both children, which is the whole fix.
 */
export function MetricTile({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="aws-metric-tile">
      <Box variant="awsui-value-large" color="text-status-inactive">
        {value}
      </Box>
      <Box variant="small" color="text-label">
        {label}
      </Box>
    </div>
  );
}

export default MetricTile;
