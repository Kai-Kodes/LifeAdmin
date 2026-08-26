import { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Calendar,
  AlertTriangle,
  Clock,
  Edit3,
  Trash2,
  Paperclip,
  Eye,
  X,
  ImageIcon,
} from 'lucide-react';
import DeleteConfirmation from './DeleteConfirmation';
import { api } from '../services/api';
import type { BillItem } from '../types/bill';

interface BillCardProps {
  bill: BillItem;
  onTogglePaid: (id: string) => void;
  onEdit: (bill: BillItem) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatAmount(amount: number | null, currency: string): string {
  if (amount === null || amount === undefined) return '';
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

export default function BillCard({
  bill,
  onTogglePaid,
  onEdit,
  onDelete,
  isDeleting,
}: BillCardProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);

  const attachmentUrl = bill.attachment
    ? api.getAttachmentUrl(bill.attachment.id)
    : null;

  const handleViewAttachment = () => {
    if (!bill.attachment || !attachmentUrl) return;
    const isImg = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(
      bill.attachment.extension?.toLowerCase() || ''
    );
    if (isImg) {
      setShowImagePreview(true);
    } else {
      window.open(attachmentUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const getStatusBadge = () => {
    if (bill.is_paid) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800 px-2.5 py-0.5 text-xs font-semibold">
          <CheckCircle2 size={13} />
          Paid
        </span>
      );
    }

    const formattedDueDate = formatDate(bill.due_date);

    switch (bill.computed_status) {
      case 'overdue':
        return (
          <span className="inline-flex flex-wrap items-center gap-1.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800 px-2.5 py-0.5 text-xs font-medium">
            <Clock size={13} />
            <span>Pay by: {formattedDueDate}</span>
            <span className="opacity-60">•</span>
            <span className="font-semibold">{bill.status_label}</span>
          </span>
        );
      case 'due_today':
      case 'due_soon':
        return (
          <span className="inline-flex flex-wrap items-center gap-1.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800 px-2.5 py-0.5 text-xs font-medium">
            <AlertTriangle size={13} />
            <span>Pay by: {formattedDueDate}</span>
            <span className="opacity-60">•</span>
            <span className="font-semibold">{bill.status_label}</span>
          </span>
        );
      case 'upcoming':
      default:
        return (
          <span className="inline-flex flex-wrap items-center gap-1.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-300 dark:bg-indigo-950/80 dark:text-indigo-300 dark:border-indigo-800 px-2.5 py-0.5 text-xs font-medium">
            <Calendar size={13} />
            <span>Pay by: {formattedDueDate}</span>
            <span className="opacity-60">•</span>
            <span>{bill.status_label}</span>
          </span>
        );
    }
  };

  return (
    <>
      <div
        className={`group relative flex flex-col justify-between rounded-2xl border bg-white dark:bg-surface-950 p-5 shadow-xs transition-all hover:shadow-md
          ${
            bill.is_paid
              ? 'border-surface-200 dark:border-surface-800 opacity-80'
              : bill.computed_status === 'overdue'
              ? 'border-danger-300 dark:border-danger-800/80 bg-danger-50/20 dark:bg-danger-950/20'
              : 'border-surface-200 dark:border-surface-800 hover:border-surface-300 dark:hover:border-surface-700'
          }`}
      >
        <div>
          {/* Top Row: Checkbox Toggle & Full Bill Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => onTogglePaid(bill.id)}
              title={bill.is_paid ? 'Mark as Unpaid' : 'Mark as Paid'}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-transform active:scale-95"
            >
              {bill.is_paid ? (
                <CheckCircle2 size={24} className="text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Circle size={24} className="text-surface-300 dark:text-surface-600 hover:text-primary-500" />
              )}
            </button>

            <h3
              className={`text-base font-bold text-surface-900 dark:text-white truncate min-w-0 ${
                bill.is_paid ? 'line-through text-surface-500 dark:text-surface-400' : ''
              }`}
              title={bill.name}
            >
              {bill.name}
            </h3>
          </div>

          {/* Line 2: Due Date Badge */}
          <div className="mt-2.5 pl-10 flex items-center">
            {getStatusBadge()}
          </div>

          {/* Notes */}
          {bill.notes && (
            <p className="mt-2.5 text-xs text-surface-500 dark:text-surface-400 line-clamp-2 pl-10">
              {bill.notes}
            </p>
          )}

          {/* Attachment */}
          {bill.attachment && (
            <div className="mt-2.5 pl-10 flex items-center gap-2">
              <button
                onClick={handleViewAttachment}
                className="inline-flex items-center gap-1.5 rounded-lg bg-surface-100 dark:bg-surface-800 px-2.5 py-1 text-xs font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
              >
                <Paperclip size={13} className="text-primary-600 dark:text-primary-400" />
                <span className="truncate max-w-[180px]">
                  {bill.attachment.filename}
                </span>
                <Eye size={12} className="ml-0.5 opacity-60" />
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions: Mark Paid on left, Amount above Edit/Delete on right */}
        <div className="mt-4 pt-3 border-t border-surface-100 dark:border-surface-800 flex items-end justify-between gap-3">
          <button
            onClick={() => onTogglePaid(bill.id)}
            className={`text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors cursor-pointer ${
              bill.is_paid
                ? 'bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:text-white dark:hover:bg-emerald-500 shadow-xs'
            }`}
          >
            {bill.is_paid ? 'Mark Unpaid' : 'Mark Paid'}
          </button>

          <div className="flex flex-col items-end gap-1">
            {bill.amount !== null && (
              <span className="text-sm font-extrabold text-surface-900 dark:text-white tracking-tight">
                {formatAmount(bill.amount, bill.currency)}
              </span>
            )}
            <div className="flex items-center gap-1">
              <button
                onClick={() => onEdit(bill)}
                title="Edit bill details"
                className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-700 dark:hover:text-surface-200 transition-colors"
              >
                <Edit3 size={15} />
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                title="Delete bill"
                className="rounded-lg p-1.5 text-surface-400 hover:bg-danger-50 dark:hover:bg-danger-950/60 hover:text-danger-600 transition-colors"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Attachment Image Lightbox */}
      {showImagePreview && attachmentUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-2xl bg-white dark:bg-surface-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-surface-100 dark:border-surface-800 px-4 py-3 bg-white dark:bg-surface-950">
              <div className="flex items-center gap-2 min-w-0">
                <ImageIcon size={18} className="text-primary-600 dark:text-primary-400 shrink-0" />
                <span className="font-semibold text-sm text-surface-900 dark:text-white truncate">
                  {bill.attachment?.filename || bill.name}
                </span>
              </div>
              <button
                onClick={() => setShowImagePreview(false)}
                className="rounded-lg p-1 text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 overflow-auto flex items-center justify-center max-h-[80vh]">
              <img
                src={attachmentUrl}
                alt={bill.name}
                className="max-h-[75vh] max-w-full rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteConfirmation
          title={bill.name}
          itemType="bill"
          onConfirm={() => {
            onDelete(bill.id);
            setShowDeleteModal(false);
          }}
          onCancel={() => setShowDeleteModal(false)}
          isDeleting={isDeleting || false}
        />
      )}
    </>
  );
}
