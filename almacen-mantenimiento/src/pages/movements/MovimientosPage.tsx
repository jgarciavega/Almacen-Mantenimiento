import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ArrowDown, ArrowUp, User, Search, Filter, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';
import { Movimiento } from '../../types';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { useAuthStore } from '../../store/authStore';

type FormErrors = { productoId?: string; cantidad?: string };

const LIMIT = 10;

export default function MovimientosPage() {
  const qc = useQueryClient();
  const { usuario } = useAuthStore();

  // Filtros
  const [buscar,    setBuscar]    = useState('');
  const [filtroTipo, setFiltroTipo] = useState('TODOS');
  const [filtroProducto, setFiltroProducto] = useState('');
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [desde,    setDesde]    = useState('');
  const [hasta,    setHasta]    = useState('');
  const [page,     setPage]     = useState(1);

  // Form
  const [showForm,    setShowForm]    = useState(false);
  const [form,        setForm]        = useState({ productoId: '', tipo: 'ENTRADA', cantidad: 1, motivo: '', referencia: '', entregadoPor: '', recibidoPor: '' });
  const [formErrors,  setFormErrors]  = useState<FormErrors>({});

  const params = {
    page,
    limit: LIMIT,
    ...(buscar          && { buscar }),
    ...(filtroTipo !== 'TODOS' && { tipo: filtroTipo }),
    ...(filtroProducto  && { productoId: filtroProducto }),
    ...(filtroUsuario   && { usuarioId: filtroUsuario }),
    ...(desde           && { desde }),
    ...(hasta           && { hasta }),
  };

  const { data: resp, isLoading } = useQuery({
    queryKey: ['movimientos', params],
    queryFn: () => api.get('/movimientos', { params }).then(r => r.data),
    retry: false,
  });

  const movimientos: Movimiento[] = resp?.data ?? [];
  const total:       number       = resp?.total ?? 0;
  const totalPages:  number       = resp?.totalPages ?? 1;

  const { data: productosResult } = useQuery({
    queryKey: ['productos-selector'],
    queryFn:  () => api.get('/productos', { params: { limit: 200 } }).then(r => r.data),
    retry: false,
  });
  const productos = productosResult?.data ?? [];

  const { data: usuariosResult } = useQuery({
    queryKey: ['usuarios-selector'],
    queryFn:  () => api.get('/usuarios').then(r => r.data),
    enabled:  usuario?.rol === 'ADMIN',
    retry: false,
  });
  const usuarios = usuariosResult?.data ?? [];

  const registrarMutation = useMutation({
    mutationFn: (data: any) => api.post('/movimientos', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['movimientos'] });
      qc.invalidateQueries({ queryKey: ['productos'] });
      toast.success('Movimiento registrado');
      setShowForm(false);
      setForm({ productoId: '', tipo: 'ENTRADA', cantidad: 1, motivo: '', referencia: '', entregadoPor: '', recibidoPor: '' });
      setFormErrors({});
    },
    onError: () => toast.error('Error al registrar el movimiento'),
  });

  const validateForm = () => {
    const errors: FormErrors = {};
    if (!form.productoId) errors.productoId = 'Debes seleccionar un artículo';
    if (!form.cantidad || form.cantidad < 1) errors.cantidad = 'La cantidad debe ser mayor a 0';
    if (form.tipo === 'SALIDA' && form.productoId) {
      const prod = (productos as any[]).find((p: any) => String(p.id) === String(form.productoId));
      if (prod && form.cantidad > prod.stockActual)
        errors.cantidad = `Stock insuficiente. Disponible: ${prod.stockActual} ${prod.unidad}`;
    }
    return errors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    setFormErrors({});
    registrarMutation.mutate({ ...form, productoId: Number(form.productoId), cantidad: Number(form.cantidad) });
  };

  const resetFiltros = () => {
    setBuscar(''); setFiltroTipo('TODOS'); setFiltroProducto('');
    setFiltroUsuario(''); setDesde(''); setHasta(''); setPage(1);
  };

  const hayFiltros = buscar || filtroTipo !== 'TODOS' || filtroProducto || filtroUsuario || desde || hasta;

  const inputCls = (err?: string) =>
    `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-colors bg-white dark:bg-slate-700 dark:text-slate-100 ${
      err ? 'border-red-400 focus:ring-red-400 dark:border-red-500' : 'border-gray-300 dark:border-slate-600 focus:ring-blue-500'}`;

  return (
    <div className="p-8 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Movimientos</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
            {total > 0 ? `${total} registros encontrados` : 'Entradas y salidas del almacén'}
          </p>
        </div>
        <button onClick={() => { setShowForm(true); setFormErrors({}); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Registrar movimiento
        </button>
      </div>

      {/* Panel de filtros */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-300">
          <Filter className="w-4 h-4 text-blue-500" /> Filtros
          {hayFiltros && (
            <button onClick={resetFiltros}
              className="ml-auto flex items-center gap-1 text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors">
              <X className="w-3 h-3" /> Limpiar filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Búsqueda */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={buscar} onChange={e => { setBuscar(e.target.value); setPage(1); }}
              placeholder="Buscar artículo, motivo, OT..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400" />
          </div>

          {/* Tipo */}
          <select value={filtroTipo} onChange={e => { setFiltroTipo(e.target.value); setPage(1); }}
            className="border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-slate-100">
            <option value="TODOS">Todos los tipos</option>
            <option value="ENTRADA">Solo ENTRADAS</option>
            <option value="SALIDA">Solo SALIDAS</option>
          </select>

          {/* Fecha desde */}
          <div>
            <input type="date" value={desde} onChange={e => { setDesde(e.target.value); setPage(1); }}
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-slate-100" />
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 pl-1">Desde</p>
          </div>

          {/* Fecha hasta */}
          <div>
            <input type="date" value={hasta} onChange={e => { setHasta(e.target.value); setPage(1); }}
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-slate-100" />
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 pl-1">Hasta</p>
          </div>
        </div>

        {/* Filtro por artículo */}
        <div className="flex flex-wrap gap-3">
          <select value={filtroProducto} onChange={e => { setFiltroProducto(e.target.value); setPage(1); }}
            className="flex-1 min-w-[200px] border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-slate-100">
            <option value="">Todos los artículos</option>
            {(productos as any[]).map((p: any) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
          {usuario?.rol === 'ADMIN' && (
            <select value={filtroUsuario} onChange={e => { setFiltroUsuario(e.target.value); setPage(1); }}
              className="flex-1 min-w-[180px] border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-slate-100">
              <option value="">Todos los usuarios</option>
              {(usuarios as any[]).map((u: any) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-x-auto">
        {isLoading ? (
          <TableSkeleton rows={LIMIT} cols={8} />
        ) : movimientos.length === 0 ? (
          <div className="p-12 text-center text-gray-400 dark:text-slate-500">
            <p className="text-base">{hayFiltros ? 'Sin resultados para estos filtros' : 'Sin movimientos registrados'}</p>
            {hayFiltros && <button onClick={resetFiltros} className="mt-2 text-sm text-blue-500 hover:underline">Limpiar filtros</button>}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700">
              <tr>
                {['Tipo', 'Artículo', 'Cantidad', 'Recibido por', 'Motivo', 'Referencia / OT', 'Registrado por', 'Fecha'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
              {movimientos.map(m => (
                <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      m.tipo === 'ENTRADA' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                    }`}>
                      {m.tipo === 'ENTRADA' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
                      {m.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-slate-100 whitespace-nowrap">{m.producto.nombre}</td>
                  <td className="px-4 py-3 font-semibold dark:text-slate-200 whitespace-nowrap">{m.cantidad} {m.producto.unidad}</td>
                  <td className="px-4 py-3">
                    {m.recibidoPor
                      ? <span className="inline-flex items-center gap-1 text-gray-700 dark:text-slate-300"><User className="w-3 h-3 text-gray-400" />{m.recibidoPor}</span>
                      : <span className="text-gray-300 dark:text-slate-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-slate-400 max-w-[180px] truncate">{m.motivo || <span className="text-gray-300 dark:text-slate-600">—</span>}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-slate-400 whitespace-nowrap">{m.referencia || <span className="text-gray-300 dark:text-slate-600">—</span>}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-slate-400 whitespace-nowrap">{m.usuario.nombre}</td>
                  <td className="px-4 py-3 text-gray-400 dark:text-slate-500 text-xs whitespace-nowrap">{new Date(m.createdAt).toLocaleString('es-MX')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-gray-500 dark:text-slate-400">
            Página <span className="font-semibold text-gray-800 dark:text-slate-200">{page}</span> de <span className="font-semibold text-gray-800 dark:text-slate-200">{totalPages}</span>
            <span className="ml-2 text-gray-400 dark:text-slate-500">({total} registros)</span>
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={page === 1}
              className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-medium">
              «
            </button>
            <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {/* Números de página */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const n = start + i;
              if (n < 1 || n > totalPages) return null;
              return (
                <button key={n} onClick={() => setPage(n)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                    n === page
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                  }`}>
                  {n}
                </button>
              );
            })}
            <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
              className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-medium">
              »
            </button>
          </div>
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg p-6">
           <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-1">Registrar movimiento</h2>
             <div className="flex items-center gap-2 mb-4 text-sm text-gray-500 dark:text-slate-400">
               <User className="w-4 h-4 text-blue-500" />
               <span>Registrando como: <span className="font-semibold text-blue-600 dark:text-blue-400">{usuario?.nombre}</span></span>
             </div>
            <form onSubmit={handleSubmit} className="space-y-3" noValidate>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Artículo *</label>
                <select value={form.productoId} onChange={e => { setForm({...form, productoId: e.target.value}); setFormErrors(p => ({...p, productoId: undefined})); }} className={inputCls(formErrors.productoId)}>
                  <option value="">Seleccionar artículo...</option>
                  {(productos as any[]).map((p: any) => <option key={p.id} value={p.id}>{p.nombre} (Stock: {p.stockActual} {p.unidad})</option>)}
                </select>
                {formErrors.productoId && <p className="text-xs text-red-500 mt-1">{formErrors.productoId}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Tipo *</label>
                  <select value={form.tipo} onChange={e => { setForm({...form, tipo: e.target.value}); setFormErrors(p => ({...p, cantidad: undefined})); }} className={inputCls()}>
                    <option value="ENTRADA">ENTRADA</option>
                    <option value="SALIDA">SALIDA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Cantidad *</label>
                  <input type="number" min="1" value={form.cantidad} onChange={e => { setForm({...form, cantidad: Number(e.target.value)}); setFormErrors(p => ({...p, cantidad: undefined})); }} className={inputCls(formErrors.cantidad)} />
                  {formErrors.cantidad && <p className="text-xs text-red-500 mt-1">{formErrors.cantidad}</p>}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Entregado por (proveedor / origen)</label>
                <input value={form.entregadoPor} onChange={e => setForm({...form, entregadoPor: e.target.value})} placeholder="Ej: Ferretería Central" className={inputCls()} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">{form.tipo === 'ENTRADA' ? 'Recibido por (almacenista)' : 'Recibido por (quién recibe)'}</label>
                <input value={form.recibidoPor} onChange={e => setForm({...form, recibidoPor: e.target.value})} placeholder="Nombre de quien recibe" className={inputCls()} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Motivo</label>
                <input value={form.motivo} onChange={e => setForm({...form, motivo: e.target.value})} placeholder="Ej: Reparación bomba #3" className={inputCls()} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Referencia / OT</label>
                <input value={form.referencia} onChange={e => setForm({...form, referencia: e.target.value})} placeholder="Ej: OT-2024-001" className={inputCls()} />
              </div>
              {registrarMutation.isError && (
                <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm px-3 py-2 rounded-lg border border-red-200 dark:border-red-800">
                  {(registrarMutation.error as any)?.response?.data?.error || 'Error al registrar el movimiento'}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setFormErrors({}); }} className="flex-1 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-700">Cancelar</button>
                <button type="submit" disabled={registrarMutation.isPending} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                  {registrarMutation.isPending ? 'Guardando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
