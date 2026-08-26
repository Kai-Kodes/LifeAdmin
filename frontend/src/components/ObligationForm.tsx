import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ObligationFormData } from '../types/obligation';
import type { Obligation } from '../types/obligation';
import FileUpload from './FileUpload';

interface ObligationFormProps {
  onSubmit: (data: ObligationFormData, file?: File | null) => void;
  onClose: () => void;
  isSubmitting: boolean;
  initialData?: Obligation | null;
  mode?: 'create' | 'edit';
  /** Pre-check the attachment checkbox when opening in edit mode to attach proof */
  defaultWantAttachment?: boolean;
}

const CURRENCIES = [
  'INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF',
  'CNY', 'SEK', 'NZD', 'SGD', 'HKD', 'KRW', 'BRL',
];

export default function ObligationForm({
  onSubmit,
  onClose,
  isSubmitting,
  initialData,
  mode = 'create',
  defaultWantAttachment = false,
}: ObligationFormProps) {
  const [formData, setFormData] = useState<ObligationFormData>({
    title: '',
    description: '',
    category: 'warranty',
    provider: '',
    purchase_date: '',
    expiry_date: '',
    amount: '',
    currency: 'INR',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Attachment state
  const [wantAttachment, setWantAttachment] = useState(defaultWantAttachment);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        description: initialData.description || '',
        category: initialData.category,
        provider: initialData.provider || '',
        purchase_date: initialData.purchase_date || '',
        expiry_date: initialData.expiry_date,
        amount: initialData.amount ? parseFloat(initialData.amount).toString() : '',
        currency: initialData.currency,
        notes: initialData.notes || '',
        status: initialData.status,
      });
    }
  }, [initialData]);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Item name is required';
    }
    if (!formData.expiry_date) {
      newErrors.expiry_date = 'Expiry date is required';
    }
    if (formData.amount && parseFloat(formData.amount as string) < 0) {
      newErrors.amount = 'Price cannot be negative';
    }
    if (formData.purchase_date && formData.expiry_date && formData.purchase_date > formData.expiry_date) {
      newErrors.purchase_date = 'Purchase date should not be after expiry date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setUploadError(null);

    const data: ObligationFormData = {
      ...formData,
      title: formData.title.trim(),
      description: formData.description?.trim() || undefined,
      provider: formData.provider?.trim() || undefined,
      purchase_date: formData.purchase_date || undefined,
      amount: formData.amount ? parseFloat(formData.amount as string) : undefined,
      notes: formData.notes?.trim() || undefined,
    };

    // Pass file only if checkbox is checked and a file is selected
    onSubmit(data, wantAttachment ? selectedFile : null);
  }

  function updateField(field: keyof ObligationFormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl border border-surface-200 animate-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-surface-100 bg-white/95 backdrop-blur-sm px-6 py-4 rounded-t-2xl">
          <h2 className="text-lg font-semibold text-surface-900">
            {mode === 'create' ? 'Add Warranty' : 'Edit Warranty'}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-surface-400 hover:bg-surface-100 hover:text-surface-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Item name */}
          <div>
            <label htmlFor="form-title" className="block text-sm font-medium text-surface-700 mb-1.5">
              Item name <span className="text-danger-500">*</span>
            </label>
            <input
              id="form-title"
              type="text"
              value={formData.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="e.g. Dell Inspiron 15"
              className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-surface-900 placeholder:text-surface-400 
                focus:border-primary-500 focus:ring-1 focus:ring-primary-500
                ${errors.title ? 'border-danger-500' : 'border-surface-200'}`}
            />
            {errors.title && <p className="mt-1 text-xs text-danger-600">{errors.title}</p>}
          </div>

          {/* Provider */}
          <div>
            <label htmlFor="form-provider" className="block text-sm font-medium text-surface-700 mb-1.5">Provider</label>
            <input
              id="form-provider"
              type="text"
              value={formData.provider}
              onChange={(e) => updateField('provider', e.target.value)}
              placeholder="e.g. Dell"
              className="w-full rounded-lg border border-surface-200 px-3.5 py-2.5 text-sm text-surface-900 placeholder:text-surface-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* Date row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="form-purchase-date" className="block text-sm font-medium text-surface-700 mb-1.5">Purchase date</label>
              <input
                id="form-purchase-date"
                type="date"
                value={formData.purchase_date}
                onChange={(e) => updateField('purchase_date', e.target.value)}
                className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-surface-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500
                  ${errors.purchase_date ? 'border-danger-500' : 'border-surface-200'}`}
              />
              {errors.purchase_date && <p className="mt-1 text-xs text-danger-600">{errors.purchase_date}</p>}
            </div>
            <div>
              <label htmlFor="form-expiry-date" className="block text-sm font-medium text-surface-700 mb-1.5">
                Expiry date <span className="text-danger-500">*</span>
              </label>
              <input
                id="form-expiry-date"
                type="date"
                value={formData.expiry_date}
                onChange={(e) => updateField('expiry_date', e.target.value)}
                className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-surface-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500
                  ${errors.expiry_date ? 'border-danger-500' : 'border-surface-200'}`}
              />
              {errors.expiry_date && <p className="mt-1 text-xs text-danger-600">{errors.expiry_date}</p>}
            </div>
          </div>

          {/* Price row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label htmlFor="form-amount" className="block text-sm font-medium text-surface-700 mb-1.5">Purchase price</label>
              <input
                id="form-amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => updateField('amount', e.target.value)}
                placeholder="e.g. 65000"
                className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-surface-900 placeholder:text-surface-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500
                  ${errors.amount ? 'border-danger-500' : 'border-surface-200'}`}
              />
              {errors.amount && <p className="mt-1 text-xs text-danger-600">{errors.amount}</p>}
            </div>
            <div>
              <label htmlFor="form-currency" className="block text-sm font-medium text-surface-700 mb-1.5">Currency</label>
              <select
                id="form-currency"
                value={formData.currency}
                onChange={(e) => updateField('currency', e.target.value)}
                className="w-full rounded-lg border border-surface-200 px-3.5 py-2.5 text-sm text-surface-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 bg-white"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="form-description" className="block text-sm font-medium text-surface-700 mb-1.5">Description</label>
            <input
              id="form-description"
              type="text"
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="e.g. Two-year standard warranty"
              className="w-full rounded-lg border border-surface-200 px-3.5 py-2.5 text-sm text-surface-900 placeholder:text-surface-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="form-notes" className="block text-sm font-medium text-surface-700 mb-1.5">Notes</label>
            <textarea
              id="form-notes"
              value={formData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="e.g. Invoice stored in Google Drive"
              rows={3}
              className="w-full rounded-lg border border-surface-200 px-3.5 py-2.5 text-sm text-surface-900 placeholder:text-surface-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none"
            />
          </div>

          {/* Attachment upload */}
          <FileUpload
            file={selectedFile}
            onFileSelect={setSelectedFile}
            wantAttachment={wantAttachment}
            onWantAttachmentChange={setWantAttachment}
            showCheckbox={true}
            sectionTitle="Proof of Purchase"
            error={uploadError}
          />

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-surface-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-surface-600 hover:bg-surface-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 
                disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting
                ? 'Saving...'
                : mode === 'create'
                  ? 'Add Warranty'
                  : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
