"use client";

import { useEffect, useState } from "react";
import { ResourceIcon } from "@/components/ui/ResourceIcon";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import Cards from "@cloudscape-design/components/cards";
import Grid from "@cloudscape-design/components/grid";
import Box from "@cloudscape-design/components/box";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Link from "@cloudscape-design/components/link";
import {
  AdapterStatus,
  EmulatorHealthStatus,
  findServiceCompatibility,
  getServiceAvailability,
  SERVICE_REGISTRY,
  toAdapterMode,
} from "@/constants/service-compatibility";
import { useSettingsStore } from "@/stores/settings";

interface Service {
  name: string;
  description: string;
  href: string;
  icon: string;
  category: string;
}

const ALL_SERVICES: Service[] = [
  {
    name: "Amazon S3",
    description: "Scalable object storage",
    href: "/s3",
    icon: "folder",
    category: "Storage",
  },
  {
    name: "EBS Volumes",
    description: "Block storage volumes",
    href: "/volume",
    icon: "folder",
    category: "Storage",
  },
  {
    name: "EBS Snapshots",
    description: "Volume snapshots",
    href: "/snapshot",
    icon: "folder",
    category: "Storage",
  },
  {
    name: "EFS",
    description: "Elastic file system",
    href: "/efs",
    icon: "folder",
    category: "Storage",
  },
  {
    name: "Backup",
    description: "Centralized backup",
    href: "/backup",
    icon: "folder",
    category: "Storage",
  },

  {
    name: "Amazon EC2",
    description: "Virtual servers",
    href: "/ec2",
    icon: "status-positive",
    category: "Compute",
  },
  {
    name: "AWS Lambda",
    description: "Serverless compute",
    href: "/lambda",
    icon: "status-positive",
    category: "Compute",
  },
  {
    name: "ECS Clusters",
    description: "Container orchestration",
    href: "/ecs-cluster",
    icon: "status-positive",
    category: "Compute",
  },
  {
    name: "EKS Clusters",
    description: "Kubernetes service",
    href: "/eks-cluster",
    icon: "status-positive",
    category: "Compute",
  },

  {
    name: "Amazon DynamoDB",
    description: "NoSQL database",
    href: "/dynamodb",
    icon: "status-info",
    category: "Database",
  },
  {
    name: "Amazon RDS",
    description: "Relational database",
    href: "/rds",
    icon: "status-info",
    category: "Database",
  },
  {
    name: "ElastiCache",
    description: "In-memory caching",
    href: "/elasticache",
    icon: "status-info",
    category: "Database",
  },

  {
    name: "Amazon VPC",
    description: "Virtual private cloud",
    href: "/vpc",
    icon: "status-positive",
    category: "Networking",
  },
  {
    name: "Route 53",
    description: "DNS and domain names",
    href: "/route53",
    icon: "status-positive",
    category: "Networking",
  },
  {
    name: "CloudFront",
    description: "Content delivery network",
    href: "/cloudfront",
    icon: "status-positive",
    category: "Networking",
  },

  {
    name: "AWS IAM",
    description: "Identity & access",
    href: "/iam",
    icon: "user-profile",
    category: "Security",
  },
  {
    name: "AWS KMS",
    description: "Key management service",
    href: "/kms",
    icon: "unlocked",
    category: "Security",
  },
  {
    name: "Secrets Manager",
    description: "Secrets rotation",
    href: "/secrets-manager",
    icon: "unlocked",
    category: "Security",
  },
  {
    name: "ACM",
    description: "SSL/TLS certificates",
    href: "/acm",
    icon: "unlocked",
    category: "Security",
  },

  {
    name: "Amazon CloudWatch",
    description: "Monitoring",
    href: "/cloudwatch",
    icon: "status-info",
    category: "Monitoring",
  },
  {
    name: "CloudWatch Logs",
    description: "Log management",
    href: "/cloudwatch-logs",
    icon: "status-info",
    category: "Monitoring",
  },
  {
    name: "X-Ray",
    description: "Distributed tracing",
    href: "/x-ray",
    icon: "status-info",
    category: "Monitoring",
  },

  {
    name: "Amazon SQS",
    description: "Message queuing",
    href: "/sqs",
    icon: "envelope",
    category: "Application Integration",
  },
  {
    name: "Amazon SNS",
    description: "Pub/sub messaging",
    href: "/sns",
    icon: "envelope",
    category: "Application Integration",
  },
  {
    name: "Step Functions",
    description: "Workflow orchestration",
    href: "/step-functions",
    icon: "envelope",
    category: "Application Integration",
  },
];

export default function Dashboard() {
  const [provider, setProvider] = useState<string>("checking...");
  const [healthStatus, setHealthStatus] = useState<EmulatorHealthStatus>("checking");
  const [healthServices, setHealthServices] = useState<Record<string, unknown>>({});
  const { favorites: persistedFavorites, addFavorite, removeFavorite } = useSettingsStore();
  const [legacyFavorites, setLegacyFavorites] = useState<string[]>([]);
  const [recentlyVisited, setRecentlyVisited] = useState<Service[]>([]);
  const favorites = Array.from(
    new Set([...persistedFavorites.map((favorite) => favorite.serviceHref), ...legacyFavorites]),
  );

  useEffect(() => {
    const savedFavorites = localStorage.getItem("aws_favorites");
    if (savedFavorites) {
      try {
        const parsed = JSON.parse(savedFavorites);
        if (Array.isArray(parsed)) {
          queueMicrotask(() => {
            setLegacyFavorites(parsed.filter((href): href is string => typeof href === "string"));
          });
        }
      } catch {
        // Ignore errors
      }
    }

    const savedRecent = localStorage.getItem("aws_recently_visited");
    if (savedRecent) {
      try {
        const parsed = JSON.parse(savedRecent);
        const recentHrefs = Array.isArray(parsed)
          ? parsed
              .map((item) => (typeof item === "string" ? item : item?.href))
              .filter((href): href is string => typeof href === "string")
          : [];
        queueMicrotask(() => {
          setRecentlyVisited(
            recentHrefs
              .map((href) => ALL_SERVICES.find((service) => service.href === href))
              .filter((service): service is Service => Boolean(service)),
          );
        });
      } catch {
        // Ignore errors
      }
    }

    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => {
        setProvider(d.provider || "unknown");
        setHealthStatus(
          d.status === "healthy"
            ? "healthy"
            : d.status === "degraded"
              ? "degraded"
              : d.status === "starting"
                ? "starting"
                : "unreachable",
        );
        setHealthServices(d.services || {});
      })
      .catch(() => {
        setProvider("unreachable");
        setHealthStatus("unreachable");
      });
  }, []);

  const toggleFavorite = (serviceHref: string) => {
    const service = ALL_SERVICES.find((item) => item.href === serviceHref);
    const isFavorite = favorites.includes(serviceHref);
    const newFavorites = isFavorite
      ? favorites.filter((favorite) => favorite !== serviceHref)
      : [...favorites, serviceHref];
    setLegacyFavorites(newFavorites);
    localStorage.setItem("aws_favorites", JSON.stringify(newFavorites));

    if (isFavorite) {
      removeFavorite(serviceHref);
    } else {
      addFavorite({
        serviceId: serviceHref,
        serviceName: service?.name || serviceHref,
        serviceHref,
      });
    }
  };

  const activeMode = toAdapterMode(provider);

  // Compute resource summary counts from the service registry
  const counts = SERVICE_REGISTRY.reduce(
    (acc, entry) => {
      const status =
        activeMode === "localstack"
          ? entry.adapterStatusLocalStack
          : activeMode === "ministack"
            ? entry.adapterStatusMinStack
            : AdapterStatus.FULL;
      if (status === AdapterStatus.FULL) acc.full++;
      else if (status === AdapterStatus.PARTIAL) acc.partial++;
      else acc.notSupported++;
      return acc;
    },
    { full: 0, partial: 0, notSupported: 0 },
  );

  const availableServices = ALL_SERVICES.filter((service) => {
    const compatibility = findServiceCompatibility(service.href);
    return (
      compatibility !== undefined &&
      getServiceAvailability(compatibility, activeMode, healthStatus, healthServices).enabled
    );
  });
  const favoriteServices = availableServices.filter((s) => favorites.includes(s.href));
  const categories = [
    "Compute",
    "Storage",
    "Database",
    "Networking",
    "Security",
    "Monitoring",
    "Application Integration",
    "Machine Learning",
    "Mobile & IoT",
    "Customer Engagement",
    "Analytics",
    "Developer Tools",
    "Migration & Transfer",
    "Management & Governance",
    "Cost Management",
    "Business Applications",
    "End User Computing",
    "Containers",
    "IoT",
    "Containers",
  ];

  return (
    <SpaceBetween size="l">
      <Header variant="h1" description="Welcome to your AWS Management Console">
        AWS Management Console
      </Header>

      <Container>
        <Grid gridDefinition={[{ colspan: 6 }, { colspan: 6 }]}>
          <SpaceBetween size="s">
            <Header variant="h2">Service Health</Header>
            <StatusIndicator type={healthStatus === "healthy" ? "success" : "error"}>
              {provider}
            </StatusIndicator>
          </SpaceBetween>
          <SpaceBetween size="s">
            <Header variant="h2">Endpoint</Header>
            <StatusIndicator
              type={
                healthStatus === "healthy"
                  ? "success"
                  : healthStatus === "degraded"
                    ? "warning"
                    : healthStatus === "starting"
                      ? "in-progress"
                      : "info"
              }
            >
              {healthStatus === "healthy"
                ? "Connected to local emulator"
                : healthStatus === "degraded"
                  ? "Connected with limited service support"
                  : healthStatus === "starting"
                    ? "Emulator is starting"
                    : "Waiting for emulator capability data"}
            </StatusIndicator>
          </SpaceBetween>
        </Grid>
      </Container>

      <Container header={<Header variant="h2">Resource Summary</Header>}>
        <Grid gridDefinition={[{ colspan: 4 }, { colspan: 4 }, { colspan: 4 }]}>
          <SpaceBetween size="s">
            <Header variant="h3">Full Support</Header>
            <Box variant="p">{counts.full}</Box>
            <Box variant="small" color="text-body-secondary">
              Services with full adapter support
            </Box>
          </SpaceBetween>
          <SpaceBetween size="s">
            <Header variant="h3">Partial Support</Header>
            <Box variant="p">{counts.partial}</Box>
            <Box variant="small" color="text-body-secondary">
              Services with partial adapter support
            </Box>
          </SpaceBetween>
          <SpaceBetween size="s">
            <Header variant="h3">Not Supported</Header>
            <Box variant="p">{counts.notSupported}</Box>
            <Box variant="small" color="text-body-secondary">
              Services without adapter support
            </Box>
          </SpaceBetween>
          <SpaceBetween size="s">
            <Header variant="h3">Total Services</Header>
            <Box variant="p">{counts.full + counts.partial + counts.notSupported}</Box>
            <Box variant="small" color="text-body-secondary">
              Services in the registry
            </Box>
          </SpaceBetween>
        </Grid>
      </Container>

      {favoriteServices.length > 0 && (
        <Container header={<Header variant="h2">Favorites</Header>}>
          <Cards
            cardDefinition={{
              header: (item) => {
                return (
                  <SpaceBetween direction="horizontal" size="xs">
                    <ResourceIcon service={item.href} size="small" />
                    <Link href={item.href}>{item.name}</Link>
                  </SpaceBetween>
                );
              },
              sections: [
                {
                  id: "description",
                  content: (item) => item.description,
                },
                {
                  id: "actions",
                  content: (item) => (
                    <Button
                      iconName="star-filled"
                      variant="icon"
                      onClick={() => toggleFavorite(item.href)}
                      ariaLabel="Remove from favorites"
                    />
                  ),
                },
              ],
            }}
            items={favoriteServices}
            cardsPerRow={[{ cards: 1 }, { minWidth: 500, cards: 2 }, { minWidth: 900, cards: 4 }]}
          />
        </Container>
      )}

      <Container header={<Header variant="h2">Recently visited</Header>}>
        {recentlyVisited.length > 0 ? (
          <Cards
            cardDefinition={{
              header: (item) => {
                return (
                  <SpaceBetween direction="horizontal" size="xs">
                    <ResourceIcon service={item.href} size="small" />
                    <Link href={item.href}>{item.name}</Link>
                  </SpaceBetween>
                );
              },
              sections: [
                {
                  id: "description",
                  content: (item) => item.description,
                },
              ],
            }}
            items={recentlyVisited.slice(0, 5)}
            cardsPerRow={[{ cards: 1 }, { minWidth: 500, cards: 2 }, { minWidth: 900, cards: 5 }]}
          />
        ) : (
          <Box textAlign="center" color="text-body-secondary" padding="l">
            <Box key="recent-empty-title" variant="p">
              No recently visited services
            </Box>
            <Box key="recent-empty-description" variant="small">
              Explore a service to add it to this widget.
            </Box>
            <SpaceBetween key="recent-empty-links" direction="horizontal" size="m">
              {availableServices
                .filter((service) =>
                  ["/iam", "/ec2", "/s3", "/rds", "/lambda"].includes(service.href),
                )
                .map((service) => (
                  <Link key={service.href} href={service.href}>
                    {service.name}
                  </Link>
                ))}
            </SpaceBetween>
          </Box>
        )}
      </Container>

      {categories.map((category) => {
        const categoryServices = availableServices.filter((s) => s.category === category);
        if (categoryServices.length === 0) return null;

        return (
          <Container key={category} header={<Header variant="h2">{category}</Header>}>
            <Cards
              cardDefinition={{
                header: (item) => {
                  return (
                    <SpaceBetween direction="horizontal" size="xs">
                      <ResourceIcon service={item.href} size="small" />
                      <Link href={item.href}>{item.name}</Link>
                    </SpaceBetween>
                  );
                },
                sections: [
                  {
                    id: "description",
                    content: (item) => item.description,
                  },
                  {
                    id: "actions",
                    content: (item) => (
                      <Button
                        iconName={favorites.includes(item.href) ? "star-filled" : "star"}
                        variant="icon"
                        onClick={() => toggleFavorite(item.href)}
                        ariaLabel="Add to favorites"
                      />
                    ),
                  },
                ],
              }}
              items={categoryServices}
              cardsPerRow={[{ cards: 1 }, { minWidth: 500, cards: 2 }, { minWidth: 900, cards: 3 }]}
            />
          </Container>
        );
      })}
    </SpaceBetween>
  );
}
