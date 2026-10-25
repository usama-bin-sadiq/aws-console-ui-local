"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Alert from "@cloudscape-design/components/alert";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import Container from "@cloudscape-design/components/container";
import Grid from "@cloudscape-design/components/grid";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import { apiFetch } from "@/lib/api-client";
import { formatDateTime } from "@/lib/format";
import { CrossServiceLinks, CROSS_SERVICE_LINKS } from "@/components/CrossServiceLinks";
import { MetricTile } from "@/components/MetricTile";
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";

/**
 * Lambda overview.
 *
 * This is the "Get started" landing that the Functions, Layers and Monitoring
 * tabs sit next to. Every number below is read from the running emulator, so an
 * empty account reports zero rather than a placeholder.
 */
interface LambdaFunctionSummary {
  FunctionName?: string;
  Runtime?: string;
  Handler?: string;
  LastModified?: string;
  Description?: string;
}

const SHORTCUTS = [
  {
    href: "/lambda/functions",
    title: "Functions",
    body: "Create, configure, invoke and delete Lambda functions.",
  },
  {
    href: "/lambda/layers",
    title: "Layers",
    body: "Publish and share libraries and custom runtimes.",
  },
  {
    href: "/lambda/monitoring",
    title: "Monitoring",
    body: "Lambda metrics, CloudWatch alarms and execution logs.",
  },
  {
    href: "/lambda/aliases",
    title: "Aliases",
    body: "Point a version at a stable name and shift traffic between them.",
  },
] as const;

const glanceGrid = [{ colspan: 4 }, { colspan: 4 }, { colspan: 4 }];
const shortcutGrid = [{ colspan: 3 }, { colspan: 3 }, { colspan: 3 }, { colspan: 3 }];

export default function LambdaOverviewPage() {
  const [functions, setFunctions] = useState<LambdaFunctionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchFunctions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/lambda");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setFunctions((data.functions || []) as LambdaFunctionSummary[]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch functions");
      setFunctions([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFunctions();
  }, [fetchFunctions]);

  const runtimes = new Set(functions.map((fn) => fn.Runtime).filter(Boolean));
  const recentlyUpdated = [...functions]
    .filter((fn) => Boolean(fn.LastModified))
    .sort((a, b) => (b.LastModified ?? "").localeCompare(a.LastModified ?? ""))
    .slice(0, 5);

  return (
    <SpaceBetween size="l">
      {error && (
        <Alert type="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      <AwsServiceHeader
        serviceName="Lambda"
        serviceIcon={SERVICE_ICONS["/lambda"]?.small}
        counter={functions.length}
        primaryAction={
          <button type="button" className="aws-service-page__create" onClick={() => router.push("/lambda/create")}>
            Create function
          </button>
        }
        actions={
          <SpaceBetween size="s" direction="horizontal">
            <Button onClick={fetchFunctions} loading={loading} loadingText="Loading">
              Refresh
            </Button>
          </SpaceBetween>
        }
      />
        <Box variant="p">
          Lambda runs functions in response to events, on demand, and scales automatically. This
          console is backed by the LocalEmu adapter, so the functions, layers and metrics below come
          from the local emulator rather than an AWS account.
        </Box>

      <Container header={<Header variant="h2">At a glance</Header>}>
        <Grid gridDefinition={glanceGrid}>
          <MetricTile value={loading ? "-" : functions.length} label="Functions" />
          <MetricTile value={loading ? "-" : runtimes.size} label="Runtimes in use" />
          <MetricTile value={loading ? "-" : recentlyUpdated.length} label="Recently updated" />
        </Grid>
      </Container>

      <Container header={<Header variant="h2">Where to go next</Header>}>
        <Grid gridDefinition={shortcutGrid}>
          {SHORTCUTS.map((shortcut) => (
            <Link key={shortcut.href} href={shortcut.href}>
              <Box variant="div">
                <Box variant="h4" color="text-status-inactive">
                  {shortcut.title}
                </Box>
                <Box variant="small" color="text-body-secondary">
                  {shortcut.body}
                </Box>
              </Box>
            </Link>
          ))}
        </Grid>
      </Container>

      {recentlyUpdated.length > 0 && (
        <Container
          header={
            <Header
              variant="h2"
              description="Most recently modified functions"
              actions={
                <Button href="/lambda/functions" variant="link">
                  View all
                </Button>
              }
            >
              Recently updated
            </Header>
          }
        >
          <SpaceBetween size="s">
            {recentlyUpdated.map((fn) => (
              // The name and its metadata must stack: `awsui-key-label` renders
              // inline, which read as "order-processorpython3.12" in a screenshot.
              <div key={fn.FunctionName} className="aws-summary-row">
                <Link href={`/lambda/${encodeURIComponent(fn.FunctionName ?? "")}`}>
                  {fn.FunctionName}
                </Link>
                <Box variant="small" color="text-body-secondary">
                  {[fn.Runtime, fn.Handler, `updated ${formatDateTime(fn.LastModified)}`]
                    .filter(Boolean)
                    .join(" · ")}
                </Box>
              </div>
            ))}
          </SpaceBetween>
        </Container>
      )}

      <CrossServiceLinks links={CROSS_SERVICE_LINKS["/lambda"] || []} />
    </SpaceBetween>
  );
}
