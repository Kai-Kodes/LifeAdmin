import { useCallback, useRef, useState } from 'react';
import { Upload, FileText, Image, X, AlertCircle } from 'lucide-react';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ACCEPTED_TYPES = [
  'application/pdf',
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'image/bmp', 'image/tiff', 'image/svg+xml', 'image/heic', 'image/heif',
];

const ACCEPT_STRING = '.pdf,.jpg,.jpeg,.png,.webp,.gif,.bmp,.tif,.tiff,.svg,.heic,.heif';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType === 'application/pdf') return <FileText size={20} className="text-danger-600" />;
  if (mimeType.startsWith('image/')) return <Image size={20} className="text-primary-600" />;
  return <FileText size={20} className="text-surface-500" />;
}

interface FileUploadProps {
  file: File | null;
  onFileSelect: (file: File | null) => void;
  wantAttachment?: boolean;
  onWantAttachmentChange?: (want: boolean) => void;
  showCheckbox?: boolean;
  checkboxLabel?: string;
  sectionTitle?: string;
  error?: string | null;
  disabled?: boolean;
}

export default function FileUpload({
  file,
  onFileSelect,
  wantAttachment = true,
  onWantAttachmentChange,
  showCheckbox = false,
  checkboxLabel = 'I want to attach proof of purchase',
  sectionTitle,
  error,
  disabled = false,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateFile = useCallback((f: File): string | null => {
    if (f.size > MAX_FILE_SIZE) {
      return `File too large. Please upload a file smaller than 10 MB.`;
    }
    if (!ACCEPTED_TYPES.includes(f.type) && f.type !== '') {
      return 'Unsupported file type. Please upload a PDF or supported image file.';
    }
    const ext = f.name.split('.').pop()?.toLowerCase() || '';
    const validExts = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tif', 'tiff', 'svg', 'heic', 'heif'];
    if (!validExts.includes(ext)) {
      return 'Unsupported file type. Please upload a PDF or supported image file.';
    }
    return null;
  }, []);

  const handleFileChange = useCallback((f: File) => {
    const err = validateFile(f);
    if (err) {
      setValidationError(err);
      onFileSelect(null);
      return;
    }
    setValidationError(null);
    onFileSelect(f);
  }, [validateFile, onFileSelect]);

  const handleCheckboxChange = useCallback((checked: boolean) => {
    onWantAttachmentChange?.(checked);
    if (!checked) {
      onFileSelect(null);
      setValidationError(null);
    }
  }, [onWantAttachmentChange, onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileChange(droppedFile);
  }, [handleFileChange, disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setDragOver(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const displayError = validationError || error;
  const isUploadVisible = !showCheckbox || wantAttachment;

  return (
    <div className={sectionTitle || showCheckbox ? "border-t border-surface-100 pt-4" : ""}>
      {sectionTitle && <p className="text-sm font-medium text-surface-700 mb-2">{sectionTitle}</p>}

      {/* Checkbox (Optional, for Obligation form) */}
      {showCheckbox && (
        <label htmlFor="want-attachment" className="flex items-center gap-2.5 cursor-pointer select-none group">
          <input
            id="want-attachment"
            type="checkbox"
            checked={wantAttachment}
            onChange={(e) => handleCheckboxChange(e.target.checked)}
            disabled={disabled}
            className="h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
          />
          <span className="text-sm text-surface-600 group-hover:text-surface-800 transition-colors">
            {checkboxLabel}
          </span>
        </label>
      )}

      {/* Upload area */}
      {isUploadVisible && (
        <div className={showCheckbox ? "mt-3" : ""}>
          {file ? (
            /* Selected file preview */
            <div className="flex items-center gap-3 rounded-xl border border-surface-200 bg-surface-50 px-4 py-3">
              {getFileIcon(file.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-800 truncate">{file.name}</p>
                <p className="text-xs text-surface-500">{formatFileSize(file.size)}</p>
              </div>
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  onFileSelect(null);
                  setValidationError(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-surface-500 
                  hover:bg-surface-200 hover:text-surface-700 transition-colors"
              >
                <X size={14} />
                Remove
              </button>
            </div>
          ) : (
            /* Drop zone */
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => !disabled && fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-5 cursor-pointer transition-colors
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                ${dragOver
                  ? 'border-primary-400 bg-primary-50'
                  : 'border-surface-200 bg-surface-50 hover:border-surface-300 hover:bg-surface-100'
                }`}
            >
              <Upload size={22} className={`mb-1.5 ${dragOver ? 'text-primary-500' : 'text-surface-400'}`} />
              <p className="text-sm text-surface-600">
                <span className="hidden sm:inline">Drop your file here or </span>
                <span className="font-medium text-primary-600">choose file</span>
              </p>
              <p className="mt-1 text-xs text-surface-400">PDF or image file · Max 10 MB</p>
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT_STRING}
            disabled={disabled}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileChange(f);
            }}
            className="hidden"
            aria-label="Upload document file"
          />

          {/* Error */}
          {displayError && (
            <div className="mt-2 flex items-start gap-1.5 text-xs text-danger-600">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{displayError}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
