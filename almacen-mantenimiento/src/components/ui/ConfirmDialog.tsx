import { AlertTriangle } from 'lucide-react';

interface Props {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ open, title, description, confirmLabel = 'Eliminar', loading, onConfirm, onCancel }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-base font-bold text-gray-900 dark:text-slate-100">{title}</h2>
        </div>
        {description && (
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-5 pl-13">{description}</p>
        )}
        <div className="flex gap-3 mt-5">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Eliminando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
