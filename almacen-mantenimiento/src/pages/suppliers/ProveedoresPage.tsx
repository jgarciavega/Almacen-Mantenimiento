import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Phone, Mail, Search } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';
import { Proveedor } from '../../types';
import { CardsSkeleton } from '../../components/ui/Skeleton';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

type FormErrors = {
  nombre?: string;
  email?: string;
  telefono?: string;
};

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone: string): boolean {
  return /^[\d\s\+\-\(\)]{7,20}$/.test(phone);
}

export default function ProveedoresPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Proveedor | null>(null);
  const [form, setForm] = useState({ nombre: '', contacto: '', telefono: '', email: '' });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [buscar, setBuscar] = useState('');
  const [page, setPage] = useState(1);

  const { data: result, isLoading, isError: queryError } = useQuery({
    queryKey: ['proveedores', buscar, page],
    queryFn: () => api.get('/proveedores', { params: { buscar, page, limit: 9 } }).then(r => r.data),
    retry: 1,
    placeholderData: (prev) => prev,
    staleTime: 0,
  });

  const proveedores: Proveedor[] = result?.data ?? [];
  const totalProveedores: number = result?.total ?? 0;
  const totalPages: number = result?.totalPages ?? 1;

  const guardarMutation = useMutation({
    mutationFn: (data: any) => editando ? api.put(`/proveedores/${editando.id}`, data) : api.post('/proveedores', data),
    onSuccess: () => {
      qc.refetchQueries({ queryKey: ['proveedores'] });
      if (!editando) setPage(1);
      toast.success(editando ? 'Proveedor actualizado' : 'Proveedor creado');
      cerrarForm();
    },
    onError: () => toast.error('Error al guardar el proveedor'),
  });

  const eliminarMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/proveedores/${id}`),
    onSuccess: () => {
      qc.refetchQueries({ queryKey: ['proveedores'] });
      toast.success('Proveedor eliminado');
      setConfirmId(null);
    },
    onError: () => { toast.error('Error al eliminar el proveedor'); setConfirmId(null); },
  });

  const cerrarForm = () => { setShowForm(false); setEditando(null); setFormErrors({}); setForm({ nombre: '', contacto: '', telefono: '', email: '' }); };

  const abrirEditar = (p: Proveedor) => {
    setEditando(p);
    setForm({ nombre: p.nombre, contacto: p.contacto ?? '', telefono: p.telefono ?? '', email: p.email ?? '' });
    setFormErrors({});
    setShowForm(true);
  };

  const validateForm = (): FormErrors => {
    const errors: FormErrors = {};
    if (!form.nombre.trim()) errors.nombre = 'El nombre del proveedor es obligatorio';
    else if (form.nombre.trim().length < 2) errors.nombre = 'Mínimo 2 caracteres';
    if (form.email && !validateEmail(form.email)) errors.email = 'Formato de email inválido (ej: contacto@empresa.com)';
    if (form.telefono && !validatePhone(form.telefono)) errors.telefono = 'Teléfono inválido (7-20 dígitos)';
    return errors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    setFormErrors({});
    guardarMutation.mutate(form);
  };

  const inputClass = (hasError?: string) =>
    `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-colors bg-white dark:bg-slate-700 dark:text-slate-100 ${
      hasError
        ? 'border-red-400 focus:ring-red-400 dark:border-red-500'
        : 'border-gray-300 dark:border-slate-600 focus:ring-blue-500'
    }`;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Proveedores</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">{totalProveedores} proveedores activos</p>
        </div>
        <button onClick={() => { setShowForm(true); setFormErrors({}); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Nuevo proveedor
        </button>
      </div>

      {/* Buscador */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={buscar}
          onChange={e => { setBuscar(e.target.value); setPage(1); }}
          placeholder="Buscar proveedor..."
          className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400"
        />
      </div>

      {isLoading ? (
        <CardsSkeleton count={6} />
      ) : queryError ? (
        <div className="text-center text-red-500 dark:text-red-400 py-12">Error al cargar proveedores. Verifica que el backend esté corriendo.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {proveedores.length === 0 ? (
              <div className="col-span-3 text-center text-gray-400 dark:text-slate-500 py-12">Sin proveedores registrados</div>
            ) : proveedores.map(p => (
              <div key={p.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-slate-100">{p.nombre}</h3>
                  <div className="flex gap-1">
                    <button onClick={() => abrirEditar(p)} className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => setConfirmId(p.id)} className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                {p.contacto && <p className="text-sm text-gray-600 dark:text-slate-300 mb-1">{p.contacto}</p>}
                {p.telefono && <p className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400"><Phone className="w-3.5 h-3.5" />{p.telefono}</p>}
                {p.email && <p className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400 mt-1"><Mail className="w-3.5 h-3.5" />{p.email}</p>}
              </div>
            ))}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Mostrando {proveedores.length} de {totalProveedores}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => p - 1)}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded-lg text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ← Anterior
                </button>
                <span className="text-sm text-gray-600 dark:text-slate-300 px-2">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded-lg text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-4">{editando ? 'Editar proveedor' : 'Nuevo proveedor'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3" noValidate>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Nombre *</label>
                <input value={form.nombre} onChange={e => { setForm({...form, nombre: e.target.value}); setFormErrors(prev => ({...prev, nombre: undefined})); }} className={inputClass(formErrors.nombre)} />
                {formErrors.nombre && <p className="text-xs text-red-500 mt-1">{formErrors.nombre}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Contacto</label>
                <input value={form.contacto} onChange={e => setForm({...form, contacto: e.target.value})} placeholder="Nombre del contacto" className={inputClass()} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Teléfono</label>
                  <input value={form.telefono} onChange={e => { setForm({...form, telefono: e.target.value}); setFormErrors(prev => ({...prev, telefono: undefined})); }} placeholder="614-123-4567" className={inputClass(formErrors.telefono)} />
                  {formErrors.telefono && <p className="text-xs text-red-500 mt-1">{formErrors.telefono}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Email</label>
                  <input value={form.email} onChange={e => { setForm({...form, email: e.target.value}); setFormErrors(prev => ({...prev, email: undefined})); }} placeholder="contacto@empresa.com" className={inputClass(formErrors.email)} />
                  {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
                </div>
              </div>
              {guardarMutation.isError && (() => {
                const errData = (guardarMutation.error as any)?.response?.data;
                const campos = errData?.campos as Record<string, string> | undefined;
                return (
                  <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm px-3 py-2 rounded-lg border border-red-200 dark:border-red-800 space-y-1">
                    <p className="font-medium">{errData?.error || 'Error al guardar el proveedor'}</p>
                    {campos && Object.entries(campos).map(([campo, msg]) => (
                      <p key={campo} className="text-xs">• <span className="font-medium capitalize">{campo}</span>: {msg}</p>
                    ))}
                  </div>
                );
              })()}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={cerrarForm} className="flex-1 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-700">Cancelar</button>
                <button type="submit" disabled={guardarMutation.isPending} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmId !== null}
        title="¿Eliminar proveedor?"
        description="Esta acción no se puede deshacer."
        loading={eliminarMutation.isPending}
        onConfirm={() => confirmId !== null && eliminarMutation.mutate(confirmId)}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}