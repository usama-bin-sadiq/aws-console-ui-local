"use client";

import React, { useEffect, useState } from "react";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import Cards from "@cloudscape-design/components/cards";
import Box from "@cloudscape-design/components/box";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Badge from "@cloudscape-design/components/badge";
import Link from "@cloudscape-design/components/link";

const categories = [
  { label: "Storage", services: [
    { name: "Amazon S3", desc: "Scalable object storage", href: "/s3", status: "available" },
    { name: "Amazon EBS", desc: "Block storage volumes", href: "/volume", status: "available" },
  ]},
  { label: "Compute", services: [
    { name: "Amazon EC2", desc: "Virtual servers in the cloud", href: "/ec2", status: "available" },
    { name: "AWS Lambda", desc: "Run code without servers", href: "/lambda", status: "available" },
    { name: "Amazon ECS", desc: "Container orchestration", href: "/ecs-cluster", status: "available" },
  ]},
  { label: "Database", services: [
    { name: "Amazon DynamoDB", desc: "NoSQL key-value database", href: "/dynamodb", status: "available" },
    { name: "Amazon RDS", desc: "Managed relational databases", href: "/rds", status: "available" },
    { name: "Amazon ElastiCache", desc: "In-memory caching", href: "/elasticache", status: "available" },
  ]},
  { label: "Networking", services: [
    { name: "Amazon VPC", desc: "Virtual private cloud", href: "/vpc", status: "available" },
    { name: "Route 53", desc: "DNS and domain names", href: "/route53", status: "available" },
  ]},
  { label: "Security", services: [
    { name: "AWS IAM", desc: "Identity and access management", href: "/iam", status: "available" },
    { name: "AWS KMS", desc: "Key management service", href: "/kms", status: "available" },
    { name: "Secrets Manager", desc: "Secrets rotation and storage", href: "/secrets-manager", status: "available" },
  ]},
];

export default function DashboardPage() {
  const [provider, setProvider] = useState("checking...");
  const [region, setRegion] = useState("us-east-1");

  useEffect(() => {
    fetch("/api/health").then((r) => r.json()).then((d) => setProvider(d.provider || "unknown")).catch(() => setProvider("unreachable"));
  }, []);

  return (
    <div style={{ padding: "20px 24px", background: "#0b0d14", minHeight: "calc(100vh - 52px)", color: "#fff" }}>
      {/* Welcome banner - pixel perfect AWS style */}
      <div style={{ background: "linear-gradient(90deg, #232f3e 0%, #1a2332 100%)", border: "1px solid #3d4755", borderRadius: "6px", padding: "24px", marginBottom: "24px" }}>
        <SpaceBetween size="m" direction="vertical">
          <SpaceBetween direction="horizontal" size="m" alignItems="center">
            <div>
              <Header variant="h2">Welcome to AWS Console</Header>
              <div style={{ color: "#879596", fontSize: "13px" }}>Manage all of your AWS resources from a single unified web interface.</div>
            </div>
            <Badge color="green">Local Stack</Badge>
          </SpaceBetween>
          <div style={{ color: "#879596", fontSize: "12px", borderTop: "1px solid #3d4755", paddingTop: "12px" }}>
            Provider: <StatusIndicator type={provider === "ministack" || provider === "localstack" ? "success" : "error"}>{provider}</StatusIndicator> &nbsp;|&nbsp;
            Endpoint: <code style={{ color: "#00bc7d" }}>http://localhost:4566</code> &nbsp;|&nbsp;
            Region: <strong style={{ color: "#fff" }}>{region}</strong>
          </div>
        </SpaceBetween>
      </div>

      {/* Recently visited services */}
      <div style={{ marginBottom: "24px" }}>
            <Header variant="h3">Recently visited services</Header>
        <SpaceBetween direction="horizontal" size="s">
          {[
            { label: "Amazon S3", href: "/s3", desc: "Object storage" },
            { label: "Amazon DynamoDB", href: "/dynamodb", desc: "NoSQL database" },
            { label: "AWS Lambda", href: "/lambda", desc: "Serverless compute" },
            { label: "Amazon EC2", href: "/ec2", desc: "Virtual servers" },
            { label: "Amazon CloudWatch", href: "/cloudwatch", desc: "Monitoring" },
          ].map((svc) => (
            <Link key={svc.href} href={svc.href} >
              <div style={{ background: "#232f3e", border: "1px solid #3d4755", borderRadius: "4px", padding: "16px 20px", width: 180, transition: "border-color 0.2s" }}>
                <div style={{ fontWeight: 600, fontSize: "15px", color: "#fff", marginBottom: "4px" }}>{svc.label}</div>
                <div style={{ fontSize: "12px", color: "#879596" }}>{svc.desc}</div>
              </div>
            </Link>
          ))}
        </SpaceBetween>
      </div>

      {/* Service categories - matches AWS Console exactly */}
      {categories.map((cat) => (
        <div key={cat.label} style={{ background: "#161e2d", border: "1px solid #2a3544", borderRadius: "6px", marginBottom: "20px", padding: "4px" }}>
        <Container
          header={<Header variant="h2">{cat.label}</Header>}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
            {cat.services.map((svc) => (
              <Link key={svc.href} href={svc.href}>
                <div style={{ background: "#1a2332", border: "1px solid #2a3544", borderRadius: "4px", padding: "16px", minHeight: 80, transition: "transform 0.15s, border-color 0.15s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#4c83f5"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#2a3544"; (e.currentTarget as HTMLElement).style.transform = "none"; }}
                >
                  <SpaceBetween size="s" direction="vertical">
                    <SpaceBetween direction="horizontal" size="xs" alignItems="center">
                      <span style={{ fontWeight: 700, fontSize: "14px", color: "#fff" }}>{svc.name}</span>
                      <StatusIndicator type={svc.status === "available" ? "success" : "pending"}>{svc.status === "available" ? "Available" : "Pending"}</StatusIndicator>
                    </SpaceBetween>
                    <span style={{ fontSize: "12px", color: "#879596" }}>{svc.desc}</span>
                  </SpaceBetween>
                </div>
              </Link>
            ))}
          </div>
        </Container>
        </div>
      ))}
    </div>
  );
}
