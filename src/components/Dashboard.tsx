"use client";

import React, { useEffect, useState } from "react";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import Cards from "@cloudscape-design/components/cards";
import Grid from "@cloudscape-design/components/grid";
import Box from "@cloudscape-design/components/box";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Badge from "@cloudscape-design/components/badge";
import Link from "@cloudscape-design/components/link";
import Icon from "@cloudscape-design/components/icon";
import { useRouter } from "next/navigation";

const categories = [
  {
    label: "Storage",
    services: [
      {
        name: "Amazon S3",
        desc: "Scalable object storage",
        href: "/s3",
        status: "available",
      },
      {
        name: "Amazon EBS",
        desc: "Block storage volumes",
        href: "/volume",
        status: "available",
      },
    ],
  },
  {
    label: "Compute",
    services: [
      {
        name: "Amazon EC2",
        desc: "Virtual servers in the cloud",
        href: "/ec2",
        status: "available",
      },
      {
        name: "AWS Lambda",
        desc: "Run code without servers",
        href: "/lambda",
        status: "available",
      },
      {
        name: "Amazon ECS",
        desc: "Container orchestration",
        href: "/ecs-cluster",
        status: "available",
      },
    ],
  },
  {
    label: "Database",
    services: [
      {
        name: "Amazon DynamoDB",
        desc: "NoSQL key-value database",
        href: "/dynamodb",
        status: "available",
      },
      {
        name: "Amazon RDS",
        desc: "Managed relational databases",
        href: "/rds",
        status: "available",
      },
      {
        name: "Amazon ElastiCache",
        desc: "In-memory caching",
        href: "/elasticache",
        status: "available",
      },
    ],
  },
  {
    label: "Networking",
    services: [
      {
        name: "Amazon VPC",
        desc: "Virtual private cloud",
        href: "/vpc",
        status: "available",
      },
      {
        name: "Route 53",
        desc: "DNS and domain names",
        href: "/route53",
        status: "available",
      },
    ],
  },
  {
    label: "Security",
    services: [
      {
        name: "AWS IAM",
        desc: "Identity and access management",
        href: "/iam",
        status: "available",
      },
      {
        name: "AWS KMS",
        desc: "Key management service",
        href: "/kms",
        status: "available",
      },
      {
        name: "Secrets Manager",
        desc: "Secrets rotation and storage",
        href: "/secrets-manager",
        status: "available",
      },
    ],
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [provider, setProvider] = useState("checking...");
  const [region, setRegion] = useState("us-east-1");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentlyVisited, setRecentlyVisited] = useState<any[]>([]);

  useEffect(() => {
    // Load favorites and recently visited from localStorage
    const savedFavorites = localStorage.getItem("aws_favorites");
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (e) {
        console.error("Failed to parse favorites", e);
      }
    }

    const savedRecent = localStorage.getItem("aws_recently_visited");
    if (savedRecent) {
      try {
        setRecentlyVisited(JSON.parse(savedRecent));
      } catch (e) {
        console.error("Failed to parse recently visited", e);
      }
    }

    // Check provider health
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => {
        setProvider(d.provider || "unknown");
      })
      .catch(() => setProvider("unreachable"));
  }, []);

  const toggleFavorite = (serviceHref: string) => {
    const newFavorites = favorites.includes(serviceHref)
      ? favorites.filter((f) => f !== serviceHref)
      : [...favorites, serviceHref];
    setFavorites(newFavorites);
    localStorage.setItem("aws_favorites", JSON.stringify(newFavorites));
  };

  const favoriteServices = categories
    .flatMap((cat) => cat.services)
    .filter((svc) => favorites.includes(svc.href));

  return (
    <SpaceBetween size="l">
      <Header
        variant="h1"
        description="Manage your AWS resources from a unified console"
      >
        AWS Management Console
      </Header>

      {/* Provider status banner */}
      <Container>
        <Grid gridDefinition={[{ colspan: 8 }, { colspan: 4 }]}>
          <SpaceBetween size="s">
            <Box variant="h2">Service Health</Box>
            <SpaceBetween direction="horizontal" size="m">
              <StatusIndicator
                type={
                  provider === "ministack" || provider === "localstack"
                    ? "success"
                    : "error"
                }
              >
                {provider}
              </StatusIndicator>
              <Badge color="blue">Local Development</Badge>
            </SpaceBetween>
          </SpaceBetween>
          <SpaceBetween size="s">
            <Box variant="h2">Quick Links</Box>
            <SpaceBetween direction="horizontal" size="xs">
              <Link href="/support">Support</Link>
              <Link href="/billing">Billing</Link>
              <Link href="/account">Account</Link>
            </SpaceBetween>
          </SpaceBetween>
        </Grid>
      </Container>

      {/* Favorites section */}
      {favoriteServices.length > 0 && (
        <Container header={<Header variant="h2">Favorites</Header>}>
          <Cards
            cardDefinition={{
              header: (item) => (
                <SpaceBetween direction="horizontal" size="xs" alignItems="center">
                  <Link href={item.href} fontSize="heading-m">
                    {item.name}
                  </Link>
                  <Button
                    iconName="star-filled"
                    variant="icon"
                    onClick={() => toggleFavorite(item.href)}
                  />
                </SpaceBetween>
              ),
              sections: [
                {
                  id: "description",
                  content: (item) => item.desc,
                },
                {
                  id: "status",
                  content: (item) => (
                    <StatusIndicator
                      type={item.status === "available" ? "success" : "pending"}
                    >
                      {item.status === "available" ? "Available" : "Pending"}
                    </StatusIndicator>
                  ),
                },
              ],
            }}
            items={favoriteServices}
            cardsPerRow={[
              { cards: 1 },
              { minWidth: 500, cards: 2 },
              { minWidth: 800, cards: 4 },
            ]}
          />
        </Container>
      )}

      {/* Recently visited */}
      {recentlyVisited.length > 0 && (
        <Container header={<Header variant="h2">Recently visited</Header>}>
          <Cards
            cardDefinition={{
              header: (item) => (
                <Link href={item.href} fontSize="heading-m">
                  {item.name}
                </Link>
              ),
              sections: [
                {
                  id: "description",
                  content: (item) => item.desc,
                },
              ],
            }}
            items={recentlyVisited.slice(0, 5)}
            cardsPerRow={[
              { cards: 1 },
              { minWidth: 500, cards: 2 },
              { minWidth: 800, cards: 4 },
            ]}
          />
        </Container>
      )}

      {/* All services by category */}
      {categories.map((cat) => (
        <Container key={cat.label} header={<Header variant="h2">{cat.label}</Header>}>
          <Cards
            cardDefinition={{
              header: (item) => (
                <SpaceBetween direction="horizontal" size="xs" alignItems="center">
                  <Link href={item.href} fontSize="heading-m">
                    {item.name}
                  </Link>
                  <Button
                    iconName={favorites.includes(item.href) ? "star-filled" : "star"}
                    variant="icon"
                    onClick={() => toggleFavorite(item.href)}
                  />
                </SpaceBetween>
              ),
              sections: [
                {
                  id: "description",
                  content: (item) => item.desc,
                },
                {
                  id: "status",
                  content: (item) => (
                    <StatusIndicator
                      type={item.status === "available" ? "success" : "pending"}
                    >
                      {item.status === "available" ? "Available" : "Pending"}
                    </StatusIndicator>
                  ),
                },
              ],
            }}
            items={cat.services}
            cardsPerRow={[
              { cards: 1 },
              { minWidth: 500, cards: 2 },
              { minWidth: 800, cards: 3 },
            ]}
          />
        </Container>
      ))}
    </SpaceBetween>
  );
}
