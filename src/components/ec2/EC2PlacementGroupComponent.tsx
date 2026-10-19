/**
 * EC2PlacementGroupComponent — Placement group create/manage.
 */

import React, { useState } from "react";
import FormField from "@cloudscape-design/components/form-field";
import Select from "@cloudscape-design/components/select";
import Input from "@cloudscape-design/components/input";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";

export interface EC2PlacementGroupComponentProps {
  readonly onCreate?: (config: { strategy: string; name: string }) => void;
}

export function EC2PlacementGroupComponent({
  onCreate,
}: EC2PlacementGroupComponentProps): React.ReactElement {
  const [strategy, setStrategy] = useState("cluster");
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);

  const handleCreate = () => {
    if (!name.trim()) {
      setNameError("Placement group name is required");
      return;
    }
    setNameError(null);
    onCreate?.({ strategy, name });
  };

  return (
    <SpaceBetween size="m" direction="vertical">
      <FormField label="Strategy">
        <Select
          selectedOption={{ value: strategy, label: strategy }}
          options={[
            { value: "cluster", label: "Cluster" },
            { value: "spread", label: "Spread" },
            { value: "partition", label: "Partition" },
          ]}
          onChange={({ detail }) => setStrategy(detail.selectedOption?.value || "cluster")}
        />
      </FormField>
      <FormField
        label={
          <>
            Name <span style={{ color: "red" }}>*</span>
          </>
        }
        constraintText="Required"
        errorText={nameError}
      >
        <Input
          value={name}
          onChange={({ detail }) => {
            setName(detail.value);
            setNameError(null);
          }}
          placeholder="my-placement-group"
        />
      </FormField>
      <Button variant="primary" onClick={handleCreate}>
        Create
      </Button>
    </SpaceBetween>
  );
}
