"use client";

import React from 'react';
import Badge from '../ui/Badge';

// Support both Firebase and UI status types
type Status = 'setup' | 'group_stage' | 'knockout' | 'completed' |
              'upcoming' | 'active' |
              'scheduled' | 'live' | 'postponed';

interface StatusBadgeProps {
  status: Status;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<Status, {
  variant: 'default' | 'success' | 'warning' | 'danger' | 'info';
  label: string;
}> = {
  // Firebase Tournament statuses
  setup: { variant: 'info', label: 'Setup' },
  group_stage: { variant: 'success', label: 'Groups' },
  knockout: { variant: 'warning', label: 'Knockout' },
  completed: { variant: 'default', label: 'Completed' },

  // Legacy Tournament statuses (for compatibility)
  upcoming: { variant: 'info', label: 'Upcoming' },
  active: { variant: 'success', label: 'Active' },

  // Match statuses
  scheduled: { variant: 'info', label: 'Scheduled' },
  live: { variant: 'danger', label: 'Live' },
  postponed: { variant: 'warning', label: 'Postponed' },
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant={config.variant}
      glow={status === 'group_stage' || status === 'knockout' || status === 'active' || status === 'live'}
    >
      {config.label}
    </Badge>
  );
}
