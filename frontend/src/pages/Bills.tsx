import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Receipt,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
} from 'lucide-react';
import BillCard from '../components/BillCard';
import BillForm from '../components/BillForm';
import {
  useBills,
  useCreateBill,
  useUpdateBill,
  useTogglePaidBill,
  useDeleteBill,
} from '../hooks/useBills';
import type { BillItem, BillFormData } from '../types/bill';

type FilterTab = 'all' | 'unpaid' | 'overdue' | 'paid';

export default function Bills() {
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [sortBy, setSortBy] = useState('due_date');

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBill, setEditingBill] = useState<BillItem | null>(null);

  // Queries & Mutations
  const { data: bills, isLoading, isError } = useBills({ search, sort_by: sortBy });
  const createBillMutation = useCreateBill();
  const updateBillMutation = useUpdateBill();
  const togglePaidMutation = useTogglePaidBill();
  const deleteBillMutation = useDeleteBill();

  // Filter client-side by tab
  const filteredBills = useMemo(() => {
    if (!bills) return [];
    if (filterTab === 'unpaid') {
      return bills.filter((b) => !b.is_paid);
    }
    if (filterTab === 'overdue') {
      return bills.filter((b) => !b.is_paid && b.computed_status === 'overdue');
    }
    if (filterTab === 'paid') {
      return bills.filter((b) => b.is_paid);
    }
    return bills;
  }, [bills, filterTab]);

  // Statistics Summary
  const stats = useMemo(() => {
    if (!bills) return { unpaidCount: 0, unpaidAmount: 0, overdueCount: 0, paidCount: 0 };
    const unpaid = bills.filter((b) => !b.is_paid);
    const unpaidAmount = unpaid.reduce((sum, b) => sum + (b.amount || 0), 0);
    const overdue = unpaid.filter((b) => b.computed_status === 'overdue');
    const paid = bills.filter((b) => b.is_paid);
    return {
      unpaidCount: unpaid.length,
      unpaidAmount,
      overdueCount: overdue.length,
      paidCount: paid.length,
    };
  }, [bills]);

  const handleCreateBill = (data: BillFormData, file?: File) => {
    createBillMutation.mutate(
      { data, file },
      {
        onSuccess: () => {
          setShowAddForm(false);
        },
      }
    );
  };

  const handleUpdateBill = (data: BillFormData) => {
    if (!editingBill) return;
    updateBillMutation.mutate(
      { id: editingBill.id, data },
      {
        onSuccess: () => {
          setEditingBill(null);
        },
      }
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white tracking-tight">
            Bills & Payments
          </h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            Keep track of upcoming bills, payment due dates, and payment proof copies.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white 
            hover:bg-primary-700 active:scale-98 transition-all shadow-xs shrink-0"
        >
          <Plus size={18} />
          Add Bill
        </button>
      </div>

      {/* Summary Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-950 p-4 shadow-xs">
          <div className="flex items-center gap-2.5 text-surface-500 dark:text-surface-400 text-xs font-medium">
            <DollarSign size={16} className="text-primary-600 dark:text-primary-400" />
            Unpaid Total
          </div>
          <p className="mt-2 text-xl font-bold text-surface-900 dark:text-white">
            ₹{stats.unpaidAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-950 p-4 shadow-xs">
          <div className="flex items-center gap-2.5 text-surface-500 dark:text-surface-400 text-xs font-medium">
            <Clock size={16} className="text-warning-600 dark:text-warning-400" />
            Unpaid Bills
          </div>
          <p className="mt-2 text-xl font-bold text-surface-900 dark:text-white">
            {stats.unpaidCount}
          </p>
        </div>

        <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-950 p-4 shadow-xs">
          <div className="flex items-center gap-2.5 text-surface-500 dark:text-surface-400 text-xs font-medium">
            <AlertTriangle size={16} className="text-danger-600 dark:text-danger-400" />
            Overdue
          </div>
          <p className="mt-2 text-xl font-bold text-danger-600 dark:text-danger-400">
            {stats.overdueCount}
          </p>
        </div>

        <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-950 p-4 shadow-xs">
          <div className="flex items-center gap-2.5 text-surface-500 dark:text-surface-400 text-xs font-medium">
            <CheckCircle2 size={16} className="text-success-600 dark:text-success-400" />
            Paid Bills
          </div>
          <p className="mt-2 text-xl font-bold text-surface-900 dark:text-white">
            {stats.paidCount}
          </p>
        </div>
      </div>

      {/* Controls Bar: Search & Filter Tabs & Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bills by name or notes..."
            className="w-full rounded-xl border border-surface-200 dark:border-surface-800 pl-10 pr-4 py-2 text-sm 
              text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-950 
              placeholder:text-surface-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
          />
        </div>

        {/* Filter Tabs & Sort Dropdown */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center rounded-xl bg-surface-100 dark:bg-surface-800 p-1 text-xs font-medium">
            <button
              onClick={() => setFilterTab('all')}
              className={`rounded-lg px-3 py-1.5 transition-colors ${
                filterTab === 'all'
                  ? 'bg-white dark:bg-surface-950 text-surface-900 dark:text-white shadow-xs font-semibold'
                  : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white'
              }`}
            >
              All Bills
            </button>
            <button
              onClick={() => setFilterTab('unpaid')}
              className={`rounded-lg px-3 py-1.5 transition-colors ${
                filterTab === 'unpaid'
                  ? 'bg-white dark:bg-surface-950 text-surface-900 dark:text-white shadow-xs font-semibold'
                  : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white'
              }`}
            >
              Unpaid ({stats.unpaidCount})
            </button>
            <button
              onClick={() => setFilterTab('overdue')}
              className={`rounded-lg px-3 py-1.5 transition-colors ${
                filterTab === 'overdue'
                  ? 'bg-white dark:bg-surface-950 text-danger-600 dark:text-danger-400 shadow-xs font-semibold'
                  : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white'
              }`}
            >
              Overdue ({stats.overdueCount})
            </button>
            <button
              onClick={() => setFilterTab('paid')}
              className={`rounded-lg px-3 py-1.5 transition-colors ${
                filterTab === 'paid'
                  ? 'bg-white dark:bg-surface-950 text-success-700 dark:text-success-300 shadow-xs font-semibold'
                  : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white'
              }`}
            >
              Paid ({stats.paidCount})
            </button>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-950 px-3 py-2 text-xs font-medium 
              text-surface-700 dark:text-surface-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          >
            <option value="due_date">Sort by: Due Date</option>
            <option value="name">Sort by: Name</option>
            <option value="created_at">Sort by: Recently Added</option>
          </select>
        </div>
      </div>

      {/* Main Grid / Content State */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-surface-100 dark:bg-surface-800/50 animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-danger-200 bg-danger-50 dark:bg-danger-950/40 p-6 text-center text-sm text-danger-700 dark:text-danger-300">
          Failed to load bills. Please refresh or try again later.
        </div>
      ) : filteredBills.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-surface-200 dark:border-surface-800 p-12 text-center bg-white dark:bg-surface-950/50">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 mb-4">
            <Receipt size={28} />
          </div>
          <h3 className="text-lg font-bold text-surface-900 dark:text-white">No bills found</h3>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400 max-w-sm">
            {search
              ? 'No bills match your search criteria.'
              : filterTab !== 'all'
              ? `No bills found under '${filterTab}'.`
              : 'Add your electricity, water, internet, or subscription bills to never miss a due date.'}
          </p>
          {!search && filterTab === 'all' && (
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
            >
              <Plus size={16} />
              Add your first bill
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBills.map((bill) => (
            <BillCard
              key={bill.id}
              bill={bill}
              onTogglePaid={(id) => togglePaidMutation.mutate(id)}
              onEdit={(b) => setEditingBill(b)}
              onDelete={(id) => deleteBillMutation.mutate(id)}
              isDeleting={deleteBillMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Add Bill Modal */}
      {showAddForm && (
        <BillForm
          mode="create"
          onSubmit={handleCreateBill}
          onClose={() => setShowAddForm(false)}
          isSubmitting={createBillMutation.isPending}
        />
      )}

      {/* Edit Bill Modal */}
      {editingBill && (
        <BillForm
          mode="edit"
          initialData={editingBill}
          onSubmit={handleUpdateBill}
          onClose={() => setEditingBill(null)}
          isSubmitting={updateBillMutation.isPending}
        />
      )}
    </div>
  );
}
