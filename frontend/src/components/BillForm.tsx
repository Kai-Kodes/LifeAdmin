import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import FileUpload from './FileUpload';
import type { BillFormData, BillItem } from '../types/bill';

interface BillFormProps {
  mode: 'create' | 'edit';
  initialData?: BillItem | null;
  onSubmit: (data: BillFormData, file?: File) => void;
  onClose: () => void;
  isSubmitting: boolean;
}

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'CAD', 'AUD'];

export default function BillForm({
  mode,
  initialData,
  onSubmit,
  onClose,
  isSubmitting,
}: BillFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [dueDate, setDueDate] = useState(
    initialData?.due_date ? initialData.due_date.split('T')[0] : ''
  );
  const [amount, setAmount] = useState<string>(
    initialData?.amount !== null && initialData?.amount !== undefined
      ? String(initialData.amount)
      : ''
  );
  const [currency, setCurrency] = useState(initialData?.currency || 'INR');
  const [notes, setNotes] = useState(initialData?.notes || '');

  // Photo/File Attachment State (Gated behind optional checkbox, unchecked by default)
  const [wantAttachment, setWantAttachment] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDueDate(initialData.due_date ? initialData.due_date.split('T')[0] : '');
      setAmount(
        initialData.amount !== null && initialData.amount !== undefined
          ? String(initialData.amount)
          : ''
      );
      setCurrency(initialData.currency || 'INR');
      setNotes(initialData.notes || '');
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter a bill name (e.g. Electricity Bill, Wifi Subscription)');
      return;
    }

    if (!dueDate) {
      setError('Please select a mandatory due date ("to pay by" date)');
      return;
    }

    const formData: BillFormData = {
      name: name.trim(),
      due_date: dueDate,
      amount: amount !== '' ? parseFloat(amount) : undefined,
      currency,
      notes: notes.trim() || undefined,
    };

    const finalFile = wantAttachment && selectedFile ? selectedFile : undefined;
    onSubmit(formData, finalFile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/50 p-4 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-surface-950 p-6 shadow-xl sm:p-8 space-y-6 border border-surface-200 dark:border-surface-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-100 dark:border-surface-800 pb-4">
          <h2 className="text-xl font-bold text-surface-900 dark:text-white">
            {mode === 'create' ? 'Add Bill' : 'Edit Bill Details'}
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Bill Name */}
          <div className="space-y-1.5">
            <label htmlFor="bill-name" className="block text-sm font-medium text-surface-700 dark:text-surface-300">
              Bill Name <span className="text-danger-500">*</span>
            </label>
            <input
              id="bill-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="e.g. Electricity Bill, Internet Subscription, Rent"
              disabled={isSubmitting}
              className="w-full rounded-xl border border-surface-200 dark:border-surface-800 px-4 py-2.5 text-sm 
                text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-900 
                placeholder:text-surface-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
            />
          </div>

          {/* Mandatory Due Date */}
          <div className="space-y-1.5">
            <label htmlFor="bill-due-date" className="block text-sm font-medium text-surface-700 dark:text-surface-300">
              To Pay By (Due Date) <span className="text-danger-500">*</span>
            </label>
            <input
              id="bill-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => {
                setDueDate(e.target.value);
                setError(null);
              }}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-surface-200 dark:border-surface-800 px-4 py-2.5 text-sm 
                text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-900 
                focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
            />
          </div>

          {/* Amount & Currency */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <label htmlFor="bill-amount" className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                Amount (Optional)
              </label>
              <input
                id="bill-amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 1500.00"
                disabled={isSubmitting}
                className="w-full rounded-xl border border-surface-200 dark:border-surface-800 px-4 py-2.5 text-sm 
                  text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-900 
                  placeholder:text-surface-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="bill-currency" className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                Currency
              </label>
              <select
                id="bill-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-surface-200 dark:border-surface-800 px-3 py-2.5 text-sm 
                  text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-900 
                  focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors cursor-pointer"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label htmlFor="bill-notes" className="block text-sm font-medium text-surface-700 dark:text-surface-300">
              Notes (Optional)
            </label>
            <input
              id="bill-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Consumer ID, auto-debit account, receipt number"
              disabled={isSubmitting}
              className="w-full rounded-xl border border-surface-200 dark:border-surface-800 px-4 py-2.5 text-sm 
                text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-900 
                placeholder:text-surface-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
            />
          </div>

          {/* Optional Bill Photo / Attachment Dropzone */}
          {mode === 'create' && (
            <FileUpload
              file={selectedFile}
              onFileSelect={setSelectedFile}
              wantAttachment={wantAttachment}
              onWantAttachmentChange={setWantAttachment}
              showCheckbox={true}
              checkboxLabel="I want to attach a bill photo / receipt copy"
              sectionTitle="Bill Attachment"
              disabled={isSubmitting}
            />
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-100 dark:border-surface-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-surface-200 dark:border-surface-800 px-4 py-2.5 text-sm font-medium 
                text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
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
                <span>{mode === 'create' ? 'Save Bill' : 'Update Details'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
