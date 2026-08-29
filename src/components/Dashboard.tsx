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

interface Service {
  name: string;
  description: string;
  href: string;
  icon: string;
  category: string;
}

const ALL_SERVICES: Service[] = [
  { name: "Amazon S3", description: "Scalable object storage", href: "/s3", icon: "folder", category: "Storage" },
  { name: "EBS Volumes", description: "Block storage volumes", href: "/volume", icon: "folder", category: "Storage" },
  { name: "EBS Snapshots", description: "Volume snapshots", href: "/snapshot", icon: "folder", category: "Storage" },
  { name: "EFS", description: "Elastic file system", href: "/efs", icon: "folder", category: "Storage" },
  { name: "Backup", description: "Centralized backup", href: "/backup", icon: "folder", category: "Storage" },
  
  { name: "Amazon EC2", description: "Virtual servers", href: "/ec2", icon: "status-positive", category: "Compute" },
  { name: "AWS Lambda", description: "Serverless compute", href: "/lambda", icon: "status-positive", category: "Compute" },
  { name: "ECS Clusters", description: "Container orchestration", href: "/ecs-cluster", icon: "status-positive", category: "Compute" },
  { name: "EKS Clusters", description: "Kubernetes service", href: "/eks-cluster", icon: "status-positive", category: "Compute" },
  
  { name: "Amazon DynamoDB", description: "NoSQL database", href: "/dynamodb", icon: "status-info", category: "Database" },
  { name: "Amazon RDS", description: "Relational database", href: "/rds", icon: "status-info", category: "Database" },
  { name: "ElastiCache", description: "In-memory caching", href: "/elasticache", icon: "status-info", category: "Database" },
  
  { name: "Amazon VPC", description: "Virtual private cloud", href: "/vpc", icon: "status-positive", category: "Networking" },
  { name: "Route 53", description: "DNS and domain names", href: "/route53", icon: "status-positive", category: "Networking" },
  { name: "CloudFront", description: "Content delivery network", href: "/cloudfront", icon: "status-positive", category: "Networking" },
  
  { name: "AWS IAM", description: "Identity & access", href: "/iam", icon: "user-profile", category: "Security" },
  { name: "AWS KMS", description: "Key management service", href: "/kms", icon: "unlocked", category: "Security" },
  { name: "Secrets Manager", description: "Secrets rotation", href: "/secrets-manager", icon: "unlocked", category: "Security" },
  { name: "ACM", description: "SSL/TLS certificates", href: "/acm", icon: "unlocked", category: "Security" },
  
  { name: "Amazon CloudWatch", description: "Monitoring", href: "/cloudwatch", icon: "status-info", category: "Monitoring" },
  { name: "CloudWatch Logs", description: "Log management", href: "/cloudwatch-logs", icon: "status-info", category: "Monitoring" },
  { name: "X-Ray", description: "Distributed tracing", href: "/x-ray", icon: "status-info", category: "Monitoring" },
  
  { name: "Amazon SQS", description: "Message queuing", href: "/sqs", icon: "envelope", category: "Application Integration" },
  { name: "Amazon SNS", description: "Pub/sub messaging", href: "/sns", icon: "envelope", category: "Application Integration" },
  { name: "Step Functions", description: "Workflow orchestration", href: "/step-functions", icon: "envelope", category: "Application Integration" },
];

export default function Dashboard() {
  const router = useRouter();
  const [provider, setProvider] = useState<string>("checking...");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentlyVisited, setRecentlyVisited] = useState<Service[]>([]);

  useEffect(() => {
    const savedFavorites = localStorage.getItem("aws_favorites");
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch {
        // Ignore errors
      }
    }

    const savedRecent = localStorage.getItem("aws_recently_visited");
    if (savedRecent) {
      try {
        setRecentlyVisited(JSON.parse(savedRecent));
      } catch {
        // Ignore errors
      }
    }

    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => setProvider(d.provider || "unknown"))
      .catch(() => setProvider("unreachable"));
  }, []);

  const toggleFavorite = (serviceHref: string) => {
    const newFavorites = favorites.includes(serviceHref)
      ? favorites.filter((f) => f !== serviceHref)
      : [...favorites, serviceHref];
    setFavorites(newFavorites);
    localStorage.setItem("aws_favorites", JSON.stringify(newFavorites));
  };

  const favoriteServices = ALL_SERVICES.filter((s) => favorites.includes(s.href));
  const categories = ["Compute", "Storage", "Database", "Networking", "Security", "Monitoring", "Application Integration"];

  return (
    <SpaceBetween size="l">
      <Header variant="h1" description="Welcome to your AWS Management Console">
        AWS Management Console
      </Header>

      <Container>
        <Grid gridDefinition={[{ colspan: 6 }, { colspan: 6 }]}>
          <SpaceBetween size="s">
            <Box variant="h3">Service Health</Box>
            <StatusIndicator
              type={
                provider === "ministack" || provider === "localstack"
                  ? "success"
                  : "error"
              }
            >
              {provider}
            </StatusIndicator>
          </SpaceBetween>
          <SpaceBetween size="s">
            <Box variant="h3">Quick Links</Box>
            <SpaceBetween direction="horizontal" size="xs">
              <Link href="/billing">Billing</Link>
              <Link href="/support">Support</Link>
              <Link href="/account">Account</Link>
            </SpaceBetween>
          </SpaceBetween>
        </Grid>
      </Container>

      {favoriteServices.length > 0 && (
        <Container header={<Header variant="h2">Favorites</Header>}>
          <Cards
            cardDefinition={{
              header: (item) => (
                <SpaceBetween direction="horizontal" size="xs">
                  <Icon name={item.icon as any} />
                  <Link href={item.href}>{item.name}</Link>
                </SpaceBetween>
              ),
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
            cardsPerRow={[
              { cards: 1 },
              { minWidth: 500, cards: 2 },
              { minWidth: 900, cards: 4 },
            ]}
          />
        </Container>
      )}

      {recentlyVisited.length > 0 && (
        <Container header={<Header variant="h2">Recently visited</Header>}>
          <Cards
            cardDefinition={{
              header: (item) => (
                <Link href={item.href}>{item.name}</Link>
              ),
              sections: [
                {
                  id: "description",
                  content: (item) => item.description,
                },
              ],
            }}
            items={recentlyVisited.slice(0, 5)}
            cardsPerRow={[
              { cards: 1 },
              { minWidth: 500, cards: 2 },
              { minWidth: 900, cards: 5 },
            ]}
          />
        </Container>
      )}

      {categories.map((category) => {
        const categoryServices = ALL_SERVICES.filter((s) => s.category === category);
        if (categoryServices.length === 0) return null;
        
        return (
          <Container key={category} header={<Header variant="h2">{category}</Header>}>
            <Cards
              cardDefinition={{
                header: (item) => (
                  <SpaceBetween direction="horizontal" size="xs">
                    <Icon name={item.icon as any} />
                    <Link href={item.href}>{item.name}</Link>
                  </SpaceBetween>
                ),
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
              cardsPerRow={[
                { cards: 1 },
                { minWidth: 500, cards: 2 },
                { minWidth: 900, cards: 3 },
              ]}
            />
          </Container>
        );
      })}
    </SpaceBetween>
  );
}
