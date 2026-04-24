import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, AlertTriangle, X, ExternalLink, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

interface Alerta {
  id: number;
  nombre: string;
  sku: string;
  stockActual: number;
  stockMinimo: number;
  unidad: string;
  categoria: string;
  critico: boolean;
}

export default function StockAlertBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data } = useQuery<{ total: number; alertas: Alerta[] }>({
    queryKey: ['alertas-bell'],
    queryFn: () => api.get('/alertas').then((r: any) => r.data),
    refetchInterval: 30_000, // cada 30 segundos
    staleTime: 20_000,
  });

  const alertas = data?.alertas ?? [];
  const total = data?.total ?? 0;
  const criticos = alertas.filter(a => a.critico).length;

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Cerrar con Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {/* Botón campana */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        title="Alertas de stock"
      >
        <Bell className="w-5 h-5" />
        {total > 0 && (
          <span className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold text-white flex items-center justify-center px-1 ${
            criticos > 0 ? 'bg-red-600' : 'bg-orange-500'
          }`}>
            {total > 99 ? '99+' : total}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <span className="font-semibold text-sm text-gray-900 dark:text-slate-100">
                Alertas de stock
              </span>
              {total > 0 && (
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                  criticos > 0
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                    : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400'
                }`}>
                  {total}
                </span>
              )}
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 dark:text-slate-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Lista */}
          <div className="max-h-[360px] overflow-y-auto">
            {alertas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-400 dark:text-slate-500">
                <Package className="w-8 h-8 opacity-50" />
                <p className="text-sm">Todo el stock está en orden ✅</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-slate-700">
                {/* Críticos primero */}
                {[...alertas].sort((a, b) => Number(b.critico) - Number(a.critico)).map(a => (
                  <div key={a.id} className={`px-4 py-3 ${
                    a.critico
                      ? 'bg-red-50/60 dark:bg-red-900/10'
                      : 'hover:bg-gray-50 dark:hover:bg-slate-700/40'
                  } transition-colors`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">
                          {a.nombre}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                          {a.sku} · {a.categoria}
                        </p>
                      </div>
                      {a.critico && (
                        <span className="shrink-0 text-xs bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded font-medium">
                          SIN STOCK
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 flex items-center gap-1 text-xs">
                      <span className={`font-semibold ${a.critico ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`}>
                        {a.stockActual} {a.unidad}
                      </span>
                      <span className="text-gray-400 dark:text-slate-500">/ mín. {a.stockMinimo}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {total > 0 && (
            <div className="border-t border-gray-100 dark:border-slate-700 px-4 py-2.5">
              <button
                onClick={() => { setOpen(false); navigate('/dashboard'); }}
                className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Ver en Dashboard
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
