import { useQuery } from '@tanstack/react-query';
import { BarChart2, Download, TrendingUp, Package, Printer } from 'lucide-react';
import api from '../../services/api';

function getConfig() {
  try { return JSON.parse(localStorage.getItem('almacen-config') || '{}'); } catch { return {}; }
}

export default function ReportesPage() {
  const { data: masUsados = [] } = useQuery({
    queryKey: ['mas-usados'],
    queryFn: () => api.get('/reportes/mas-usados').then(r => r.data),
    retry: false,
  });

  const { data: stock = [] } = useQuery({
    queryKey: ['stock'],
    queryFn: () => api.get('/reportes/stock').then(r => r.data),
    retry: false,
  });

  const exportarCSV = () => {
    const headers = ['SKU', 'Nombre', 'Categoría', 'Stock Actual', 'Stock Mínimo', 'Unidad', 'Ubicación'];
    const rows = stock.map((p: any) => [p.sku, p.nombre, p.categoria.nombre, p.stockActual, p.stockMinimo, p.unidad, p.ubicacion ?? '']);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const imprimir = () => {
    const cfg = getConfig();
    const fecha = new Date().toLocaleString('es-MX');
    const filas = stock.map((p: any) => `
      <tr>
        <td>${p.sku}</td>
        <td>${p.nombre}</td>
        <td>${p.categoria.nombre}</td>
        <td style="text-align:center">${p.stockActual}</td>
        <td style="text-align:center">${p.stockMinimo}</td>
        <td style="text-align:center">${p.unidad}</td>
        <td style="text-align:center;color:${p.stockActual === 0 ? '#dc2626' : p.stockActual <= p.stockMinimo ? '#ea580c' : '#16a34a'};font-weight:600">${
          p.stockActual === 0 ? 'Sin stock' : p.stockActual <= p.stockMinimo ? 'Stock bajo' : 'OK'
        }</td>
        <td>${p.ubicacion ?? '—'}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Reporte de Stock</title>
    <style>
      body { font-family: Arial, sans-serif; font-size: 11px; margin: 20px; color: #111; }
      h1 { font-size: 16px; margin: 0; } h2 { font-size: 13px; margin: 0; color: #374151; }
      .header { border-bottom: 2px solid #1e3a5f; padding-bottom: 10px; margin-bottom: 15px; }
      .meta { color: #6b7280; font-size: 10px; margin-top: 4px; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      th { background: #1e3a5f; color: white; padding: 6px 8px; text-align: left; font-size: 10px; }
      td { padding: 5px 8px; border-bottom: 1px solid #e5e7eb; }
      tr:nth-child(even) td { background: #f9fafb; }
      @media print { body { margin: 10mm; } }
    </style></head><body>
    <div class="header">
      ${cfg.empresaNombre ? `<h1>${cfg.empresaNombre}</h1>` : ''}
      ${cfg.empresaSlogan ? `<p style="color:#6b7280;margin:2px 0">${cfg.empresaSlogan}</p>` : ''}
      <h2>${cfg.sistemaNombre || 'Control de Almacén'} — Reporte de Stock</h2>
      <p class="meta">Generado: ${fecha} · Total: ${stock.length} artículos</p>
    </div>
    <table>
      <thead><tr><th>SKU</th><th>Nombre</th><th>Categoría</th><th>Stock</th><th>Mínimo</th><th>Unidad</th><th>Estado</th><th>Ubicación</th></tr></thead>
      <tbody>${filas}</tbody>
    </table>
    </body></html>`;

    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); win.print(); }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-500 text-sm mt-1">Análisis del inventario</p>
        </div>
        <button onClick={exportarCSV} className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
        <button onClick={imprimir} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Printer className="w-4 h-4" /> Imprimir
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top artículos más usados */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold text-gray-900">Artículos más usados</h2>
          </div>
          {masUsados.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Sin datos de salidas</p>
          ) : (
            <div className="space-y-3">
              {masUsados.map((item: any, i: number) => {
                const max = masUsados[0]?.totalSalidas ?? 1;
                const pct = Math.round((item.totalSalidas / max) * 100);
                return (
                  <div key={item.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-900">{i + 1}. {item.nombre}</span>
                      <span className="text-gray-500">{item.totalSalidas} {item.unidad}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Stock actual */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-green-500" />
            <h2 className="font-semibold text-gray-900">Stock actual</h2>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {stock.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Sin artículos</p>
            ) : stock.map((p: any) => (
              <div key={p.id} className={`flex justify-between items-center p-2.5 rounded-lg ${
                p.stockActual <= p.stockMinimo ? 'bg-red-50' : 'bg-gray-50'
              }`}>
                <div>
                  <p className="text-sm font-medium text-gray-900">{p.nombre}</p>
                  <p className="text-xs text-gray-500">{p.categoria.nombre}</p>
                </div>
                <span className={`text-sm font-semibold ${p.stockActual <= p.stockMinimo ? 'text-red-600' : 'text-gray-700'}`}>
                  {p.stockActual} {p.unidad}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabla completa */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <BarChart2 className="w-5 h-5 text-gray-500" />
          <h2 className="font-semibold text-gray-900">Reporte de inventario completo</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['SKU', 'Nombre', 'Categoría', 'Stock', 'Mínimo', 'Estado', 'Unidad', 'Ubicación'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stock.map((p: any) => (
                <tr key={p.id} className={`hover:bg-gray-50 ${p.stockActual <= p.stockMinimo ? 'bg-red-50/30' : ''}`}>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.sku}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{p.nombre}</td>
                  <td className="px-4 py-3 text-gray-600">{p.categoria.nombre}</td>
                  <td className="px-4 py-3 font-semibold">{p.stockActual}</td>
                  <td className="px-4 py-3 text-gray-500">{p.stockMinimo}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      p.stockActual === 0 ? 'bg-red-100 text-red-700' :
                      p.stockActual <= p.stockMinimo ? 'bg-orange-100 text-orange-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {p.stockActual === 0 ? 'Sin stock' : p.stockActual <= p.stockMinimo ? 'Stock bajo' : 'OK'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{p.unidad}</td>
                  <td className="px-4 py-3 text-gray-500">{p.ubicacion || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
