import { useState } from 'react';
import { FileText, Image as ImageIcon, Eye, Edit3, RefreshCw, Trash2, Calendar, AlertTriangle, Clock, X } from 'lucide-react';
import DeleteConfirmation from './DeleteConfirmation';
import { api } from '../services/api';
import type { DocumentItem } from '../types/document';

interface DocumentCardProps {
  document: DocumentItem;
  onEdit: (doc: DocumentItem) => void;
  onReplaceFile: (doc: DocumentItem, file: File) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export default function DocumentCard({
  document: doc,
  onEdit,
  onReplaceFile,
  onDelete,
  isDeleting,
}: DocumentCardProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);

  const downloadUrl = api.getDocumentDownloadUrl(doc.id);

  const handleView = () => {
    if (doc.is_image) {
      setShowImagePreview(true);
    } else {
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleFileReplacement = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onReplaceFile(doc, selectedFile);
    }
  };

  // Badge styling for renewal status
  const getRenewalBadge = () => {
    if (!doc.renewal_date || !doc.renewal_status_label) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-surface-100 px-2.5 py-0.5 text-xs font-medium text-surface-500">
          No renewal date
        </span>
      );
    }

    const formattedDate = formatDate(doc.renewal_date);

    switch (doc.computed_status) {
      case 'expired':
        return (
          <span className="inline-flex flex-wrap items-center gap-1.5 rounded-full bg-danger-50 px-2.5 py-0.5 text-xs font-medium text-danger-700 border border-danger-200">
            <Clock size={12} />
            <span>{formattedDate}</span>
            <span className="opacity-60">•</span>
            <span>{doc.renewal_status_label}</span>
          </span>
        );
      case 'urgent':
        return (
          <span className="inline-flex flex-wrap items-center gap-1.5 rounded-full bg-warning-50 px-2.5 py-0.5 text-xs font-medium text-warning-800 border border-warning-200">
            <AlertTriangle size={12} />
            <span>{formattedDate}</span>
            <span className="opacity-60">•</span>
            <span>{doc.renewal_status_label}</span>
          </span>
        );
      case 'expiring_soon':
        return (
          <span className="inline-flex flex-wrap items-center gap-1.5 rounded-full bg-warning-50 px-2.5 py-0.5 text-xs font-medium text-warning-700 border border-warning-200">
            <Calendar size={12} />
            <span>{formattedDate}</span>
            <span className="opacity-60">•</span>
            <span>{doc.renewal_status_label}</span>
          </span>
        );
      case 'active':
      default:
        return (
          <span className="inline-flex flex-wrap items-center gap-1.5 rounded-full bg-success-50 px-2.5 py-0.5 text-xs font-medium text-success-700 border border-success-200">
            <Calendar size={12} />
            <span>{formattedDate}</span>
            <span className="opacity-60">•</span>
            <span>{doc.renewal_status_label}</span>
          </span>
        );
    }
  };

  return (
    <>
      <div className="group rounded-2xl border border-surface-200 bg-white p-5 shadow-xs transition-all hover:border-surface-300 hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          {/* File Icon & Info */}
          <div className="flex items-start gap-3.5 min-w-0">
            <div className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              doc.is_image ? 'bg-primary-50 text-primary-600' : 'bg-danger-50 text-danger-600'
            }`}>
              {doc.is_image ? <ImageIcon size={22} /> : <FileText size={22} />}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-surface-900 truncate" title={doc.name}>
                {doc.name}
              </h3>
              <p className="mt-0.5 text-xs text-surface-500 truncate" title={doc.original_filename}>
                {doc.original_filename} · {doc.formatted_file_size}
              </p>
              <div className="mt-2.5">
                {getRenewalBadge()}
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-4 pt-3.5 border-t border-surface-100 flex items-center justify-between gap-2">
          <button
            onClick={handleView}
            className="flex items-center gap-1.5 rounded-lg bg-surface-100 px-3 py-1.5 text-xs font-medium text-surface-700 
              hover:bg-surface-200 transition-colors"
          >
            <Eye size={14} />
            View
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(doc)}
              title="Edit document name and renewal date"
              className="rounded-lg p-1.5 text-surface-500 hover:bg-surface-100 hover:text-surface-800 transition-colors"
            >
              <Edit3 size={15} />
            </button>

            {/* Replace File Button & Hidden Input */}
            <label
              title="Replace document file"
              className="rounded-lg p-1.5 text-surface-500 hover:bg-surface-100 hover:text-surface-800 cursor-pointer transition-colors"
            >
              <RefreshCw size={15} />
              <input
                type="file"
                accept="application/pdf,image/*"
                onChange={handleFileReplacement}
                className="hidden"
              />
            </label>

            <button
              onClick={() => setShowDeleteModal(true)}
              title="Delete document"
              className="rounded-lg p-1.5 text-surface-400 hover:bg-danger-50 hover:text-danger-600 transition-colors"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {showImagePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-surface-100 px-4 py-3 bg-white">
              <div className="flex items-center gap-2 min-w-0">
                <ImageIcon size={18} className="text-primary-600 shrink-0" />
                <span className="font-semibold text-sm text-surface-900 truncate">{doc.name}</span>
              </div>
              <button
                onClick={() => setShowImagePreview(false)}
                className="rounded-lg p-1 text-surface-400 hover:bg-surface-100 hover:text-surface-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 overflow-auto flex items-center justify-center max-h-[80vh]">
              <img
                src={downloadUrl}
                alt={doc.name}
                className="max-h-[75vh] max-w-full rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteConfirmation
          title={doc.name}
          itemType="document"
          onConfirm={() => {
            onDelete(doc.id);
            setShowDeleteModal(false);
          }}
          onCancel={() => setShowDeleteModal(false)}
          isDeleting={isDeleting}
        />
      )}
    </>
  );
}
