import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Phone, Mail, MapPin, Save, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

interface ConfigData {
  empresaNombre: string;
  empresaSlogan: string;
  empresaDireccion: string;
  empresaTelefono: string;
  empresaEmail: string;
  sistemaNombre: string;
}

const defaultConfig: ConfigData = {
  empresaNombre: '',
  empresaSlogan: '',
  empresaDireccion: '',
  empresaTelefono: '',
  empresaEmail: '',
  sistemaNombre: 'Control de Almacén',
};

export default function ConfiguracionPage() {
  const qc = useQueryClient();
  const { usuario } = useAuthStore();
  const esAdmin = usuario?.rol === 'ADMIN';
  const [config, setConfig] = useState<ConfigData>(defaultConfig);
  const [cargado, setCargado] = useState(false);

  const { isLoading, data: serverData } = useQuery({
    queryKey: ['configuracion'],
    queryFn: () => api.get('/configuracion').then(r => r.data),
  });

  useEffect(() => {
    if (serverData) {
      setConfig({
        empresaNombre:    serverData.empresaNombre    ?? '',
        empresaSlogan:    serverData.empresaSlogan    ?? '',
        empresaDireccion: serverData.empresaDireccion ?? '',
        empresaTelefono:  serverData.empresaTelefono  ?? '',
        empresaEmail:     serverData.empresaEmail     ?? '',
        sistemaNombre:    serverData.sistemaNombre    || 'Control de Almacén',
      });
      setCargado(true);
    }
  }, [serverData]);

  const guardarMutation = useMutation({
    mutationFn: (data: ConfigData) => api.put('/configuracion', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['configuracion'] });
      toast.success('Configuración guardada');
    },
    onError: () => toast.error('Error al guardar la configuración'),
  });

  const handleGuardar = (e: React.FormEvent) => {
    e.preventDefault();
    guardarMutation.mutate(config);
  };

  const inputClass = `w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed`;

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Configuración</h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Datos del sistema y la empresa</p>
        {!esAdmin && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Solo el administrador puede modificar la configuración.</p>
        )}
      </div>

      {isLoading && !cargado ? (
        <div className="flex items-center gap-2 text-gray-400 dark:text-slate-500 py-12">
          <Loader2 className="w-5 h-5 animate-spin" /> Cargando configuración...
        </div>
      ) : (
      <form onSubmit={handleGuardar} className="space-y-6">
        {/* Sistema */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-500" />
            Información del sistema
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Nombre del sistema</label>
            <input
              value={config.sistemaNombre}
              onChange={e => setConfig({ ...config, sistemaNombre: e.target.value })}
              placeholder="Control de Almacén"
              disabled={!esAdmin}
              className={inputClass}
            />
          </div>
        </div>

        {/* Empresa */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-green-500" />
            Datos de la empresa
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Nombre de la empresa *</label>
              <input
                value={config.empresaNombre}
                onChange={e => setConfig({ ...config, empresaNombre: e.target.value })}
                placeholder="Ej: Industrias García S.A. de C.V."
                disabled={!esAdmin}
                className={inputClass}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Slogan / Descripción</label>
              <input
                value={config.empresaSlogan}
                onChange={e => setConfig({ ...config, empresaSlogan: e.target.value })}
                placeholder="Ej: Área de Mantenimiento Industrial"
                disabled={!esAdmin}
                className={inputClass}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Dirección</span>
              </label>
              <input
                value={config.empresaDireccion}
                onChange={e => setConfig({ ...config, empresaDireccion: e.target.value })}
                placeholder="Ej: Av. Industrial 500, Zona Norte"
                disabled={!esAdmin}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> Teléfono</span>
              </label>
              <input
                value={config.empresaTelefono}
                onChange={e => setConfig({ ...config, empresaTelefono: e.target.value })}
                placeholder="555-0000"
                disabled={!esAdmin}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> Email</span>
              </label>
              <input
                type="email"
                value={config.empresaEmail}
                onChange={e => setConfig({ ...config, empresaEmail: e.target.value })}
                placeholder="contacto@empresa.com"
                disabled={!esAdmin}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        {config.empresaNombre && (
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
            <p className="text-xs text-gray-400 dark:text-slate-500 uppercase font-medium mb-3">Vista previa del encabezado en reportes</p>
            <div className="border-b border-gray-300 dark:border-slate-600 pb-3 mb-2">
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">{config.empresaNombre}</h3>
              {config.empresaSlogan && <p className="text-sm text-gray-500 dark:text-slate-400">{config.empresaSlogan}</p>}
              <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500 dark:text-slate-400">
                {config.empresaDireccion && <span>📍 {config.empresaDireccion}</span>}
                {config.empresaTelefono && <span>📞 {config.empresaTelefono}</span>}
                {config.empresaEmail && <span>✉️ {config.empresaEmail}</span>}
              </div>
            </div>
            <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">{config.sistemaNombre || 'Control de Almacén'}</p>
          </div>
        )}

        {esAdmin && (
          <button
            type="submit"
            disabled={guardarMutation.isPending}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
          >
            {guardarMutation.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
              : <><Save className="w-4 h-4" /> Guardar cambios</>}
          </button>
        )}
      </form>
      )}
    </div>
  );
}
