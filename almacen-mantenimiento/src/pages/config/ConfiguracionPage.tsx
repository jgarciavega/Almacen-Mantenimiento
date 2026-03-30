import { useState, useEffect } from 'react';
import { Building2, Phone, Mail, MapPin, Save, CheckCircle } from 'lucide-react';

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
  const [config, setConfig] = useState<ConfigData>(defaultConfig);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('almacen-config');
    if (saved) setConfig(JSON.parse(saved));
  }, []);

  const handleGuardar = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('almacen-config', JSON.stringify(config));
    setGuardado(true);
    setTimeout(() => setGuardado(false), 3000);
  };

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-500 text-sm mt-1">Datos del sistema y la empresa</p>
      </div>

      <form onSubmit={handleGuardar} className="space-y-6">
        {/* Sistema */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-500" />
            Información del sistema
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del sistema</label>
            <input
              value={config.sistemaNombre}
              onChange={e => setConfig({ ...config, sistemaNombre: e.target.value })}
              placeholder="Control de Almacén"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Empresa */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-green-500" />
            Datos de la empresa
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la empresa *</label>
              <input
                value={config.empresaNombre}
                onChange={e => setConfig({ ...config, empresaNombre: e.target.value })}
                placeholder="Ej: Industrias García S.A. de C.V."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Slogan / Descripción</label>
              <input
                value={config.empresaSlogan}
                onChange={e => setConfig({ ...config, empresaSlogan: e.target.value })}
                placeholder="Ej: Área de Mantenimiento Industrial"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Dirección</span>
              </label>
              <input
                value={config.empresaDireccion}
                onChange={e => setConfig({ ...config, empresaDireccion: e.target.value })}
                placeholder="Ej: Av. Industrial 500, Zona Norte"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> Teléfono</span>
              </label>
              <input
                value={config.empresaTelefono}
                onChange={e => setConfig({ ...config, empresaTelefono: e.target.value })}
                placeholder="555-0000"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> Email</span>
              </label>
              <input
                type="email"
                value={config.empresaEmail}
                onChange={e => setConfig({ ...config, empresaEmail: e.target.value })}
                placeholder="contacto@empresa.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Preview encabezado de reportes */}
        {config.empresaNombre && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <p className="text-xs text-gray-400 uppercase font-medium mb-3">Vista previa del encabezado en reportes</p>
            <div className="border-b border-gray-300 pb-3 mb-2">
              <h3 className="text-lg font-bold text-gray-900">{config.empresaNombre}</h3>
              {config.empresaSlogan && <p className="text-sm text-gray-500">{config.empresaSlogan}</p>}
              <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                {config.empresaDireccion && <span>📍 {config.empresaDireccion}</span>}
                {config.empresaTelefono && <span>📞 {config.empresaTelefono}</span>}
                {config.empresaEmail && <span>✉️ {config.empresaEmail}</span>}
              </div>
            </div>
            <p className="text-sm font-semibold text-gray-700">{config.sistemaNombre || 'Control de Almacén'}</p>
          </div>
        )}

        <button
          type="submit"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-colors"
        >
          {guardado ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {guardado ? '¡Guardado!' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  );
}
