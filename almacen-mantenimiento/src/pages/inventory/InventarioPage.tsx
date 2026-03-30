import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import { Producto } from '../../types';

export default function InventarioPage() {
  const qc = useQueryClient();
  const [buscar, setBuscar] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Producto | null>(null);
  const [form, setForm] = useState({ nombre: '', sku: '', descripcion: '', stockActual: 0, stockMinimo: 1, unidad: 'pza', ubicacion: '', categoriaId: '' });

  const { data: productos = [], isLoading } = useQuery<Producto[]>({
    queryKey: ['productos', buscar],
    queryFn: () => api.get('/productos', { params: { buscar } }).then(r => r.data),
    retry: false,
  });

  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias'],
    queryFn: () => api.get('/productos/categorias/lista').then(r => r.data),
    retry: false,
  });

  const crearMutation = useMutation({
    mutationFn: (data: any) => editando
      ? api.put(`/productos/${editando.id}`, data)
      : api.post('/productos', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['productos'] }); cerrarForm(); },
  });

  const eliminarMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/productos/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['productos'] }),
  });

  const abrirEditar = (p: Producto) => {
    setEditando(p);
    setForm({ nombre: p.nombre, sku: p.sku, descripcion: p.descripcion ?? '', stockActual: p.stockActual, stockMinimo: p.stockMinimo, unidad: p.unidad, ubicacion: p.ubicacion ?? '', categoriaId: String(p.categoriaId) });
    setShowForm(true);
  };

  const cerrarForm = () => { setShowForm(false); setEditando(null); setForm({ nombre: '', sku: '', descripcion: '', stockActual: 0, stockMinimo: 1, unidad: 'pza', ubicacion: '', categoriaId: '' }); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    crearMutation.mutate({ ...form, categoriaId: Number(form.categoriaId) });
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
          <p className="text-gray-500 text-sm mt-1">{productos.length} artículos</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Nuevo artículo
        </button>
      </div>

      {/* Buscador */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={buscar}
          onChange={e => setBuscar(e.target.value)}
          placeholder="Buscar artículo..."
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Cargando...</div>
        ) : productos.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-lg">Sin artículos registrados</p>
            <p className="text-sm mt-1">Agrega tu primer artículo con el botón de arriba</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['SKU', 'Nombre', 'Categoría', 'Stock', 'Mínimo', 'Unidad', 'Ubicación', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {productos.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.sku}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{p.nombre}</td>
                  <td className="px-4 py-3 text-gray-600">{p.categoria.nombre}</td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${p.stockActual <= p.stockMinimo ? 'text-red-600' : 'text-gray-900'}`}>
                      {p.stockActual <= p.stockMinimo && <AlertTriangle className="inline w-3 h-3 mr-1" />}
                      {p.stockActual}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{p.stockMinimo}</td>
                  <td className="px-4 py-3 text-gray-500">{p.unidad}</td>
                  <td className="px-4 py-3 text-gray-500">{p.ubicacion || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => abrirEditar(p)} className="p-1 text-gray-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => eliminarMutation.mutate(p.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{editando ? 'Editar artículo' : 'Nuevo artículo'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nombre *</label>
                  <input required value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">SKU *</label>
                  <input required value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Categoría *</label>
                  <select required value={form.categoriaId} onChange={e => setForm({...form, categoriaId: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Seleccionar...</option>
                    {categorias.map((c: any) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Unidad</label>
                  <input value={form.unidad} onChange={e => setForm({...form, unidad: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Stock actual</label>
                  <input type="number" min="0" value={form.stockActual} onChange={e => setForm({...form, stockActual: Number(e.target.value)})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Stock mínimo</label>
                  <input type="number" min="0" value={form.stockMinimo} onChange={e => setForm({...form, stockMinimo: Number(e.target.value)})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Ubicación</label>
                <input value={form.ubicacion} onChange={e => setForm({...form, ubicacion: e.target.value})} placeholder="Ej: Estante A-3" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Descripción</label>
                <textarea value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={cerrarForm} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={crearMutation.isPending} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                  {crearMutation.isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
