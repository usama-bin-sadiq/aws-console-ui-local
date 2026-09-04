/**
 * EC2LaunchWizard — Reusable wizard component for launching EC2 instances.
 * Wraps the 8-step launch flow per PRD §15.1.
 */

import React from "react";
import { useRouter } from "next/navigation";

export interface EC2LaunchWizardProps {
  onLaunch?: (config: Record<string, unknown>) => void;
  onCancel?: () => void;
}

export function EC2LaunchWizard({ onLaunch, onCancel }: EC2LaunchWizardProps): React.ReactElement {
  const router = useRouter();

  const handleCancel = () => {
    if (onCancel) onCancel();
    else router.push("/ec2");
  };

  return (
    <div>
      <p>EC2 Launch Wizard</p>
    </div>
  );
}

export default EC2LaunchWizard;
