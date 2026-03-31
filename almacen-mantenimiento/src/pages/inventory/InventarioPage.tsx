import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, AlertTriangle, QrCode, X, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../services/api';
import { Producto } from '../../types';
import { TableSkeleton } from '../../components/ui/Skeleton';

type FormErrors = {
  nombre?: string;
  sku?: string;
  categoriaId?: string;
  unidad?: string;
  stockActual?: string;
  stockMinimo?: string;
};

function validateForm(form: { nombre: string; sku: string; categoriaId: string; unidad: string; stockActual: number; stockMinimo: number }): FormErrors {
  const errors: FormErrors = {};
  if (!form.nombre.trim()) errors.nombre = 'El nombre es obligatorio';
  else if (form.nombre.trim().length < 2) errors.nombre = 'Mínimo 2 caracteres';
  if (!form.sku.trim()) errors.sku = 'El SKU es obligatorio';
  else if (!/^[A-Za-z0-9_\-]+$/.test(form.sku.trim())) errors.sku = 'Solo letras, números, guiones y guiones bajos';
  if (!form.categoriaId) errors.categoriaId = 'Selecciona una categoría';
  if (!form.unidad.trim()) errors.unidad = 'La unidad es obligatoria';
  if (form.stockActual < 0) errors.stockActual = 'No puede ser negativo';
  if (form.stockMinimo < 0) errors.stockMinimo = 'No puede ser negativo';
  return errors;
}

export default function InventarioPage() {
  const qc = useQueryClient();
  const [buscar, setBuscar] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Producto | null>(null);
  const [form, setForm] = useState({ nombre: '', sku: '', descripcion: '', stockActual: 0, stockMinimo: 1, unidad: 'pza', ubicacion: '', categoriaId: '' });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [qrProducto, setQrProducto] = useState<Producto | null>(null);

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
    setFormErrors({});
    setShowForm(true);
  };

  const cerrarForm = () => {
    setShowForm(false);
    setEditando(null);
    setFormErrors({});
    setForm({ nombre: '', sku: '', descripcion: '', stockActual: 0, stockMinimo: 1, unidad: 'pza', ubicacion: '', categoriaId: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm(form);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    crearMutation.mutate({ ...form, categoriaId: Number(form.categoriaId) });
  };

  const downloadQR = () => {
    if (!qrProducto) return;
    const svg = document.querySelector('#qr-svg svg') as SVGElement;
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = 200; canvas.height = 200;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => { ctx?.drawImage(img, 0, 0); canvas.toBlob(blob => { if (blob) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `qr-${qrProducto.sku}.png`; a.click(); URL.revokeObjectURL(url); } }); };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Inventario</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">{productos.length} artículos</p>
        </div>
        <button onClick={() => { setShowForm(true); setFormErrors({}); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
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
          className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400"
        />
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={6} cols={8} />
        ) : productos.length === 0 ? (
          <div className="p-12 text-center text-gray-400 dark:text-slate-500">
            <p className="text-lg">Sin artículos registrados</p>
            <p className="text-sm mt-1">Agrega tu primer artículo con el botón de arriba</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700">
              <tr>
                {['SKU', 'Nombre', 'Categoría', 'Stock', 'Mínimo', 'Unidad', 'Ubicación', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
              {productos.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-slate-400">{p.sku}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-slate-100">{p.nombre}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{p.categoria.nombre}</td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${p.stockActual <= p.stockMinimo ? 'text-red-600' : 'text-gray-900 dark:text-slate-100'}`}>
                      {p.stockActual <= p.stockMinimo && <AlertTriangle className="inline w-3 h-3 mr-1" />}
                      {p.stockActual}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-slate-400">{p.stockMinimo}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-slate-400">{p.unidad}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-slate-400">{p.ubicacion || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setQrProducto(p)} className="p-1 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400" title="Ver QR"><QrCode className="w-4 h-4" /></button>
                      <button onClick={() => abrirEditar(p)} className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => { if (confirm('¿Eliminar este artículo?')) eliminarMutation.mutate(p.id); }} className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal QR */}
      {qrProducto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Código QR</h2>
              <button onClick={() => setQrProducto(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div id="qr-svg" className="flex justify-center mb-4 p-4 bg-white rounded-xl inline-block mx-auto">
              <QRCodeSVG
                value={`SKU:${qrProducto.sku}|NOMBRE:${qrProducto.nombre}|STOCK:${qrProducto.stockActual}${qrProducto.ubicacion ? '|UB:' + qrProducto.ubicacion : ''}`}
                size={180}
                level="M"
              />
            </div>
            <p className="font-semibold text-gray-900 dark:text-slate-100 text-base">{qrProducto.nombre}</p>
            <p className="font-mono text-sm text-gray-500 dark:text-slate-400 mt-1">{qrProducto.sku}</p>
            {qrProducto.ubicacion && <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">📍 {qrProducto.ubicacion}</p>}
            <div className="flex gap-3 mt-5">
              <button onClick={() => setQrProducto(null)} className="flex-1 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-700">
                Cerrar
              </button>
              <button onClick={downloadQR} className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-sm">
                <Download className="w-4 h-4" /> Descargar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-4">{editando ? 'Editar artículo' : 'Nuevo artículo'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3" noValidate>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Nombre *</label>
                  <input value={form.nombre} onChange={e => { setForm({...form, nombre: e.target.value}); setFormErrors(prev => ({...prev, nombre: undefined})); }} className={inputClass(formErrors.nombre)} />
                  {formErrors.nombre && <p className="text-xs text-red-500 mt-1">{formErrors.nombre}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">SKU *</label>
                  <input value={form.sku} onChange={e => { setForm({...form, sku: e.target.value.toUpperCase()}); setFormErrors(prev => ({...prev, sku: undefined})); }} className={inputClass(formErrors.sku)} placeholder="EJ: FILT-001" />
                  {formErrors.sku && <p className="text-xs text-red-500 mt-1">{formErrors.sku}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Categoría *</label>
                  <select value={form.categoriaId} onChange={e => { setForm({...form, categoriaId: e.target.value}); setFormErrors(prev => ({...prev, categoriaId: undefined})); }} className={inputClass(formErrors.categoriaId)}>
                    <option value="">Seleccionar...</option>
                    {categorias.map((c: any) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                  {formErrors.categoriaId && <p className="text-xs text-red-500 mt-1">{formErrors.categoriaId}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Unidad *</label>
                  <input value={form.unidad} onChange={e => { setForm({...form, unidad: e.target.value}); setFormErrors(prev => ({...prev, unidad: undefined})); }} className={inputClass(formErrors.unidad)} placeholder="pza, m, kg, L..." />
                  {formErrors.unidad && <p className="text-xs text-red-500 mt-1">{formErrors.unidad}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Stock actual</label>
                  <input type="number" min="0" value={form.stockActual} onChange={e => { setForm({...form, stockActual: Number(e.target.value)}); setFormErrors(prev => ({...prev, stockActual: undefined})); }} className={inputClass(formErrors.stockActual)} />
                  {formErrors.stockActual && <p className="text-xs text-red-500 mt-1">{formErrors.stockActual}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Stock mínimo</label>
                  <input type="number" min="0" value={form.stockMinimo} onChange={e => { setForm({...form, stockMinimo: Number(e.target.value)}); setFormErrors(prev => ({...prev, stockMinimo: undefined})); }} className={inputClass(formErrors.stockMinimo)} />
                  {formErrors.stockMinimo && <p className="text-xs text-red-500 mt-1">{formErrors.stockMinimo}</p>}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Ubicación</label>
                <input value={form.ubicacion} onChange={e => setForm({...form, ubicacion: e.target.value})} placeholder="Ej: Estante A-3" className={inputClass()} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Descripción</label>
                <textarea value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} rows={2} className={inputClass()} />
              </div>
              {crearMutation.isError && (
                <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm px-3 py-2 rounded-lg border border-red-200 dark:border-red-800">
                  {(crearMutation.error as any)?.response?.data?.error || 'Error al guardar el artículo'}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={cerrarForm} className="flex-1 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-700">Cancelar</button>
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