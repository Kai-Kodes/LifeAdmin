import { useState, useCallback, useMemo } from 'react';
import { Plus, Search, SlidersHorizontal, FileText, Upload } from 'lucide-react';
import {
  useDocuments,
  useCreateDocument,
  useUpdateDocument,
  useReplaceDocumentFile,
  useDeleteDocument,
} from '../hooks/useDocuments';
import DocumentCard from '../components/DocumentCard';
import DocumentForm from '../components/DocumentForm';
import Toast, { type ToastData } from '../components/Toast';
import type { DocumentItem } from '../types/document';

const FILTER_TABS = [
  { key: '', label: 'All Documents' },
  { key: 'with_renewal', label: 'Has Renewal Date' },
  { key: 'overdue', label: 'Renewal Overdue' },
];

const SORT_OPTIONS = [
  { key: 'created_at', label: 'Recently Added' },
  { key: 'name', label: 'Document Name' },
  { key: 'renewal_date', label: 'Renewal Date' },
];

export default function Documents() {
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocumentItem | null>(null);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const queryParams = useMemo(
    () => ({
      search: search || undefined,
      sort_by: sortBy,
    }),
    [search, sortBy]
  );

  const { data: documents, isLoading, error } = useDocuments(queryParams);

  const createMutation = useCreateDocument();
  const updateMutation = useUpdateDocument();
  const replaceMutation = useReplaceDocumentFile();
  const deleteMutation = useDeleteDocument();

  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Handle document creation
  const handleCreate = (name: string, file: File, renewalDate?: string) => {
    createMutation.mutate(
      { name, file, renewalDate },
      {
        onSuccess: () => {
          setShowCreateModal(false);
          addToast('success', 'Document added successfully');
        },
        onError: (err) => {
          addToast(
            'error',
            err instanceof Error ? err.message : 'Failed to save document. Please try again.'
          );
        },
      }
    );
  };

  // Handle document metadata update
  const handleEdit = (
    id: string,
    name: string,
    renewalDate?: string,
    clearRenewalDate?: boolean
  ) => {
    updateMutation.mutate(
      { id, data: { name, renewal_date: renewalDate, clear_renewal_date: clearRenewalDate } },
      {
        onSuccess: () => {
          setEditingDoc(null);
          addToast('success', 'Document details updated');
        },
        onError: (err) => {
          addToast(
            'error',
            err instanceof Error ? err.message : 'Failed to update document.'
          );
        },
      }
    );
  };

  // Handle replacing file
  const handleReplaceFile = (doc: DocumentItem, file: File) => {
    replaceMutation.mutate(
      { id: doc.id, file },
      {
        onSuccess: () => {
          addToast('success', `File replaced for "${doc.name}"`);
        },
        onError: (err) => {
          addToast(
            'error',
            err instanceof Error ? err.message : 'File replacement failed.'
          );
        },
      }
    );
  };

  // Handle document deletion
  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        addToast('success', 'Document deleted');
      },
      onError: (err) => {
        addToast(
          'error',
          err instanceof Error ? err.message : 'Failed to delete document.'
        );
      },
    });
  };

  // Client-side filtering for tabs
  const filteredDocuments = useMemo(() => {
    if (!documents) return [];
    if (filterTab === 'with_renewal') {
      return documents.filter((d) => Boolean(d.renewal_date));
    }
    if (filterTab === 'overdue') {
      return documents.filter((d) => d.computed_status === 'expired');
    }
    return documents;
  }, [documents, filterTab]);

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-surface-900 tracking-tight">Documents</h1>
          <p className="mt-0.5 text-sm text-surface-500">
            {documents ? `${documents.length} document${documents.length === 1 ? '' : 's'} stored` : 'Loading documents...'}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white 
            hover:bg-primary-700 transition-colors shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} />
          Add Document
        </button>
      </div>

      {/* Search & Sort controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents by name or filename..."
            className="w-full rounded-xl border border-surface-200 py-2.5 pl-10 pr-4 text-sm text-surface-900 
              placeholder:text-surface-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
          />
        </div>

        <div className="relative">
          <SlidersHorizontal size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="appearance-none rounded-xl border border-surface-200 py-2.5 pl-9 pr-8 text-sm text-surface-700 
              focus:border-primary-500 focus:ring-1 focus:ring-primary-500 bg-white cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterTab(tab.key)}
            className={`rounded-xl px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors cursor-pointer
              ${
                filterTab === tab.key
                  ? 'bg-surface-900 text-white'
                  : 'text-surface-600 hover:bg-surface-100'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Document Grid / Empty state / Loading */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-surface-100 border border-surface-200" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-danger-200 bg-danger-50 p-8 text-center">
          <p className="text-sm text-danger-700">Unable to load your documents. Please check backend connection.</p>
        </div>
      ) : filteredDocuments.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDocuments.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onEdit={(d) => setEditingDoc(d)}
              onReplaceFile={handleReplaceFile}
              onDelete={handleDelete}
              isDeleting={deleteMutation.isPending}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-surface-200 bg-white p-8 sm:p-12 text-center shadow-xs">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-2xl bg-surface-100 flex items-center justify-center text-surface-400">
              <FileText size={24} />
            </div>
          </div>
          <h3 className="text-base font-semibold text-surface-800">
            {search || filterTab ? 'No matching documents' : 'No documents added yet'}
          </h3>
          <p className="mt-1.5 text-sm text-surface-500 max-w-sm mx-auto">
            {search || filterTab
              ? 'Try adjusting your search query or filter tab.'
              : 'Store important personal documents like IDs, policies, and contracts with optional renewal reminders.'}
          </p>
          {!search && !filterTab && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium 
                text-white hover:bg-primary-700 transition-colors shadow-xs"
            >
              <Plus size={16} />
              Add Document
            </button>
          )}
        </div>
      )}

      {/* Add Document Modal */}
      {showCreateModal && (
        <DocumentForm
          mode="create"
          onSubmitCreate={handleCreate}
          onClose={() => setShowCreateModal(false)}
          isSubmitting={createMutation.isPending}
        />
      )}

      {/* Edit Document Modal */}
      {editingDoc && (
        <DocumentForm
          mode="edit"
          initialData={editingDoc}
          onSubmitEdit={handleEdit}
          onClose={() => setEditingDoc(null)}
          isSubmitting={updateMutation.isPending}
        />
      )}

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
