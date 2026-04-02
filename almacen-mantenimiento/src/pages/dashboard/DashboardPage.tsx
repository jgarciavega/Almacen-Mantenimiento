import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, ArrowLeftRight, AlertTriangle, TrendingUp, ArrowUp, ArrowDown, X, MapPin, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import api from '../../services/api';
import { Resumen } from '../../types';
import { StatsSkeleton } from '../../components/ui/Skeleton';
import { useThemeStore } from '../../store/themeStore';

type ModalType = 'articulos' | 'movimientos' | 'alertas' | null;

function StatCard({ icon: Icon, label, value, color, onClick }: {
  icon: any; label: string; value: number | string; color: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-4 w-full text-left hover:shadow-md hover:border-gray-200 dark:hover:border-slate-600 transition-all group cursor-pointer"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1">
        <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{value}</p>
        <p className="text-sm text-gray-500 dark:text-slate-400">{label}</p>
      </div>
      <span className="text-xs text-gray-400 dark:text-slate-500 group-hover:text-blue-500 transition-colors">Ver detalle →</span>
    </button>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const { isDark } = useThemeStore();

  const { data, isLoading, isError } = useQuery<Resumen>({
    queryKey: ['resumen'],
    queryFn: () => api.get('/reportes/resumen').then(r => r.data),
    retry: false,
  });

  // Últimos 30 días para gráfica
  const desde30 = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() - 29); d.setHours(0,0,0,0);
    return d.toISOString();
  }, []);

  const { data: movs30 = [] } = useQuery({
    queryKey: ['movimientos-30', desde30],
    queryFn: () => api.get('/reportes/movimientos', { params: { desde: desde30 } }).then(r => r.data),
    retry: false,
  });

  const chartData = useMemo(() => {
    const map: Record<string, { fecha: string; Entradas: number; Salidas: number }> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
      map[key] = { fecha: label, Entradas: 0, Salidas: 0 };
    }
    (movs30 as any[]).forEach((m: any) => {
      const key = new Date(m.createdAt).toISOString().slice(0, 10);
      if (map[key]) {
        if (m.tipo === 'ENTRADA') map[key].Entradas += m.cantidad;
        else map[key].Salidas += m.cantidad;
      }
    });
    return Object.values(map);
  }, [movs30]);

  if (isLoading) return <StatsSkeleton />;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Dashboard</h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Resumen general del almacén</p>
      </div>

      {isError && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 px-4 py-3 rounded-lg text-sm">
          ⚠️ No se pudo conectar al servidor. Asegúrate que el backend esté corriendo.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={Package}        label="Total artículos"   value={data?.totalProductos ?? '--'}      color="bg-blue-500"   onClick={() => setActiveModal('articulos')} />
        <StatCard icon={ArrowLeftRight} label="Movimientos hoy"   value={data?.totalMovimientosHoy ?? '--'} color="bg-green-500"  onClick={() => setActiveModal('movimientos')} />
        <StatCard icon={AlertTriangle}  label="Alertas de stock"  value={data?.productosConAlerta ?? '--'} color="bg-orange-500" onClick={() => setActiveModal('alertas')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 transition-colors">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-gray-500 dark:text-slate-400" />
            <h2 className="font-semibold text-gray-900 dark:text-slate-100">Últimos movimientos</h2>
          </div>
          {!data?.ultimosMovimientos?.length ? (
            <p className="text-gray-400 dark:text-slate-500 text-sm text-center py-8">Sin movimientos registrados</p>
          ) : (
            <div className="space-y-3">
              {data.ultimosMovimientos.map((m) => (
                <div key={m.id} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    m.tipo === 'ENTRADA' ? 'bg-green-100 dark:bg-green-900/40' : 'bg-red-100 dark:bg-red-900/40'
                  }`}>
                    {m.tipo === 'ENTRADA'
                      ? <ArrowDown className="w-4 h-4 text-green-600 dark:text-green-400" />
                      : <ArrowUp className="w-4 h-4 text-red-600 dark:text-red-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">{m.producto.nombre}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">{m.usuario.nombre}</p>
                  </div>
                  <span className={`text-sm font-semibold ${
                    m.tipo === 'ENTRADA' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {m.tipo === 'ENTRADA' ? '+' : '-'}{m.cantidad} {m.producto.unidad}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 transition-colors">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h2 className="font-semibold text-gray-900 dark:text-slate-100">Alertas de stock</h2>
          </div>
          {!data?.alertas?.length ? (
            <p className="text-gray-400 dark:text-slate-500 text-sm text-center py-8">✅ Todos los artículos tienen stock suficiente</p>
          ) : (
            <div className="space-y-2">
              {data.alertas.slice(0, 6).map((a: any) => (
                <div key={a.id} className={`flex items-center justify-between p-2.5 rounded-lg ${
                  a.critico ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800'
                }`}>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{a.nombre}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">{a.categoria} · {a.sku}</p>
                  </div>
                  <span className={`text-sm font-bold ${a.critico ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`}>
                    {a.stockActual} {a.unidad}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Gráfica de consumo — últimos 30 días */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 transition-colors">
        <div className="flex items-center gap-2 mb-5">
          <BarChart2 className="w-5 h-5 text-blue-500" />
          <h2 className="font-semibold text-gray-900 dark:text-slate-100">Consumo últimos 30 días</h2>
          <span className="ml-auto text-xs text-gray-400 dark:text-slate-500">Unidades totales por día</span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }} barSize={8} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#f1f5f9'} vertical={false} />
            <XAxis
              dataKey="fecha"
              tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              interval={4}
            />
            <YAxis
              tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#1e293b' : '#fff',
                border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                borderRadius: '0.5rem',
                fontSize: '12px',
                color: isDark ? '#f1f5f9' : '#111827',
              }}
              cursor={{ fill: isDark ? '#334155' : '#f3f4f6' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
            <Bar dataKey="Entradas" fill="#22c55e" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Salidas"  fill="#ef4444" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {activeModal === 'articulos' && (
        <Modal title={`Total artículos — ${data?.totalProductos ?? 0} en inventario`} onClose={() => setActiveModal(null)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-slate-400">Distribución por categoría</p>
            {!data?.productosPorCategoria?.length ? (
              <p className="text-gray-400 dark:text-slate-500 text-sm">Sin datos</p>
            ) : (
              <div className="space-y-3">
                {data.productosPorCategoria.map(c => {
                  const pct = data.totalProductos > 0 ? Math.round((c.total / data.totalProductos) * 100) : 0;
                  return (
                    <div key={c.nombre}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-800 dark:text-slate-200">{c.nombre}</span>
                        <span className="text-gray-500 dark:text-slate-400">{c.total} artículo{c.total !== 1 ? 's' : ''} · {pct}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Modal>
      )}

      {activeModal === 'movimientos' && (
        <Modal title={`Movimientos hoy — ${data?.totalMovimientosHoy ?? 0} registros`} onClose={() => setActiveModal(null)}>
          {!data?.movimientosHoy?.length ? (
            <p className="text-gray-400 dark:text-slate-500 text-sm text-center py-8">Sin movimientos registrados hoy</p>
          ) : (
            <div className="space-y-2">
              {data.movimientosHoy.map(m => (
                <div key={m.id} className={`flex items-start gap-3 p-3 rounded-lg border ${
                  m.tipo === 'ENTRADA' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    m.tipo === 'ENTRADA' ? 'bg-green-100 dark:bg-green-900/40' : 'bg-red-100 dark:bg-red-900/40'
                  }`}>
                    {m.tipo === 'ENTRADA'
                      ? <ArrowDown className="w-4 h-4 text-green-600 dark:text-green-400" />
                      : <ArrowUp className="w-4 h-4 text-red-600 dark:text-red-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">{m.producto.nombre}</p>
                      <span className={`text-sm font-bold flex-shrink-0 ${m.tipo === 'ENTRADA' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {m.tipo === 'ENTRADA' ? '+' : '-'}{m.cantidad} {m.producto.unidad}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                      <span>Registrado por: <b className="text-gray-700 dark:text-slate-300">{m.usuario.nombre}</b></span>
                      {m.entregadoPor && <span>Entrega: <b className="text-gray-700 dark:text-slate-300">{m.entregadoPor}</b></span>}
                      {m.recibidoPor  && <span>Recibe: <b className="text-gray-700 dark:text-slate-300">{m.recibidoPor}</b></span>}
                      {m.motivo       && <span>Motivo: {m.motivo}</span>}
                      {m.referencia   && <span>Ref: {m.referencia}</span>}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{new Date(m.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {activeModal === 'alertas' && (
        <Modal title={`Alertas de stock — ${data?.productosConAlerta ?? 0} artículos`} onClose={() => setActiveModal(null)}>
          {!data?.alertas?.length ? (
            <p className="text-gray-400 dark:text-slate-500 text-sm text-center py-8">✅ Todos los artículos tienen stock suficiente</p>
          ) : (
            <div className="space-y-2">
              {data.alertas.map((a: any) => (
                <div key={a.id} className={`p-3 rounded-lg border ${
                  a.critico ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{a.nombre}</p>
                        {a.critico && (
                          <span className="text-xs bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded font-medium">SIN STOCK</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-3 mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                        <span>SKU: {a.sku}</span>
                        <span>Categoría: {a.categoria}</span>
                        {a.ubicacion && (
                          <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{a.ubicacion}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-lg font-bold ${a.critico ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`}>
                        {a.stockactual ?? a.stockActual} <span className="text-sm font-normal">{a.unidad}</span>
                      </p>
                      <p className="text-xs text-gray-400 dark:text-slate-500">mín: {a.stockminimo ?? a.stockMinimo} {a.unidad}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}