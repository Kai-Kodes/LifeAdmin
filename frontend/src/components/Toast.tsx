import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

export interface ToastData {
  id: string;
  type: 'success' | 'error';
  message: string;
}

interface ToastProps {
  toasts: ToastData[];
  onRemove: (id: string) => void;
}

export default function Toast({ toasts, onRemove }: ToastProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: ToastData; onRemove: (id: string) => void }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onRemove(toast.id), 200);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const isSuccess = toast.type === 'success';

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg transition-all duration-200 min-w-[300px]
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
        ${isSuccess ? 'bg-white border-success-200' : 'bg-white border-danger-200'}`}
    >
      {isSuccess ? (
        <CheckCircle size={18} className="text-success-600 shrink-0" />
      ) : (
        <XCircle size={18} className="text-danger-600 shrink-0" />
      )}
      <p className="text-sm text-surface-700 flex-1">{toast.message}</p>
      <button onClick={() => onRemove(toast.id)} className="shrink-0 text-surface-400 hover:text-surface-600">
        <X size={14} />
      </button>
    </div>
  );
}
