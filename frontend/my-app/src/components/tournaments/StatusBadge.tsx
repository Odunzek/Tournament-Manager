"use client";

import React from 'react';
import { StatusBadgeProps, TournamentStatus, MatchStatus } from '@/types/tournament';
import Badge from '../ui/Badge';

const statusConfig: Record<TournamentStatus | MatchStatus, {
  variant: 'default' | 'success' | 'warning' | 'danger' | 'info';
  label: string;
}> = {
  // Tournament statuses
  upcoming: { variant: 'info', label: 'Upcoming' },
  active: { variant: 'success', label: 'Active' },
  completed: { variant: 'default', label: 'Completed' },

  // Match statuses
  scheduled: { variant: 'info', label: 'Scheduled' },
  live: { variant: 'danger', label: 'Live' },
  postponed: { variant: 'warning', label: 'Postponed' },
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} glow={status === 'active' || status === 'live'}>
      {config.label}
    </Badge>
  );
}
