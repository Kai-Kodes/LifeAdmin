import { useNavigate } from 'react-router-dom';
import type { Obligation } from '../types/obligation';
import StatusBadge, { formatDaysRemaining } from './StatusBadge';

interface ObligationCardProps {
  obligation: Obligation;
}

function formatCurrency(amount: string | null, currency: string): string {
  if (!amount) return '';
  const num = parseFloat(amount);
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    }).format(num);
  } catch {
    return `${currency} ${num.toLocaleString()}`;
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    warranty: 'Warranty',
    subscription: 'Subscription',
    insurance: 'Insurance',
    other: 'Other',
  };
  return labels[category] || category;
}

export { formatCurrency, formatDate, getCategoryLabel };

export default function ObligationCard({ obligation }: ObligationCardProps) {
  const navigate = useNavigate();

  const urgencyBorder =
    obligation.computed_status === 'urgent'
      ? 'border-l-danger-500'
      : obligation.computed_status === 'expiring_soon'
        ? 'border-l-warning-500'
        : obligation.computed_status === 'expired'
          ? 'border-l-surface-400'
          : 'border-l-transparent';

  return (
    <button
      onClick={() => navigate(`/obligations/${obligation.id}`)}
      className={`group w-full text-left rounded-xl border border-surface-200 bg-white p-4 sm:p-5 
        border-l-[3px] ${urgencyBorder}
        hover:border-surface-300 hover:shadow-sm 
        transition-all duration-200 cursor-pointer`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold text-surface-900 group-hover:text-primary-600 transition-colors truncate">
            {obligation.title}
          </h3>
          <div className="mt-1 flex items-center gap-2 text-[13px] text-surface-500">
            {obligation.provider && (
              <>
                <span>{obligation.provider}</span>
                <span className="text-surface-300">·</span>
              </>
            )}
            <span>{getCategoryLabel(obligation.category)}</span>
          </div>
        </div>
        <StatusBadge
          status={obligation.computed_status}
          daysRemaining={obligation.days_remaining}
          size="sm"
        />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-[13px]">
          <span className="text-surface-500">Expires </span>
          <span className="text-surface-700 font-medium">{formatDate(obligation.expiry_date)}</span>
        </div>
        <span
          className={`text-[13px] font-medium ${
            obligation.computed_status === 'urgent'
              ? 'text-danger-600'
              : obligation.computed_status === 'expiring_soon'
                ? 'text-warning-600'
                : obligation.computed_status === 'expired'
                  ? 'text-surface-500'
                  : 'text-surface-600'
          }`}
        >
          {formatDaysRemaining(obligation.days_remaining)}
        </span>
      </div>

      {obligation.amount && (
        <div className="mt-2 text-[13px] text-surface-500">
          {formatCurrency(obligation.amount, obligation.currency)}
        </div>
      )}
    </button>
  );
}
