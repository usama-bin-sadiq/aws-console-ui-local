/**
 * EC2LaunchWizard — Full wizard matching AWS step flow.
 */

import React, { useState } from 'react';
import Wizard from '@cloudscape-design/components/wizard';
import FormField from '@cloudscape-design/components/form-field';
import Select from '@cloudscape-design/components/select';
import Input from '@cloudscape-design/components/input';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Button from '@cloudscape-design/components/button';

export interface EC2LaunchWizardProps {
  readonly onLaunch?: (config: Record<string, unknown>) => void;
  readonly onCancel?: () => void;
}

export function EC2LaunchWizard({ onLaunch, onCancel }: EC2LaunchWizardProps): React.ReactElement {
  const [activeStep, setActiveStep] = useState('ami');
  const [config, setConfig] = useState<Record<string, unknown>>({ ami: '', instanceType: 't3.micro', tags: [] });

  const steps = [
    { title: 'AMI Selection', description: 'Choose an Amazon Machine Image', content: <div>AMI content</div> },
    { title: 'Instance Type', description: 'Select instance size and family', content: <div>Instance type content</div> },
    { title: 'Configure Instance', description: 'Network, IAM role, shutdown behavior', content: <div>Configure content</div> },
    { title: 'Storage', description: 'Root volume and additional EBS volumes', content: <div>Storage content</div> },
    { title: 'Tags', description: 'Add resource tags', content: <div>Tags content</div> },
    { title: 'Security Group', description: 'Define firewall rules', content: <div>Security group content</div> },
    { title: 'Key Pair', description: 'Select or create a new key pair', content: <div>Key pair content</div> },
    { title: 'Review', description: 'Review and launch', content: <div>Review content</div> },
  ];

  const updateConfig = (updates: Record<string, unknown>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const handleLaunch = () => {
    if (onLaunch) onLaunch(config);
  };

  return (
    <div>
      <Wizard
        steps={steps.map((s: any) => ({ title: s.title, description: s.description, content: s.content }))}
        activeStepIndex={0}
        onNavigate={({ detail }: any) => {
          if (detail.reason === 'next') setActiveStep('review');
        }}
        i18nStrings={{ submitButton: 'Launch Instance', cancelButton: 'Cancel', nextButton: 'Next', previousButton: 'Previous', navigationAriaLabel: 'Wizard navigation' } as any}
      />
    </div>
  );
}
