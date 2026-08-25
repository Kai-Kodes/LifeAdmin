import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit3, Trash2, Calendar, Building2, Tag, CreditCard, FileText, StickyNote } from 'lucide-react';
import { useObligation, useUpdateObligation, useDeleteObligation, useUploadAttachment, useDeleteAttachment } from '../hooks/useObligations';
import StatusBadge, { formatDaysRemaining } from '../components/StatusBadge';
import { formatCurrency, formatDate, getCategoryLabel } from '../components/ObligationCard';
import ObligationForm from '../components/ObligationForm';
import DeleteConfirmation from '../components/DeleteConfirmation';
import AttachmentDisplay from '../components/AttachmentDisplay';
import Toast, { type ToastData } from '../components/Toast';
import type { ObligationFormData } from '../types/obligation';

export default function ObligationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: obligation, isLoading, error } = useObligation(id!);
  const updateMutation = useUpdateObligation();
  const deleteMutation = useDeleteObligation();
  const uploadMutation = useUploadAttachment();
  const deleteAttachmentMutation = useDeleteAttachment();

  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [openEditWithAttachment, setOpenEditWithAttachment] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const isFormSubmitting = updateMutation.isPending || uploadMutation.isPending;

  function handleUpdate(data: ObligationFormData, file?: File | null) {
    updateMutation.mutate(
      { id: id!, data },
      {
        onSuccess: () => {
          if (file) {
            // Upload attachment after successful obligation update
            uploadMutation.mutate(
              { obligationId: id!, file },
              {
                onSuccess: () => {
                  setShowEditForm(false);
                  setOpenEditWithAttachment(false);
                  addToast('success', 'Changes saved with attachment');
                },
                onError: (err) => {
                  setShowEditForm(false);
                  setOpenEditWithAttachment(false);
                  addToast('error', `Changes saved but attachment upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
                },
              }
            );
          } else {
            setShowEditForm(false);
            setOpenEditWithAttachment(false);
            addToast('success', 'Changes saved successfully');
          }
        },
        onError: (err) => {
          addToast('error', err instanceof Error ? err.message : 'Could not save changes.');
        },
      }
    );
  }

  function handleDelete() {
    deleteMutation.mutate(id!, {
      onSuccess: () => {
        navigate('/obligations', { replace: true });
      },
      onError: (err) => {
        setShowDeleteConfirm(false);
        addToast('error', err instanceof Error ? err.message : 'This warranty could not be deleted.');
      },
    });
  }

  function handleDeleteAttachment(attachmentId: string) {
    deleteAttachmentMutation.mutate(attachmentId, {
      onSuccess: () => {
        addToast('success', 'Attachment removed');
      },
      onError: (err) => {
        addToast('error', err instanceof Error ? err.message : 'Could not remove attachment.');
      },
    });
  }

  function handleAttachProof() {
    setOpenEditWithAttachment(true);
    setShowEditForm(true);
  }

  if (isLoading) {
    return (
      <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-3xl">
        <div className="h-6 w-24 animate-pulse rounded bg-surface-100 mb-6" />
        <div className="rounded-xl border border-surface-200 bg-white p-6 sm:p-8 space-y-6">
          <div className="h-8 w-64 animate-pulse rounded bg-surface-100" />
          <div className="h-4 w-32 animate-pulse rounded bg-surface-100" />
          <div className="h-px bg-surface-100" />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-20 animate-pulse rounded bg-surface-100" />
                <div className="h-5 w-32 animate-pulse rounded bg-surface-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !obligation) {
    return (
      <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-3xl">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-700 mb-6">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="rounded-xl border border-danger-200 bg-danger-50 p-8 text-center">
          <p className="text-sm text-danger-700">This obligation could not be found.</p>
        </div>
      </div>
    );
  }

  const daysColor =
    obligation.computed_status === 'urgent'
      ? 'text-danger-600'
      : obligation.computed_status === 'expiring_soon'
        ? 'text-warning-600'
        : obligation.computed_status === 'expired'
          ? 'text-surface-500'
          : 'text-success-600';

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-3xl">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-700 mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Card */}
      <div className="rounded-xl border border-surface-200 bg-white">
        {/* Header */}
        <div className="px-6 sm:px-8 py-6 border-b border-surface-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-surface-900 tracking-tight">
                {obligation.title}
              </h1>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <StatusBadge status={obligation.computed_status} daysRemaining={obligation.days_remaining} />
                <span className="text-sm text-surface-500">
                  {getCategoryLabel(obligation.category)}
                  {obligation.provider && ` · ${obligation.provider}`}
                </span>
              </div>
            </div>
          </div>
          <p className={`mt-4 text-lg font-semibold ${daysColor}`}>
            {formatDaysRemaining(obligation.days_remaining)}
          </p>
        </div>

        {/* Details */}
        <div className="px-6 sm:px-8 py-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {obligation.purchase_date && (
              <DetailItem
                icon={<Calendar size={16} />}
                label="Purchase date"
                value={formatDate(obligation.purchase_date)}
              />
            )}
            <DetailItem
              icon={<Calendar size={16} />}
              label="Expiry date"
              value={formatDate(obligation.expiry_date)}
            />
            {obligation.provider && (
              <DetailItem
                icon={<Building2 size={16} />}
                label="Provider"
                value={obligation.provider}
              />
            )}
            <DetailItem
              icon={<Tag size={16} />}
              label="Category"
              value={getCategoryLabel(obligation.category)}
            />
            {obligation.amount && (
              <DetailItem
                icon={<CreditCard size={16} />}
                label="Purchase price"
                value={formatCurrency(obligation.amount, obligation.currency)}
              />
            )}
          </div>

          {obligation.description && (
            <div className="border-t border-surface-100 pt-5">
              <div className="flex items-center gap-2 text-sm text-surface-500 mb-1.5">
                <FileText size={16} />
                Description
              </div>
              <p className="text-sm text-surface-700 leading-relaxed">{obligation.description}</p>
            </div>
          )}

          {obligation.notes && (
            <div className="border-t border-surface-100 pt-5">
              <div className="flex items-center gap-2 text-sm text-surface-500 mb-1.5">
                <StickyNote size={16} />
                Notes
              </div>
              <p className="text-sm text-surface-700 leading-relaxed whitespace-pre-wrap">{obligation.notes}</p>
            </div>
          )}

          {/* Attachment section */}
          <AttachmentDisplay
            attachments={obligation.attachments}
            onDelete={handleDeleteAttachment}
            onAttachProof={handleAttachProof}
            isDeleting={deleteAttachmentMutation.isPending}
          />
        </div>

        {/* Actions */}
        <div className="px-6 sm:px-8 py-4 border-t border-surface-100 flex items-center justify-end gap-3">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1.5 rounded-lg border border-surface-200 px-4 py-2.5 text-sm font-medium 
              text-surface-600 hover:bg-danger-50 hover:text-danger-700 hover:border-danger-200 transition-colors"
          >
            <Trash2 size={15} />
            Delete
          </button>
          <button
            onClick={() => { setOpenEditWithAttachment(false); setShowEditForm(true); }}
            className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white 
              hover:bg-primary-700 transition-colors"
          >
            <Edit3 size={15} />
            Edit
          </button>
        </div>
      </div>

      {/* Edit modal */}
      {showEditForm && (
        <ObligationForm
          onSubmit={handleUpdate}
          onClose={() => { setShowEditForm(false); setOpenEditWithAttachment(false); }}
          isSubmitting={isFormSubmitting}
          initialData={obligation}
          mode="edit"
          defaultWantAttachment={openEditWithAttachment}
        />
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <DeleteConfirmation
          title={obligation.title}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          isDeleting={deleteMutation.isPending}
        />
      )}

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-surface-500 mb-1">
        {icon}
        {label}
      </div>
      <p className="text-[15px] font-medium text-surface-900">{value}</p>
    </div>
  );
}
