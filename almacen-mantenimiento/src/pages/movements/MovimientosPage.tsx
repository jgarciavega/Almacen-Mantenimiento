import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ArrowDown, ArrowUp, User } from 'lucide-react';
import api from '../../services/api';
import { Movimiento } from '../../types';

export default function MovimientosPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    productoId: '', tipo: 'ENTRADA', cantidad: 1,
    motivo: '', referencia: '', recibidoPor: '',
  });

  const { data: movimientos = [], isLoading } = useQuery<Movimiento[]>({
    queryKey: ['movimientos'],
    queryFn: () => api.get('/movimientos').then(r => r.data),
    retry: false,
  });

  const { data: productos = [] } = useQuery({
    queryKey: ['productos'],
    queryFn: () => api.get('/productos').then(r => r.data),
    retry: false,
  });

  const registrarMutation = useMutation({
    mutationFn: (data: any) => api.post('/movimientos', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['movimientos'] });
      qc.invalidateQueries({ queryKey: ['productos'] });
      setShowForm(false);
      setForm({ productoId: '', tipo: 'ENTRADA', cantidad: 1, motivo: '', referencia: '', recibidoPor: '' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registrarMutation.mutate({ ...form, productoId: Number(form.productoId), cantidad: Number(form.cantidad) });
  };

  const recibeLabel = form.tipo === 'ENTRADA' ? 'Recibido por (almacenista)' : 'Recibido por (quién recibe)';

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Movimientos</h1>
          <p className="text-gray-500 text-sm mt-1">Entradas y salidas del almacén</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Registrar movimiento
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Cargando...</div>
        ) : movimientos.length === 0 ? (
          <div className="p-12 text-center text-gray-400">Sin movimientos registrados</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Tipo', 'Artículo', 'Cantidad', 'Recibido por', 'Motivo', 'Referencia / OT', 'Registrado por', 'Fecha'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {movimientos.map(m => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      m.tipo === 'ENTRADA' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {m.tipo === 'ENTRADA' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
                      {m.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{m.producto.nombre}</td>
                  <td className="px-4 py-3 font-semibold whitespace-nowrap">{m.cantidad} {m.producto.unidad}</td>
                  <td className="px-4 py-3">
                    {m.recibidoPor ? (
                      <span className="inline-flex items-center gap-1 text-gray-700">
                        <User className="w-3 h-3 text-gray-400" /> {m.recibidoPor}
                      </span>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-[180px] truncate">{m.motivo || <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{m.referencia || <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{m.usuario.nombre}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{new Date(m.createdAt).toLocaleString('es-MX')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Registrar movimiento</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Artículo *</label>
                <select required value={form.productoId} onChange={e => setForm({...form, productoId: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Seleccionar...</option>
                  {productos.map((p: any) => <option key={p.id} value={p.id}>{p.nombre} (Stock: {p.stockActual} {p.unidad})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tipo *</label>
                  <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="ENTRADA">ENTRADA</option>
                    <option value="SALIDA">SALIDA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cantidad *</label>
                  <input type="number" min="1" required value={form.cantidad} onChange={e => setForm({...form, cantidad: Number(e.target.value)})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{recibeLabel}</label>
                <input value={form.recibidoPor} onChange={e => setForm({...form, recibidoPor: e.target.value})} placeholder="Nombre de quien recibe" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Motivo</label>
                <input value={form.motivo} onChange={e => setForm({...form, motivo: e.target.value})} placeholder="Ej: Reparación bomba #3" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Referencia / OT</label>
                <input value={form.referencia} onChange={e => setForm({...form, referencia: e.target.value})} placeholder="Ej: OT-2024-001" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              {registrarMutation.isError && (
                <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">
                  {(registrarMutation.error as any)?.response?.data?.error || 'Error al registrar'}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
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
