import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import FileUpload from './FileUpload';
import type { DocumentItem } from '../types/document';

interface DocumentFormProps {
  mode: 'create' | 'edit';
  initialData?: DocumentItem | null;
  onSubmitCreate?: (name: string, file: File, renewalDate?: string) => void;
  onSubmitEdit?: (id: string, name: string, renewalDate?: string, clearRenewalDate?: boolean) => void;
  onClose: () => void;
  isSubmitting: boolean;
}

export default function DocumentForm({
  mode,
  initialData,
  onSubmitCreate,
  onSubmitEdit,
  onClose,
  isSubmitting,
}: DocumentFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [file, setFile] = useState<File | null>(null);
  const [hasRenewalDate, setHasRenewalDate] = useState(Boolean(initialData?.renewal_date));
  const [renewalDate, setRenewalDate] = useState(initialData?.renewal_date || '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setHasRenewalDate(Boolean(initialData.renewal_date));
      setRenewalDate(initialData.renewal_date || '');
    }
  }, [initialData]);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setHasRenewalDate(checked);
    if (!checked) {
      setRenewalDate('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter a document name');
      return;
    }

    if (mode === 'create') {
      if (!file) {
        setError('Please select a document file to upload');
        return;
      }
      const finalDate = hasRenewalDate && renewalDate ? renewalDate : undefined;
      onSubmitCreate?.(name.trim(), file, finalDate);
    } else if (mode === 'edit' && initialData) {
      const finalDate = hasRenewalDate && renewalDate ? renewalDate : undefined;
      const clearRenewal = !hasRenewalDate && Boolean(initialData.renewal_date);
      onSubmitEdit?.(initialData.id, name.trim(), finalDate, clearRenewal);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/60 p-4 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-surface-950 p-6 shadow-xl sm:p-8 space-y-6 border border-surface-200 dark:border-surface-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-100 dark:border-surface-800 pb-4">
          <h2 className="text-xl font-bold text-surface-900 dark:text-white">
            {mode === 'create' ? 'Add Document' : 'Edit Document Details'}
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1 text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-600 dark:hover:text-surface-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-danger-200 bg-danger-50 dark:bg-danger-950/40 p-3.5 flex items-center gap-2.5 text-sm text-danger-700 dark:text-danger-300">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* File Upload (Required in Create Mode) */}
          {mode === 'create' && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                Document File <span className="text-danger-500">*</span>
              </label>
              <FileUpload
                file={file}
                onFileSelect={(selectedFile) => {
                  setFile(selectedFile);
                  setError(null);
                  // Auto-fill document name from filename if empty
                  if (selectedFile && !name) {
                    const cleanName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
                    setName(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
                  }
                }}
                onFileRemove={() => setFile(null)}
                disabled={isSubmitting}
              />
            </div>
          )}

          {/* Document Name */}
          <div className="space-y-1.5">
            <label htmlFor="doc-name" className="block text-sm font-medium text-surface-700 dark:text-surface-300">
              Document Name <span className="text-danger-500">*</span>
            </label>
            <input
              id="doc-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="e.g. Passport Copy, Car Insurance Policy, Rent Agreement"
              disabled={isSubmitting}
              className="w-full rounded-xl border border-surface-200 dark:border-surface-800 px-4 py-2.5 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-900 
                placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
            />
          </div>

          {/* Renewal Date Checkbox */}
          <div className="pt-2 border-t border-surface-100 dark:border-surface-800 space-y-4">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={hasRenewalDate}
                onChange={handleCheckboxChange}
                disabled={isSubmitting}
                className="h-4 w-4 rounded border-surface-300 dark:border-surface-700 text-primary-600 focus:ring-primary-500 cursor-pointer"
              />
              <span className="text-sm font-medium text-surface-700 dark:text-surface-300 group-hover:text-surface-900 dark:group-hover:text-white transition-colors">
                This document has a renewal date
              </span>
            </label>

            {/* Renewal Date Picker (Visible only when checkbox checked) */}
            {hasRenewalDate && (
              <div className="space-y-1.5 pl-7 animate-fadeIn">
                <label htmlFor="renewal-date" className="block text-xs font-medium text-surface-600 dark:text-surface-400">
                  Renewal Date
                </label>
                <input
                  id="renewal-date"
                  type="date"
                  value={renewalDate}
                  onChange={(e) => setRenewalDate(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-surface-200 dark:border-surface-800 px-4 py-2.5 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-900 
                    focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
                />
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-100 dark:border-surface-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-surface-200 dark:border-surface-800 px-4 py-2.5 text-sm font-medium text-surface-600 dark:text-surface-300 
                hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white 
                hover:bg-primary-700 disabled:opacity-50 transition-colors shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{mode === 'create' ? 'Save Document' : 'Update Details'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
