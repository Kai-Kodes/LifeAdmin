import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmationProps {
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

export default function DeleteConfirmation({ title, onConfirm, onCancel, isDeleting }: DeleteConfirmationProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-surface-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-50 mb-4">
            <AlertTriangle size={24} className="text-danger-600" />
          </div>
          <h3 className="text-lg font-semibold text-surface-900">Delete this warranty?</h3>
          <p className="mt-2 text-sm text-surface-500">
            <span className="font-medium text-surface-700">{title}</span> will be permanently removed. This action cannot be undone.
          </p>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-surface-200 px-4 py-2.5 text-sm font-medium text-surface-700 
              hover:bg-surface-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 rounded-lg bg-danger-600 px-4 py-2.5 text-sm font-medium text-white 
              hover:bg-danger-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
