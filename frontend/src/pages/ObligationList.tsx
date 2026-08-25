import { useState, useCallback, useMemo } from 'react';
import { Plus, Search, SlidersHorizontal } from 'lucide-react';
import { useObligations, useCreateObligation } from '../hooks/useObligations';
import ObligationCard from '../components/ObligationCard';
import ObligationForm from '../components/ObligationForm';
import Toast, { type ToastData } from '../components/Toast';
import type { ObligationFormData } from '../types/obligation';
import { Package } from 'lucide-react';

const FILTER_TABS = [
  { key: '', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'expiring_soon', label: 'Expiring Soon' },
  { key: 'expired', label: 'Expired' },
];

const SORT_OPTIONS = [
  { key: 'expiry_date', label: 'Expiry Date' },
  { key: 'name', label: 'Name' },
  { key: 'recently_added', label: 'Recently Added' },
];

export default function ObligationList() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('expiry_date');
  const [showForm, setShowForm] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const queryParams = useMemo(() => ({
    search: search || undefined,
    status: statusFilter || undefined,
    sort_by: sortBy,
  }), [search, statusFilter, sortBy]);

  const { data: obligations, isLoading, error } = useObligations(queryParams);
  const createMutation = useCreateObligation();

  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  function handleCreate(data: ObligationFormData) {
    createMutation.mutate(data, {
      onSuccess: () => {
        setShowForm(false);
        addToast('success', 'Warranty added successfully');
      },
      onError: (err) => {
        addToast('error', err instanceof Error ? err.message : 'Could not save this warranty.');
      },
    });
  }

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-surface-900 tracking-tight">Obligations</h1>
          <p className="mt-0.5 text-sm text-surface-500">
            {obligations ? `${obligations.length} items` : 'Loading...'}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white 
            hover:bg-primary-700 transition-colors self-start sm:self-auto"
        >
          <Plus size={16} />
          Add Warranty
        </button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or provider..."
            className="w-full rounded-lg border border-surface-200 py-2.5 pl-9 pr-4 text-sm text-surface-900 
              placeholder:text-surface-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          />
        </div>

        {/* Sort */}
        <div className="relative">
          <SlidersHorizontal size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="appearance-none rounded-lg border border-surface-200 py-2.5 pl-9 pr-8 text-sm text-surface-700 
              focus:border-primary-500 focus:ring-1 focus:ring-primary-500 bg-white cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors
              ${statusFilter === tab.key
                ? 'bg-surface-900 text-white'
                : 'text-surface-600 hover:bg-surface-100'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-surface-100 border border-surface-200" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-danger-200 bg-danger-50 p-8 text-center">
          <p className="text-sm text-danger-700">Unable to load your obligations. Please try again.</p>
        </div>
      ) : obligations && obligations.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {obligations.map((o) => (
            <ObligationCard key={o.id} obligation={o} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-surface-200 bg-white p-8 sm:p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-surface-100 flex items-center justify-center">
              <Package size={24} className="text-surface-400" />
            </div>
          </div>
          <h3 className="text-base font-semibold text-surface-800">
            {search || statusFilter ? 'No matching obligations' : 'Nothing to keep track of yet.'}
          </h3>
          <p className="mt-1.5 text-sm text-surface-500 max-w-sm mx-auto">
            {search || statusFilter
              ? 'Try adjusting your search or filters.'
              : 'Add your first warranty and LifeAdmin will keep it on your radar.'}
          </p>
          {!search && !statusFilter && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium 
                text-white hover:bg-primary-700 transition-colors"
            >
              <Plus size={16} />
              Add Warranty
            </button>
          )}
        </div>
      )}

      {showForm && (
        <ObligationForm
          onSubmit={handleCreate}
          onClose={() => setShowForm(false)}
          isSubmitting={createMutation.isPending}
        />
      )}

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
