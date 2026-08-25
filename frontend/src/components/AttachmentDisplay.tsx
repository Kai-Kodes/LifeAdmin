import { useState } from 'react';
import { FileText, Image, Eye, Trash2, Paperclip, ExternalLink } from 'lucide-react';
import type { Attachment } from '../types/obligation';
import { api } from '../services/api';

interface AttachmentDisplayProps {
  attachments: Attachment[];
  onDelete: (attachmentId: string) => void;
  onAttachProof: () => void;
  isDeleting: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getMimeLabel(mime: string): string {
  if (mime === 'application/pdf') return 'PDF';
  const map: Record<string, string> = {
    'image/jpeg': 'JPEG', 'image/png': 'PNG', 'image/webp': 'WebP',
    'image/gif': 'GIF', 'image/bmp': 'BMP', 'image/tiff': 'TIFF',
    'image/svg+xml': 'SVG', 'image/heic': 'HEIC', 'image/heif': 'HEIF',
  };
  return map[mime] || mime.split('/')[1]?.toUpperCase() || 'File';
}

export default function AttachmentDisplay({ attachments, onDelete, onAttachProof, isDeleting }: AttachmentDisplayProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const attachment = attachments[0]; // UI supports one attachment for now

  function handleView(att: Attachment) {
    const url = api.getAttachmentUrl(att.id);
    if (att.is_image) {
      setPreviewUrl(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  function handleDeleteConfirm(attachmentId: string) {
    onDelete(attachmentId);
    setShowDeleteConfirm(null);
  }

  return (
    <div className="border-t border-surface-100 pt-5">
      <div className="flex items-center gap-2 text-sm text-surface-500 mb-3">
        <Paperclip size={16} />
        Proof of Purchase
      </div>

      {attachment ? (
        <div className="rounded-lg border border-surface-200 bg-surface-50 overflow-hidden">
          {/* Image preview inline */}
          {attachment.is_image && previewUrl && (
            <div className="relative bg-surface-100">
              <img
                src={previewUrl}
                alt={attachment.original_filename}
                className="w-full max-h-64 object-contain"
                onError={() => setPreviewUrl(null)}
              />
              <button
                onClick={() => setPreviewUrl(null)}
                className="absolute top-2 right-2 rounded-md bg-white/90 backdrop-blur-sm px-2 py-1 text-xs font-medium 
                  text-surface-600 hover:bg-white shadow-sm"
              >
                Close preview
              </button>
            </div>
          )}

          <div className="flex items-center gap-3 px-4 py-3">
            {attachment.mime_type === 'application/pdf' ? (
              <FileText size={20} className="text-danger-600 shrink-0" />
            ) : (
              <Image size={20} className="text-primary-600 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-surface-800 truncate">{attachment.original_filename}</p>
              <p className="text-xs text-surface-500">
                {getMimeLabel(attachment.mime_type)} · {formatFileSize(attachment.file_size)}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => handleView(attachment)}
                className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-primary-600 
                  hover:bg-primary-50 transition-colors"
              >
                {attachment.is_image ? <Eye size={14} /> : <ExternalLink size={14} />}
                <span className="hidden sm:inline">{attachment.is_image ? 'Preview' : 'View'}</span>
              </button>
              <button
                onClick={() => setShowDeleteConfirm(attachment.id)}
                className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-surface-500 
                  hover:bg-danger-50 hover:text-danger-600 transition-colors"
              >
                <Trash2 size={14} />
                <span className="hidden sm:inline">Remove</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-surface-200 bg-surface-50 px-4 py-5 text-center">
          <p className="text-sm text-surface-500">No proof of purchase attached.</p>
          <button
            onClick={onAttachProof}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-surface-200 bg-white px-3 py-1.5 
              text-xs font-medium text-surface-600 hover:bg-surface-100 hover:text-surface-800 transition-colors"
          >
            <Paperclip size={13} />
            Attach Proof
          </button>
        </div>
      )}

      {/* Delete confirmation overlay */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(null)}>
          <div className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-surface-200" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-surface-900">Remove this attachment?</h3>
            <p className="mt-2 text-sm text-surface-500">
              The proof of purchase will be permanently removed.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 rounded-lg border border-surface-200 px-4 py-2.5 text-sm font-medium text-surface-700 
                  hover:bg-surface-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteConfirm(showDeleteConfirm)}
                disabled={isDeleting}
                className="flex-1 rounded-lg bg-danger-600 px-4 py-2.5 text-sm font-medium text-white 
                  hover:bg-danger-700 disabled:opacity-50 transition-colors"
              >
                {isDeleting ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
