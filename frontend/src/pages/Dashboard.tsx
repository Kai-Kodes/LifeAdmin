import { useState, useCallback } from 'react';
import { Activity, AlertTriangle, Clock, Package, Plus } from 'lucide-react';
import { useDashboardStats, useObligations, useCreateObligation, useUploadAttachment } from '../hooks/useObligations';
import StatCard from '../components/StatCard';
import ObligationCard from '../components/ObligationCard';
import ObligationForm from '../components/ObligationForm';
import Toast, { type ToastData } from '../components/Toast';
import type { ObligationFormData } from '../types/obligation';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const [showForm, setShowForm] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: obligations, isLoading: obligationsLoading } = useObligations({ sort_by: 'expiry_date' });
  const createMutation = useCreateObligation();
  const uploadMutation = useUploadAttachment();

  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const isSubmitting = createMutation.isPending || uploadMutation.isPending;

  function handleCreate(data: ObligationFormData, file?: File | null) {
    createMutation.mutate(data, {
      onSuccess: (created) => {
        if (file) {
          uploadMutation.mutate(
            { obligationId: created.id, file },
            {
              onSuccess: () => {
                setShowForm(false);
                addToast('success', 'Warranty added with attachment');
              },
              onError: (err) => {
                setShowForm(false);
                addToast('error', `Warranty added but attachment upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
              },
            }
          );
        } else {
          setShowForm(false);
          addToast('success', 'Warranty added successfully');
        }
      },
      onError: (error) => {
        addToast('error', error instanceof Error ? error.message : 'Could not save this warranty. Please try again.');
      },
    });
  }

  // Filter obligations that need attention (expiring soon, urgent, or expired)
  const needsAttention = obligations?.filter(
    (o) => o.computed_status === 'urgent' || o.computed_status === 'expiring_soon' || o.computed_status === 'expired'
  ).slice(0, 6);

  // Show nearest upcoming if no urgent items
  const upcoming = needsAttention?.length
    ? needsAttention
    : obligations?.filter((o) => o.computed_status === 'active').slice(0, 4);

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-5xl">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-[28px] font-bold text-surface-900 tracking-tight">
          {getGreeting()}.
        </h1>
        <p className="mt-1.5 text-surface-500 text-[15px]">
          Keep track of the things you don't want to forget.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <StatCard
          label="Active"
          value={stats?.active}
          icon={<Activity size={18} />}
          accent="text-success-600"
          loading={statsLoading}
        />
        <StatCard
          label="Expiring Soon"
          value={stats?.expiring_soon}
          icon={<AlertTriangle size={18} />}
          accent="text-warning-600"
          loading={statsLoading}
        />
        <StatCard
          label="Expired"
          value={stats?.expired}
          icon={<Clock size={18} />}
          accent="text-danger-600"
          loading={statsLoading}
        />
        <StatCard
          label="Total Tracked"
          value={stats?.total}
          icon={<Package size={18} />}
          accent="text-primary-600"
          loading={statsLoading}
        />
      </div>

      {/* Needs Attention */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-surface-900">Needs Attention</h2>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-2 text-sm font-medium text-white 
              hover:bg-primary-700 transition-colors"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add Warranty</span>
          </button>
        </div>

        {obligationsLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl bg-surface-100 border border-surface-200" />
            ))}
          </div>
        ) : upcoming && upcoming.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {upcoming.map((o) => (
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
            <h3 className="text-base font-semibold text-surface-800">Nothing to keep track of yet.</h3>
            <p className="mt-1.5 text-sm text-surface-500 max-w-sm mx-auto">
              Add your first warranty and LifeAdmin will keep it on your radar.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium 
                text-white hover:bg-primary-700 transition-colors"
            >
              <Plus size={16} />
              Add Warranty
            </button>
          </div>
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <ObligationForm
          onSubmit={handleCreate}
          onClose={() => setShowForm(false)}
          isSubmitting={isSubmitting}
        />
      )}

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
