/**
 * EC2LoadBalancerDetails — LB details with listeners, targets, health checks.
 */

import React from 'react';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import Tabs from '@cloudscape-design/components/tabs';
import SpaceBetween from '@cloudscape-design/components/space-between';

export interface EC2LoadBalancerDetailsProps {
  readonly lbArn?: string;
}

export function EC2LoadBalancerDetails({ lbArn }: EC2LoadBalancerDetailsProps): React.ReactElement {
  return (
    <SpaceBetween size="l" direction="vertical">
      <Header variant="h1">Load Balancer {lbArn}</Header>
      <Tabs
        tabs={[
          { label: 'Listeners', id: 'listeners', content: <div>Listeners for {lbArn}</div> },
          { label: 'Target Groups', id: 'targets', content: <div>Target groups for {lbArn}</div> },
          { label: 'Health Checks', id: 'health', content: <div>Health checks for {lbArn}</div> },
        ]}
      />
    </SpaceBetween>
  );
}
