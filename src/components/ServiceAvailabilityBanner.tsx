"use client";

import React from 'react';
import Alert from '@cloudscape-design/components/alert';
import Box from '@cloudscape-design/components/box';
import { useServiceAvailability } from '@/hooks/useServiceCompatibility';

interface ServiceAvailabilityBannerProps {
  readonly serviceHref: string;
  readonly fallbackMessage?: string;
}

export const ServiceAvailabilityBanner: React.FC<ServiceAvailabilityBannerProps> = ({
  serviceHref,
  fallbackMessage,
}) => {
  const { available, status, reason, loading } = useServiceAvailability(serviceHref);

  if (loading) {
    return null;
  }

  if (available) {
    return null;
  }

  const displayReason = reason || fallbackMessage || 'This service is not available in the current emulator.';

  return (
    <Alert type="warning" dismissible={false} header="Service not supported">
      <Box margin={{ bottom: 's' }} color="text-body-secondary">
        {displayReason}
      </Box>
    </Alert>
  );
};