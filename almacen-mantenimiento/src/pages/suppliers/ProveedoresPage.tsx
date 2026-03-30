import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Phone, Mail } from 'lucide-react';
import api from '../../services/api';
import { Proveedor } from '../../types';

export default function ProveedoresPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Proveedor | null>(null);
  const [form, setForm] = useState({ nombre: '', contacto: '', telefono: '', email: '' });

  const { data: proveedores = [], isLoading } = useQuery<Proveedor[]>({
    queryKey: ['proveedores'],
    queryFn: () => api.get('/proveedores').then(r => r.data),
    retry: false,
  });

  const guardarMutation = useMutation({
    mutationFn: (data: any) => editando ? api.put(`/proveedores/${editando.id}`, data) : api.post('/proveedores', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['proveedores'] }); cerrarForm(); },
  });

  const eliminarMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/proveedores/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['proveedores'] }),
  });

  const cerrarForm = () => { setShowForm(false); setEditando(null); setForm({ nombre: '', contacto: '', telefono: '', email: '' }); };

  const abrirEditar = (p: Proveedor) => {
    setEditando(p);
    setForm({ nombre: p.nombre, contacto: p.contacto ?? '', telefono: p.telefono ?? '', email: p.email ?? '' });
    setShowForm(true);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proveedores</h1>
          <p className="text-gray-500 text-sm mt-1">{proveedores.length} proveedores activos</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Nuevo proveedor
        </button>
      </div>

      {isLoading ? (
        <div className="text-center text-gray-400 py-12">Cargando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {proveedores.length === 0 ? (
            <div className="col-span-3 text-center text-gray-400 py-12">Sin proveedores registrados</div>
          ) : proveedores.map(p => (
            <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{p.nombre}</h3>
                <div className="flex gap-1">
                  <button onClick={() => abrirEditar(p)} className="p-1 text-gray-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => eliminarMutation.mutate(p.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              {p.contacto && <p className="text-sm text-gray-600 mb-1">{p.contacto}</p>}
              {p.telefono && <p className="flex items-center gap-1.5 text-sm text-gray-500"><Phone className="w-3.5 h-3.5" />{p.telefono}</p>}
              {p.email && <p className="flex items-center gap-1.5 text-sm text-gray-500 mt-1"><Mail className="w-3.5 h-3.5" />{p.email}</p>}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{editando ? 'Editar proveedor' : 'Nuevo proveedor'}</h2>
            <form onSubmit={(e) => { e.preventDefault(); guardarMutation.mutate(form); }} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nombre *</label>
                <input required value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Contacto</label>
                <input value={form.contacto} onChange={e => setForm({...form, contacto: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Teléfono</label>
                  <input value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={cerrarForm} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={guardarMutation.isPending} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
