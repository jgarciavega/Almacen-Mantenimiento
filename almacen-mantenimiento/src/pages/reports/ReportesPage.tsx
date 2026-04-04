import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart2, Download, TrendingUp, Package, Printer, FileText, TableIcon, CalendarRange, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { utils as xlsxUtils, writeFile as xlsxWriteFile } from 'xlsx';
import { toast } from 'sonner';
import api from '../../services/api';
import { Skeleton } from '../../components/ui/Skeleton';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function getConfig() {
  try { return JSON.parse(localStorage.getItem('almacen-config') || '{}'); } catch { return {}; }
}

export default function ReportesPage() {
  // Rango de fechas para exportar movimientos
  const today = new Date().toISOString().slice(0, 10);
  const hace30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [fechaDesde, setFechaDesde] = useState(hace30);
  const [fechaHasta, setFechaHasta] = useState(today);
  const [exportandoMov, setExportandoMov] = useState(false);

  // Paginación e inventario completo
  const [buscarStock, setBuscarStock] = useState('');
  const [pageStock, setPageStock] = useState(1);
  const PAGE_SIZE = 15;

  const { data: masUsados = [], isLoading: loadingUsados } = useQuery({
    queryKey: ['mas-usados'],
    queryFn: () => api.get('/reportes/mas-usados').then(r => r.data),
    retry: false,
  });

  const { data: stock = [], isLoading: loadingStock } = useQuery({
    queryKey: ['stock'],
    queryFn: () => api.get('/reportes/stock').then(r => r.data),
    retry: false,
  });

  // Filtro y paginación calculados fuera del JSX para evitar problemas con closures
  const stockFiltrado = (stock as any[]).filter((p: any) =>
    !buscarStock.trim() ||
    (p.nombre ?? '').toLowerCase().includes(buscarStock.toLowerCase()) ||
    (p.sku ?? '').toLowerCase().includes(buscarStock.toLowerCase())
  );
  const totalPagesStock = Math.max(1, Math.ceil(stockFiltrado.length / PAGE_SIZE));
  const safePageStock   = Math.min(pageStock, totalPagesStock);
  const stockPaginado   = stockFiltrado.slice((safePageStock - 1) * PAGE_SIZE, safePageStock * PAGE_SIZE);

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

  const exportarExcel = () => {
    const cfg = getConfig();
    const fecha = new Date().toISOString().slice(0, 10);

    // Hoja 1: Stock actual
    const stockRows = stock.map((p: any) => ({
      SKU: p.sku,
      Nombre: p.nombre,
      Categoría: p.categoria.nombre,
      'Stock Actual': p.stockActual,
      'Stock Mínimo': p.stockMinimo,
      Unidad: p.unidad,
      Estado: p.stockActual === 0 ? 'Sin stock' : p.stockActual <= p.stockMinimo ? 'Stock bajo' : 'OK',
      Ubicación: p.ubicacion ?? '',
    }));

    // Hoja 2: Más usados
    const usadosRows = masUsados.map((item: any, i: number) => ({
      '#': i + 1,
      Nombre: item.nombre,
      SKU: item.sku,
      'Total Salidas': item.totalSalidas,
      Unidad: item.unidad,
    }));

    const wb = xlsxUtils.book_new();
    const wsStock = xlsxUtils.json_to_sheet(stockRows);
    const wsUsados = xlsxUtils.json_to_sheet(usadosRows);

    // Ancho de columnas
    wsStock['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 18 }];
    wsUsados['!cols'] = [{ wch: 5 }, { wch: 30 }, { wch: 12 }, { wch: 14 }, { wch: 10 }];

    xlsxUtils.book_append_sheet(wb, wsStock, 'Stock Actual');
    xlsxUtils.book_append_sheet(wb, wsUsados, 'Más Usados');

    const nombre = cfg.sistemaNombre ? cfg.sistemaNombre.replace(/\s+/g, '-') : 'Almacen';
    xlsxWriteFile(wb, `${nombre}-reporte-${fecha}.xlsx`);
  };

  const exportarPDF = () => {
    const cfg = getConfig();
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const fecha = new Date().toLocaleString('es-MX');
    const titulo = cfg.sistemaNombre || 'Control de Almacén';
    const empresa = cfg.empresaNombre || '';

    doc.setFillColor(30, 58, 95);
    doc.rect(0, 0, 297, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(empresa ? `${empresa} — ${titulo}` : titulo, 10, 10);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Reporte de Stock · Generado: ${fecha} · Total: ${stock.length} artículos`, 10, 17);

    const rows = stock.map((p: any) => [
      p.sku,
      p.nombre,
      p.categoria.nombre,
      String(p.stockActual),
      String(p.stockMinimo),
      p.unidad,
      p.stockActual === 0 ? 'SIN STOCK' : p.stockActual <= p.stockMinimo ? 'STOCK BAJO' : 'OK',
      p.ubicacion ?? '—',
    ]);

    autoTable(doc, {
      startY: 26,
      head: [['SKU', 'Nombre', 'Categoría', 'Stock', 'Mínimo', 'Unidad', 'Estado', 'Ubicación']],
      body: rows,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [30, 58, 95], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      didParseCell: (data) => {
        if (data.column.index === 6 && data.section === 'body') {
          const val = String(data.cell.raw);
          if (val === 'SIN STOCK') {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = 'bold';
          } else if (val === 'STOCK BAJO') {
            data.cell.styles.textColor = [234, 88, 12];
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = [22, 163, 74];
          }
        }
      },
    });

    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text(`Página ${i} de ${pageCount}`, 287, 205, { align: 'right' });
    }

    doc.save(`reporte-stock-${new Date().toISOString().slice(0,10)}.pdf`);
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

  const exportarMovimientos = async () => {
    if (!fechaDesde || !fechaHasta) { toast.error('Selecciona el rango de fechas'); return; }
    setExportandoMov(true);
    try {
      const { data } = await api.get('/reportes/movimientos', {
        params: { desde: fechaDesde, hasta: fechaHasta + 'T23:59:59' },
      });
      if (!data || data.length === 0) { toast.info('No hay movimientos en ese rango'); return; }

      const rows = data.map((m: any) => ({
        Fecha: new Date(m.createdAt).toLocaleString('es-MX'),
        Tipo: m.tipo,
        Artículo: m.producto.nombre,
        SKU: m.producto.sku,
        Cantidad: m.cantidad,
        Unidad: m.producto.unidad,
        Motivo: m.motivo ?? '',
        Referencia: m.referencia ?? '',
        'Recibido por': m.recibidoPor ?? '',
        'Entregado por': m.entregadoPor ?? '',
        Usuario: m.usuario.nombre,
      }));

      const wb = xlsxUtils.book_new();
      const ws = xlsxUtils.json_to_sheet(rows);
      ws['!cols'] = [
        { wch: 20 }, { wch: 10 }, { wch: 28 }, { wch: 12 }, { wch: 10 },
        { wch: 8 }, { wch: 20 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 18 },
      ];
      xlsxUtils.book_append_sheet(wb, ws, 'Movimientos');
      xlsxWriteFile(wb, `movimientos-${fechaDesde}-al-${fechaHasta}.xlsx`);
      toast.success(`${data.length} movimientos exportados`);
    } catch {
      toast.error('Error al exportar movimientos');
    } finally {
      setExportandoMov(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Reportes</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Análisis del inventario</p>
        </div>
        <button onClick={exportarCSV} className="flex items-center gap-2 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
        <button onClick={exportarExcel} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <TableIcon className="w-4 h-4" /> Exportar Excel
        </button>
        <button onClick={exportarPDF} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <FileText className="w-4 h-4" /> Exportar PDF
        </button>
        <button onClick={imprimir} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Printer className="w-4 h-4" /> Imprimir
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 transition-colors">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold text-gray-900 dark:text-slate-100">Artículos más usados</h2>
          </div>
          {loadingUsados ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            </div>
          ) : masUsados.length === 0 ? (
            <p className="text-gray-400 dark:text-slate-500 text-sm text-center py-8">Sin datos de salidas</p>
          ) : (
            <div className="space-y-3">
              {masUsados.map((item: any, i: number) => {
                const max = masUsados[0]?.totalSalidas ?? 1;
                const pct = Math.round((item.totalSalidas / max) * 100);
                return (
                  <div key={item.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-900 dark:text-slate-100">{i + 1}. {item.nombre}</span>
                      <span className="text-gray-500 dark:text-slate-400">{item.totalSalidas} {item.unidad}</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 transition-colors">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-green-500" />
            <h2 className="font-semibold text-gray-900 dark:text-slate-100">Stock actual</h2>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {loadingStock ? (
              Array.from({length: 6}).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)
            ) : stock.length === 0 ? (
              <p className="text-gray-400 dark:text-slate-500 text-sm text-center py-8">Sin artículos</p>
            ) : stock.map((p: any) => (
              <div key={p.id} className={`flex justify-between items-center p-2.5 rounded-lg ${
                p.stockActual <= p.stockMinimo ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-slate-700/50'
              }`}>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{p.nombre}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{p.categoria.nombre}</p>
                </div>
                <span className={`text-sm font-semibold ${p.stockActual <= p.stockMinimo ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-slate-200'}`}>
                  {p.stockActual} {p.unidad}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 transition-colors">
        {/* Encabezado con búsqueda */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <BarChart2 className="w-5 h-5 text-gray-500 dark:text-slate-400 flex-shrink-0" />
            <h2 className="font-semibold text-gray-900 dark:text-slate-100">Reporte de inventario completo</h2>
            {!loadingStock && (
              <span className="text-xs text-gray-400 dark:text-slate-500 ml-1">
                ({stockFiltrado.length} artículos)
              </span>
            )}
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nombre o SKU…"
              value={buscarStock}
              onChange={e => { setBuscarStock(e.target.value); setPageStock(1); }}
              className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loadingStock ? (
            <div className="p-4 space-y-3">
              {Array.from({length: 8}).map((_, i) => (
                <div key={i} className="flex gap-4">
                  {[1,2,3,4,5,6,7,8].map(j => <Skeleton key={j} className={`h-8 ${j === 2 ? 'flex-[2]' : 'flex-1'}`} />)}
                </div>
              ))}
            </div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-slate-900">
                  <tr>
                    {['SKU', 'Nombre', 'Categoría', 'Stock', 'Mínimo', 'Estado', 'Unidad', 'Ubicación'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                  {stockPaginado.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-gray-400 dark:text-slate-500 text-sm">
                        No se encontraron artículos
                      </td>
                    </tr>
                  ) : stockPaginado.map((p: any) => (
                    <tr key={p.id} className={`hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${p.stockActual <= p.stockMinimo ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-slate-400">{p.sku}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-slate-100">{p.nombre}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{p.categoria.nombre}</td>
                      <td className="px-4 py-3 font-semibold dark:text-slate-200">{p.stockActual}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-slate-400">{p.stockMinimo}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          p.stockActual === 0
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                            : p.stockActual <= p.stockMinimo
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400'
                            : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                        }`}>
                          {p.stockActual === 0 ? 'Sin stock' : p.stockActual <= p.stockMinimo ? 'Stock bajo' : 'OK'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-slate-400">{p.unidad}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-slate-400">{p.ubicacion || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Controles de paginación */}
              {totalPagesStock > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-slate-700">
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    Mostrando {((safePageStock - 1) * PAGE_SIZE) + 1}–{Math.min(safePageStock * PAGE_SIZE, stockFiltrado.length)} de {stockFiltrado.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPageStock(p => Math.max(1, p - 1))}
                      disabled={safePageStock === 1}
                      className="p-1.5 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {Array.from({ length: totalPagesStock }, (_, i) => i + 1)
                      .filter(n => n === 1 || n === totalPagesStock || Math.abs(n - safePageStock) <= 1)
                      .reduce<(number | '…')[]>((acc, n, idx, arr) => {
                        if (idx > 0 && (arr[idx - 1] as number) < n - 1) acc.push('…');
                        acc.push(n);
                        return acc;
                      }, [])
                      .map((n, i) => n === '…' ? (
                        <span key={`dots-${i}`} className="px-1 text-gray-400 dark:text-slate-500 text-sm">…</span>
                      ) : (
                        <button
                          key={n}
                          onClick={() => setPageStock(n as number)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                            safePageStock === n
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          {n}
                        </button>
                      ))}

                    <button
                      onClick={() => setPageStock(p => Math.min(totalPagesStock, p + 1))}
                      disabled={safePageStock === totalPagesStock}
                      className="p-1.5 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {/* Exportar movimientos por fecha */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5">
        <div className="flex items-center gap-2 mb-4">
          <CalendarRange className="w-5 h-5 text-blue-500" />
          <h2 className="font-semibold text-gray-900 dark:text-slate-100">Exportar movimientos por rango de fechas</h2>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Desde</label>
            <input
              type="date"
              value={fechaDesde}
              onChange={e => setFechaDesde(e.target.value)}
              className="border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Hasta</label>
            <input
              type="date"
              value={fechaHasta}
              onChange={e => setFechaHasta(e.target.value)}
              className="border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={exportarMovimientos}
            disabled={exportandoMov}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            <TableIcon className="w-4 h-4" />
            {exportandoMov ? 'Exportando…' : 'Exportar Excel'}
          </button>
        </div>
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-3">
          Genera un Excel con todos los movimientos (entradas y salidas) del período seleccionado.
        </p>
      </div>
    </div>
  );
}