import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, ArrowLeftRight, AlertTriangle, TrendingUp, ArrowUp, ArrowDown, X, MapPin } from 'lucide-react';
import api from '../../services/api';
import { Resumen } from '../../types';

type ModalType = 'articulos' | 'movimientos' | 'alertas' | null;

function StatCard({ icon: Icon, label, value, color, onClick }: {
  icon: any; label: string; value: number | string; color: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 w-full text-left hover:shadow-md hover:border-gray-200 transition-all group cursor-pointer"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
      <span className="text-xs text-gray-400 group-hover:text-blue-500 transition-colors">Ver detalle →</span>
    </button>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
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

  const { data, isLoading, isError } = useQuery<Resumen>({
    queryKey: ['resumen'],
    queryFn: () => api.get('/reportes/resumen').then(r => r.data),
    retry: false,
  });

  const { data: alertas } = useQuery({
    queryKey: ['alertas'],
    queryFn: () => api.get('/alertas').then(r => r.data),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="grid grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Resumen general del almacén</p>
      </div>

      {isError && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg text-sm">
          ⚠️ No se pudo conectar al servidor. Asegúrate que el backend esté corriendo.
        </div>
      )}

      {/* Stats clickeables */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={Package}        label="Total artículos"   value={data?.totalProductos ?? '--'}      color="bg-blue-500"   onClick={() => setActiveModal('articulos')} />
        <StatCard icon={ArrowLeftRight} label="Movimientos hoy"   value={data?.totalMovimientosHoy ?? '--'} color="bg-green-500"  onClick={() => setActiveModal('movimientos')} />
        <StatCard icon={AlertTriangle}  label="Alertas de stock"  value={data?.productosConAlerta ?? (alertas?.total ?? '--')} color="bg-orange-500" onClick={() => setActiveModal('alertas')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimos movimientos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-gray-500" />
            <h2 className="font-semibold text-gray-900">Últimos movimientos</h2>
          </div>
          {!data?.ultimosMovimientos?.length ? (
            <p className="text-gray-400 text-sm text-center py-8">Sin movimientos registrados</p>
          ) : (
            <div className="space-y-3">
              {data.ultimosMovimientos.map((m) => (
                <div key={m.id} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    m.tipo === 'ENTRADA' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {m.tipo === 'ENTRADA'
                      ? <ArrowDown className="w-4 h-4 text-green-600" />
                      : <ArrowUp className="w-4 h-4 text-red-600" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{m.producto.nombre}</p>
                    <p className="text-xs text-gray-500">{m.usuario.nombre}</p>
                  </div>
                  <span className={`text-sm font-semibold ${
                    m.tipo === 'ENTRADA' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {m.tipo === 'ENTRADA' ? '+' : '-'}{m.cantidad} {m.producto.unidad}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alertas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h2 className="font-semibold text-gray-900">Alertas de stock</h2>
          </div>
          {!alertas?.alertas?.length ? (
            <p className="text-gray-400 text-sm text-center py-8">✅ Todos los artículos tienen stock suficiente</p>
          ) : (
            <div className="space-y-2">
              {alertas.alertas.slice(0, 6).map((a: any) => (
                <div key={a.id} className={`flex items-center justify-between p-2.5 rounded-lg ${
                  a.critico ? 'bg-red-50 border border-red-200' : 'bg-orange-50 border border-orange-200'
                }`}>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{a.nombre}</p>
                    <p className="text-xs text-gray-500">{a.categoria} · {a.sku}</p>
                  </div>
                  <span className={`text-sm font-bold ${a.critico ? 'text-red-600' : 'text-orange-600'}`}>
                    {a.stockActual} {a.unidad}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal: Total artículos ── */}
      {activeModal === 'articulos' && (
        <Modal title={`Total artículos — ${data?.totalProductos ?? 0} en inventario`} onClose={() => setActiveModal(null)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Distribución por categoría</p>
            {!data?.productosPorCategoria?.length ? (
              <p className="text-gray-400 text-sm">Sin datos</p>
            ) : (
              <div className="space-y-3">
                {data.productosPorCategoria.map(c => {
                  const pct = data.totalProductos > 0 ? Math.round((c.total / data.totalProductos) * 100) : 0;
                  return (
                    <div key={c.nombre}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-800">{c.nombre}</span>
                        <span className="text-gray-500">{c.total} artículo{c.total !== 1 ? 's' : ''} · {pct}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
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

      {/* ── Modal: Movimientos hoy ── */}
      {activeModal === 'movimientos' && (
        <Modal title={`Movimientos hoy — ${data?.totalMovimientosHoy ?? 0} registros`} onClose={() => setActiveModal(null)}>
          {!data?.movimientosHoy?.length ? (
            <p className="text-gray-400 text-sm text-center py-8">Sin movimientos registrados hoy</p>
          ) : (
            <div className="space-y-2">
              {data.movimientosHoy.map(m => (
                <div key={m.id} className={`flex items-start gap-3 p-3 rounded-lg border ${
                  m.tipo === 'ENTRADA' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    m.tipo === 'ENTRADA' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {m.tipo === 'ENTRADA'
                      ? <ArrowDown className="w-4 h-4 text-green-600" />
                      : <ArrowUp className="w-4 h-4 text-red-600" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">{m.producto.nombre}</p>
                      <span className={`text-sm font-bold flex-shrink-0 ${m.tipo === 'ENTRADA' ? 'text-green-600' : 'text-red-600'}`}>
                        {m.tipo === 'ENTRADA' ? '+' : '-'}{m.cantidad} {m.producto.unidad}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-xs text-gray-500">
                      <span>Registrado por: <b>{m.usuario.nombre}</b></span>
                      {m.entregadoPor && <span>Entrega: <b>{m.entregadoPor}</b></span>}
                      {m.recibidoPor  && <span>Recibe: <b>{m.recibidoPor}</b></span>}
                      {m.motivo       && <span>Motivo: {m.motivo}</span>}
                      {m.referencia   && <span>Ref: {m.referencia}</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(m.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {/* ── Modal: Alertas de stock ── */}
      {activeModal === 'alertas' && (
        <Modal title={`Alertas de stock — ${data?.productosConAlerta ?? 0} artículos`} onClose={() => setActiveModal(null)}>
          {!data?.alertas?.length ? (
            <p className="text-gray-400 text-sm text-center py-8">✅ Todos los artículos tienen stock suficiente</p>
          ) : (
            <div className="space-y-2">
              {data.alertas.map((a: any) => (
                <div key={a.id} className={`p-3 rounded-lg border ${
                  a.critico ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900">{a.nombre}</p>
                        {a.critico && (
                          <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">SIN STOCK</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-3 mt-0.5 text-xs text-gray-500">
                        <span>SKU: {a.sku}</span>
                        <span>Categoría: {a.categoria}</span>
                        {a.ubicacion && (
                          <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{a.ubicacion}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-lg font-bold ${a.critico ? 'text-red-600' : 'text-orange-600'}`}>
                        {a.stockactual ?? a.stockActual} <span className="text-sm font-normal">{a.unidad}</span>
                      </p>
                      <p className="text-xs text-gray-400">mín: {a.stockminimo ?? a.stockMinimo} {a.unidad}</p>
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
