"use client";

import React from "react";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Link from "@cloudscape-design/components/link";
import { useRouter } from 'next/navigation';
import { AwsServiceHeader } from '@/components/ui/AwsServiceHeader';
import { SERVICE_ICONS } from '@/constants/service-icons';

export default function BedrockAgentCorePage() {

  const router = useRouter();  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="Amazon Bedrock AgentCore"
          serviceIcon={SERVICE_ICONS["/bedrock-agentcore"]?.small}
          counter={0}
          primaryAction=<button type="button" className="aws-service-page__create" onClick={() => router.push("/bedrock-agentcore/create")}>
            Create agent
        </button>

        />
        <Container>
          <Box>
            AgentCore extends Bedrock Agents with advanced runtime capabilities. Manage your agents
            via <Link href="/bedrock-agent">Bedrock Agents</Link>.
          </Box>
        </Container>
      </SpaceBetween>
    </div>
  );
}
