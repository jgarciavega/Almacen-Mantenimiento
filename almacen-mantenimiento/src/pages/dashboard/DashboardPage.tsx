import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, ArrowLeftRight, AlertTriangle, TrendingUp, ArrowUp, ArrowDown, X, MapPin } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell,
} from 'recharts';
import api from '../../services/api';
import { Resumen } from '../../types';
import { StatsSkeleton } from '../../components/ui/Skeleton';
import { useThemeStore } from '../../store/themeStore';

const CAT_COLORS = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#f97316','#ec4899'];
type ModalType = 'articulos' | 'movimientos' | 'alertas' | null;
type Range = 7 | 30;

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

/* Tooltip personalizado para la gráfica de área */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-gray-700 dark:text-slate-200 mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: p.color }} />
          <span className="text-gray-500 dark:text-slate-400">{p.dataKey}:</span>
          <span className="font-bold" style={{ color: p.color }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

/* Tooltip personalizado para la dona */
function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl shadow-lg px-3 py-2 text-sm">
      <p className="font-semibold text-gray-700 dark:text-slate-200">{name}</p>
      <p className="text-gray-500 dark:text-slate-400">{value} artículo{value !== 1 ? 's' : ''}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [range, setRange] = useState<Range>(30);
  const { isDark } = useThemeStore();

  const { data, isLoading, isError } = useQuery<Resumen>({
    queryKey: ['resumen'],
    queryFn: () => api.get('/reportes/resumen').then(r => r.data),
    retry: false,
  });

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
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = range === 7
        ? d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' })
        : d.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
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
  }, [movs30, range]);

  const totals = useMemo(() =>
    chartData.reduce((acc, d) => ({
      entradas: acc.entradas + d.Entradas,
      salidas:  acc.salidas  + d.Salidas,
    }), { entradas: 0, salidas: 0 }),
  [chartData]);

  const categoryData = useMemo(() =>
    (data?.productosPorCategoria ?? []).map(c => ({ name: c.nombre, value: c.total })),
  [data]);

  const gridColor   = isDark ? '#334155' : '#f1f5f9';
  const tickColor   = isDark ? '#94a3b8' : '#9ca3af';

  if (isLoading) return <StatsSkeleton />;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Dashboard</h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Resumen general del almacén</p>
      </div>

      {isError && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 px-4 py-3 rounded-lg text-sm">
          ⚠️ No se pudo conectar al servidor. Asegúrate que el backend esté corriendo.
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={Package}        label="Total artículos"  value={data?.totalProductos ?? '--'}      color="bg-blue-500"   onClick={() => setActiveModal('articulos')} />
        <StatCard icon={ArrowLeftRight} label="Movimientos hoy"  value={data?.totalMovimientosHoy ?? '--'} color="bg-green-500"  onClick={() => setActiveModal('movimientos')} />
        <StatCard icon={AlertTriangle}  label="Alertas de stock" value={data?.productosConAlerta ?? '--'}  color="bg-orange-500" onClick={() => setActiveModal('alertas')} />
      </div>

      {/* Gráfica de área + Dona */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Área — movimientos */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 transition-colors">
          {/* Encabezado */}
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <h2 className="font-semibold text-gray-900 dark:text-slate-100">Movimientos</h2>
            </div>
            {/* Selector de rango */}
            <div className="flex gap-1 bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
              {([7, 30] as Range[]).map(r => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    range === r
                      ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
                  }`}
                >
                  {r}d
                </button>
              ))}
            </div>
          </div>

          {/* Totales del período */}
          <div className="flex gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              <span className="text-xs text-gray-500 dark:text-slate-400">Entradas</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">+{totals.entradas}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
              <span className="text-xs text-gray-500 dark:text-slate-400">Salidas</span>
              <span className="text-sm font-bold text-rose-500 dark:text-rose-400">-{totals.salidas}</span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradEntradas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradSalidas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis
                dataKey="fecha"
                tick={{ fontSize: 10, fill: tickColor }}
                tickLine={false}
                axisLine={false}
                interval={range === 7 ? 0 : 4}
              />
              <YAxis
                tick={{ fontSize: 10, fill: tickColor }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: gridColor, strokeWidth: 1 }} />
              <Area dataKey="Entradas" type="monotone" stroke="#10b981" strokeWidth={2} fill="url(#gradEntradas)" dot={false} activeDot={{ r: 4, fill: '#10b981' }} />
              <Area dataKey="Salidas"  type="monotone" stroke="#f43f5e" strokeWidth={2} fill="url(#gradSalidas)"  dot={false} activeDot={{ r: 4, fill: '#f43f5e' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Dona — categorías */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 transition-colors flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold text-gray-900 dark:text-slate-100">Por categoría</h2>
          </div>

          {!categoryData.length ? (
            <p className="text-gray-400 dark:text-slate-500 text-sm text-center py-8 flex-1">Sin categorías</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Leyenda manual */}
              <div className="mt-3 space-y-1.5">
                {categoryData.map((c, i) => (
                  <div key={c.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }} />
                      <span className="text-gray-600 dark:text-slate-300 truncate">{c.name}</span>
                    </div>
                    <span className="font-semibold text-gray-800 dark:text-slate-200 ml-2">{c.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Últimos movimientos + Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 transition-colors">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-gray-400 dark:text-slate-500" />
            <h2 className="font-semibold text-gray-900 dark:text-slate-100">Últimos movimientos</h2>
          </div>
          {!data?.ultimosMovimientos?.length ? (
            <p className="text-gray-400 dark:text-slate-500 text-sm text-center py-8">Sin movimientos registrados</p>
          ) : (
            <div className="space-y-3">
              {data.ultimosMovimientos.map((m) => (
                <div key={m.id} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    m.tipo === 'ENTRADA' ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-rose-100 dark:bg-rose-900/40'
                  }`}>
                    {m.tipo === 'ENTRADA'
                      ? <ArrowDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      : <ArrowUp   className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">{m.producto.nombre}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">{m.usuario.nombre}</p>
                  </div>
                  <span className={`text-sm font-semibold flex-shrink-0 ${
                    m.tipo === 'ENTRADA' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
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
                  a.critico
                    ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                    : 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800'
                }`}>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">{a.nombre}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">{a.categoria} · {a.sku}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className={`text-sm font-bold ${a.critico ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`}>
                      {a.stockActual} <span className="font-normal text-xs">{a.unidad}</span>
                    </p>
                    {a.critico && <span className="text-xs bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded font-medium">SIN STOCK</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modales */}
      {activeModal === 'articulos' && (
        <Modal title={`Total artículos — ${data?.totalProductos ?? 0} en inventario`} onClose={() => setActiveModal(null)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-slate-400">Distribución por categoría</p>
            {!data?.productosPorCategoria?.length ? (
              <p className="text-gray-400 dark:text-slate-500 text-sm">Sin datos</p>
            ) : (
              <div className="space-y-3">
                {data.productosPorCategoria.map((c, i) => {
                  const pct = data.totalProductos > 0 ? Math.round((c.total / data.totalProductos) * 100) : 0;
                  return (
                    <div key={c.nombre}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-800 dark:text-slate-200">{c.nombre}</span>
                        <span className="text-gray-500 dark:text-slate-400">{c.total} artículo{c.total !== 1 ? 's' : ''} · {pct}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }} />
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
                  m.tipo === 'ENTRADA'
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    m.tipo === 'ENTRADA' ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-rose-100 dark:bg-rose-900/40'
                  }`}>
                    {m.tipo === 'ENTRADA'
                      ? <ArrowDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      : <ArrowUp   className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">{m.producto.nombre}</p>
                      <span className={`text-sm font-bold flex-shrink-0 ${m.tipo === 'ENTRADA' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {m.tipo === 'ENTRADA' ? '+' : '-'}{m.cantidad} {m.producto.unidad}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                      <span>Por: <b className="text-gray-700 dark:text-slate-300">{m.usuario.nombre}</b></span>
                      {m.entregadoPor && <span>Entrega: <b className="text-gray-700 dark:text-slate-300">{m.entregadoPor}</b></span>}
                      {m.recibidoPor  && <span>Recibe: <b className="text-gray-700 dark:text-slate-300">{m.recibidoPor}</b></span>}
                      {m.motivo       && <span>Motivo: {m.motivo}</span>}
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
                  a.critico
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{a.nombre}</p>
                        {a.critico && <span className="text-xs bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded font-medium">SIN STOCK</span>}
                      </div>
                      <div className="flex flex-wrap gap-x-3 mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                        <span>SKU: {a.sku}</span>
                        <span>Categoría: {a.categoria}</span>
                        {a.ubicacion && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{a.ubicacion}</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-lg font-bold ${a.critico ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`}>
                        {a.stockActual} <span className="text-sm font-normal">{a.unidad}</span>
                      </p>
                      <p className="text-xs text-gray-400 dark:text-slate-500">mín: {a.stockMinimo} {a.unidad}</p>
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
