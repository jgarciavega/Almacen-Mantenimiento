import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Shield, UserCheck, KeyRound, UserX, RotateCcw, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const inputCls = 'w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function UsuariosPage() {
  const qc = useQueryClient();
  const { usuario: yo } = useAuthStore();

  // — estados formulario usuario
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<any>(null);
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'ALMACENISTA' });

  // — estados cambiar contraseña propia
  const [showCambiarPwd, setShowCambiarPwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({ actual: '', nueva: '', confirmar: '' });

  // — mostrar inactivos
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  // — confirmación desactivar
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const { data: todosUsuarios = [], isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => api.get('/usuarios').then(r => r.data),
    retry: false,
    enabled: yo?.rol === 'ADMIN',
  });

  const usuariosFiltrados = mostrarInactivos
    ? todosUsuarios
    : (todosUsuarios as any[]).filter((u: any) => u.activo);

  const inactivosCount = (todosUsuarios as any[]).filter((u: any) => !u.activo).length;

  const guardarMutation = useMutation({
    mutationFn: (data: any) => editando
      ? api.put(`/usuarios/${editando.id}`, data)
      : api.post('/usuarios', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success(editando ? 'Usuario actualizado' : 'Usuario creado');
      cerrarForm();
    },
    onError: (err: any) => toast.error(err?.response?.data?.error ?? 'Error al guardar el usuario'),
  });

  const reactivarMutation = useMutation({
    mutationFn: (id: number) => api.put(`/usuarios/${id}`, { activo: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuario reactivado');
    },
    onError: () => toast.error('Error al reactivar el usuario'),
  });

  const desactivarMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/usuarios/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuario desactivado');
      setConfirmId(null);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error
        ?? err?.response?.data?.message
        ?? err?.message
        ?? 'Error al desactivar el usuario';
      toast.error(msg);
      setConfirmId(null);
    },
  });

  const cambiarPwdMutation = useMutation({
    mutationFn: (data: { passwordActual: string; passwordNuevo: string }) =>
      api.put('/usuarios/me/password', data),
    onSuccess: () => {
      toast.success('Contraseña actualizada correctamente');
      setShowCambiarPwd(false);
      setPwdForm({ actual: '', nueva: '', confirmar: '' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.error ?? 'Error al cambiar la contraseña'),
  });

  const cerrarForm = () => {
    setShowForm(false);
    setEditando(null);
    setForm({ nombre: '', email: '', password: '', rol: 'ALMACENISTA' });
  };

  const abrirEditar = (u: any) => {
    setEditando(u);
    setForm({ nombre: u.nombre, email: u.email, password: '', rol: u.rol });
    setShowForm(true);
  };

  const submitCambiarPwd = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdForm.nueva !== pwdForm.confirmar) {
      toast.error('Las contraseñas nuevas no coinciden');
      return;
    }
    if (pwdForm.nueva.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    cambiarPwdMutation.mutate({ passwordActual: pwdForm.actual, passwordNuevo: pwdForm.nueva });
  };

  // Vista para usuarios no-admin: solo pueden cambiar su contraseña
  if (yo?.rol !== 'ADMIN') {
    return (
      <div className="p-8 max-w-md mx-auto space-y-6">
        <div className="text-center">
          <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-slate-600" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">Mi cuenta</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Gestión de tu cuenta personal
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-slate-100">{yo?.nombre}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">{yo?.email}</p>
            </div>
          </div>

          <button
            onClick={() => setShowCambiarPwd(true)}
            className="w-full flex items-center justify-center gap-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            <KeyRound className="w-4 h-4" />
            Cambiar contraseña
          </button>
        </div>

        {showCambiarPwd && (
          <CambiarPasswordModal
            onClose={() => { setShowCambiarPwd(false); setPwdForm({ actual: '', nueva: '', confirmar: '' }); }}
            form={pwdForm}
            setForm={setPwdForm}
            onSubmit={submitCambiarPwd}
            isPending={cambiarPwdMutation.isPending}
          />
        )}
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Usuarios</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
            {(todosUsuarios as any[]).filter((u: any) => u.activo).length} activos
            {inactivosCount > 0 && ` · ${inactivosCount} inactivos`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCambiarPwd(true)}
            className="flex items-center gap-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-700"
          >
            <KeyRound className="w-4 h-4" />
            Mi contraseña
          </button>
          {inactivosCount > 0 && (
            <button
              onClick={() => setMostrarInactivos(v => !v)}
              className={`flex items-center gap-2 border px-3 py-2 rounded-lg text-sm ${
                mostrarInactivos
                  ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                  : 'border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              <UserX className="w-4 h-4" />
              {mostrarInactivos ? 'Ocultar inactivos' : `Ver inactivos (${inactivosCount})`}
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Nuevo usuario
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 dark:text-slate-500">Cargando...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700">
              <tr>
                {['Nombre', 'Email', 'Rol', 'Estado', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
              {usuariosFiltrados.map((u: any) => (
                <tr key={u.id} className={`hover:bg-gray-50 dark:hover:bg-slate-700/50 ${!u.activo ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-slate-100">
                    {u.nombre}
                    {u.id === yo?.id && <span className="ml-2 text-xs text-blue-500">(yo)</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-slate-400">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      u.rol === 'ADMIN'
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    }`}>
                      {u.rol === 'ADMIN' ? <Shield className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                      {u.rol}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.activo
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
                    }`}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      {u.activo ? (
                        <>
                          <button
                            onClick={() => abrirEditar(u)}
                            title="Editar"
                            className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {u.id !== yo?.id && (
                            <button
                              onClick={() => setConfirmId(u.id)}
                              title="Desactivar usuario"
                              className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          onClick={() => reactivarMutation.mutate(u.id)}
                          title="Reactivar usuario"
                          className="flex items-center gap-1 px-2 py-1 text-xs text-green-600 dark:text-green-400 border border-green-300 dark:border-green-700 rounded hover:bg-green-50 dark:hover:bg-green-900/20"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Reactivar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: Crear / Editar usuario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">
                {editando ? 'Editar usuario' : 'Nuevo usuario'}
              </h2>
              <button onClick={cerrarForm} className="p-1 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); guardarMutation.mutate(form); }} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Nombre *</label>
                <input required value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Email *</label>
                <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {editando ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}
                </label>
                <input type="password" required={!editando} value={form.password} onChange={e => setForm({...form, password: e.target.value})} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Rol</label>
                <select value={form.rol} onChange={e => setForm({...form, rol: e.target.value})} className={inputCls}>
                  <option value="ALMACENISTA">Almacenista</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={cerrarForm} className="flex-1 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-700">
                  Cancelar
                </button>
                <button type="submit" disabled={guardarMutation.isPending} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                  {guardarMutation.isPending ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cambiar contraseña propia */}
      {showCambiarPwd && (
        <CambiarPasswordModal
          onClose={() => { setShowCambiarPwd(false); setPwdForm({ actual: '', nueva: '', confirmar: '' }); }}
          form={pwdForm}
          setForm={setPwdForm}
          onSubmit={submitCambiarPwd}
          isPending={cambiarPwdMutation.isPending}
        />
      )}

      <ConfirmDialog
        open={confirmId !== null}
        title="¿Desactivar usuario?"
        description="El usuario no podrá iniciar sesión. Puedes reactivarlo en cualquier momento."
        confirmLabel="Desactivar"
        loading={desactivarMutation.isPending}
        onConfirm={() => { if (confirmId !== null) desactivarMutation.mutate(confirmId); }}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}

// ── Sub-componente: Modal cambiar contraseña ───────────────────────────────
interface CambiarPasswordProps {
  onClose: () => void;
  form: { actual: string; nueva: string; confirmar: string };
  setForm: (f: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
}

function CambiarPasswordModal({ onClose, form, setForm, onSubmit, isPending }: CambiarPasswordProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Cambiar contraseña</h2>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Contraseña actual *</label>
            <input
              type="password" required autoFocus
              value={form.actual}
              onChange={e => setForm({ ...form, actual: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Nueva contraseña *</label>
            <input
              type="password" required
              value={form.nueva}
              onChange={e => setForm({ ...form, nueva: e.target.value })}
              className={inputCls}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Confirmar nueva contraseña *</label>
            <input
              type="password" required
              value={form.confirmar}
              onChange={e => setForm({ ...form, confirmar: e.target.value })}
              className={inputCls}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-700">
              Cancelar
            </button>
            <button type="submit" disabled={isPending} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
              {isPending ? 'Guardando…' : 'Actualizar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
