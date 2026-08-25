import type { Obligation } from '../types/obligation';

interface StatusBadgeProps {
  status: Obligation['computed_status'];
  daysRemaining: number;
  size?: 'sm' | 'md';
}

const statusConfig = {
  active: {
    label: 'Active',
    bg: 'bg-success-50',
    text: 'text-success-700',
    border: 'border-success-200',
    dot: 'bg-success-500',
  },
  expiring_soon: {
    label: 'Expiring Soon',
    bg: 'bg-warning-50',
    text: 'text-warning-700',
    border: 'border-warning-200',
    dot: 'bg-warning-500',
  },
  urgent: {
    label: 'Urgent',
    bg: 'bg-danger-50',
    text: 'text-danger-700',
    border: 'border-danger-200',
    dot: 'bg-danger-500',
  },
  expired: {
    label: 'Expired',
    bg: 'bg-surface-100',
    text: 'text-surface-600',
    border: 'border-surface-300',
    dot: 'bg-surface-500',
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-surface-100',
    text: 'text-surface-500',
    border: 'border-surface-200',
    dot: 'bg-surface-400',
  },
};

export function formatDaysRemaining(days: number): string {
  if (days > 365) {
    const years = Math.floor(days / 365);
    const remainingMonths = Math.floor((days % 365) / 30);
    if (remainingMonths > 0) {
      return `${years}y ${remainingMonths}m remaining`;
    }
    return `${years} ${years === 1 ? 'year' : 'years'} remaining`;
  }
  if (days > 30) {
    const months = Math.floor(days / 30);
    return `${months} ${months === 1 ? 'month' : 'months'} remaining`;
  }
  if (days > 1) return `${days} days remaining`;
  if (days === 1) return 'Expires tomorrow';
  if (days === 0) return 'Expires today';
  if (days === -1) return 'Expired yesterday';
  return `Expired ${Math.abs(days)} days ago`;
}

export default function StatusBadge({ status, daysRemaining, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.active;
  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-xs'
    : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
