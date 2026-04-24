import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Package, ArrowLeftRight, Truck, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ['global-search', query],
    queryFn: async () => {
      if (query.trim().length < 2) return null;
      const [productos, proveedores] = await Promise.all([
        api.get('/productos', { params: { buscar: query } }).then(r => r.data),
        api.get('/proveedores').then(r => r.data.filter((p: any) =>
          p.nombre.toLowerCase().includes(query.toLowerCase())
        )),
      ]);
      return { productos: productos.slice(0, 5), proveedores: proveedores.slice(0, 3) };
    },
    enabled: query.trim().length >= 2,
  });

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const total = (data?.productos?.length ?? 0) + (data?.proveedores?.length ?? 0);
  const showDropdown = open && query.trim().length >= 2;

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-400" />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar artículos, proveedores..."
          className="w-full pl-9 pr-8 py-2 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-700 transition-colors"
        />
        {query && (
          <button onClick={() => { setQuery(''); setOpen(false); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full mt-2 w-full bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 z-50 overflow-hidden">
          {query.trim().length < 2 ? null : total === 0 ? (
            <div className="px-4 py-6 text-center text-gray-400 dark:text-slate-500 text-sm">Sin resultados para "{query}"</div>
          ) : (
            <>
              {(data?.productos?.length ?? 0) > 0 && (
                <div>
                  <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase">Artículos</p>
                  {data!.productos.map((p: any) => (
                    <button
                      key={p.id}
                      onClick={() => { navigate('/inventario'); setOpen(false); setQuery(''); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-700 text-left"
                    >
                      <Package className="w-4 h-4 text-blue-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">{p.nombre}</p>
                        <p className="text-xs text-gray-400 dark:text-slate-500">{p.sku} · {p.categoria.nombre} · Stock: {p.stockActual} {p.unidad}</p>
                      </div>
                      {p.stockActual <= p.stockMinimo && (
                        <span className="ml-auto text-xs bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full shrink-0">Stock bajo</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {(data?.proveedores?.length ?? 0) > 0 && (
                <div>
                  <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase">Proveedores</p>
                  {data!.proveedores.map((p: any) => (
                    <button
                      key={p.id}
                      onClick={() => { navigate('/proveedores'); setOpen(false); setQuery(''); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-700 text-left"
                    >
                      <Truck className="w-4 h-4 text-green-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">{p.nombre}</p>
                        <p className="text-xs text-gray-400 dark:text-slate-500">{p.contacto}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <div className="px-4 py-2 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
                <p className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1">
                  <ArrowLeftRight className="w-3 h-3" /> {total} resultado{total !== 1 ? 's' : ''}
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
