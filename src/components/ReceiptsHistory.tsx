import React, { useMemo, useState } from 'react';
import { Download, Search, Eye, Printer } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { exportCSV, exportJSON, formatCurrency } from '../utils/format';

export function ReceiptsHistory() {
  const { state } = useApp();
  const [query, setQuery] = useState('');
  const [previewId, setPreviewId] = useState<string | null>(null);

  const safeString = (v: any) => (typeof v === 'string' ? v : v?.toString?.() ?? '');
  const norm = (v: any) => safeString(v).toLowerCase();

  const filtered = useMemo(() => {
    const q = norm(query);
    return (state.receipts ?? [])
      .filter(r => norm(r?.studentName).includes(q))
      .sort((a, b) =>
        // fecha desc, luego nombre asc
        new Date(b?.date ?? 0).getTime() - new Date(a?.date ?? 0).getTime() ||
        safeString(a?.studentName).localeCompare(safeString(b?.studentName), 'es', { sensitivity: 'base' })
      );
  }, [state.receipts, query]);

  const rows = filtered.map(r => ({
    id: r?.id,
    fecha: new Date(r?.date ?? 0).toISOString().slice(0, 10),
    alumno: safeString(r?.studentName),
    cantidadItems: Array.isArray(r?.transactions) ? r.transactions.length : 0,
    total: Number(r?.totalAmount ?? 0)
  }));

  const handleExportJSON = () => exportJSON('recibos', rows);
  const handleExportCSV = () => exportCSV('recibos', rows);

  const receiptById = (id: string | null) =>
    (state.receipts ?? []).find(r => String(r.id) === String(id)) || null;

  const openPrintWindow = (receiptId: string) => {
    const r = receiptById(receiptId);
    if (!r) return;

    const dateStr = new Date(r.date).toLocaleString('es-AR');
    const itemsHtml = (r.transactions || [])
      .map(it => `
        <tr>
          <td style="padding:6px;border-bottom:1px solid #eee;">${safeString(it.className)}</td>
          <td style="padding:6px;border-bottom:1px solid #eee;">${new Date(it.date).toISOString().slice(0,10)}</td>
          <td style="padding:6px;border-bottom:1px solid #eee;text-align:right;">${formatCurrency(Number(it.amount||0))}</td>
        </tr>
      `).join('');

    const totalHtml = formatCurrency(Number(r.totalAmount || 0));

    const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Recibo ${r.id}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <style>
    body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,"Helvetica Neue",Arial,"Noto Sans",sans-serif;padding:24px;color:#111}
    .card{max-width:720px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;padding:20px}
    .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
    .title{font-size:18px;font-weight:700}
    .meta{color:#6b7280;font-size:12px}
    table{width:100%;border-collapse:collapse;font-size:14px;margin-top:10px}
    .tot{font-weight:700}
    .foot{margin-top:16px;font-size:12px;color:#6b7280}
    @media print {
      .noprint{display:none}
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div>
        <div class="title">Recibo</div>
        <div class="meta">ID: ${r.id}</div>
      </div>
      <div class="meta" style="text-align:right">
        <div>Alumno: ${safeString(r.studentName)}</div>
        <div>Fecha: ${dateStr}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr style="text-align:left;color:#374151">
          <th style="padding:6px;border-bottom:1px solid #e5e7eb;">Detalle</th>
          <th style="padding:6px;border-bottom:1px solid #e5e7eb;">Fecha</th>
          <th style="padding:6px;border-bottom:1px solid #e5e7eb;text-align:right;">Monto</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml || '<tr><td colspan="3" style="padding:12px;color:#6b7280;text-align:center">Sin items</td></tr>'}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding:8px;text-align:right" class="tot">Total</td>
          <td style="padding:8px;text-align:right" class="tot">${totalHtml}</td>
        </tr>
      </tfoot>
    </table>

    <div class="foot">
      * Este recibo puede reimprimirse cuantas veces sea necesario.
    </div>

    <div class="noprint" style="margin-top:16px;text-align:right">
      <button onclick="window.print()" style="padding:8px 12px;border:1px solid #e5e7eb;border-radius:8px;background:#111;color:#fff;cursor:pointer">Imprimir</button>
    </div>
  </div>
</body>
</html>
    `.trim();

    const w = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por alumno..."
            className="w-full sm:w-80 pl-9 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleExportJSON} className="inline-flex items-center gap-2 px-3 py-2 border rounded-md">
            <Download size={16} /> Exportar JSON
          </button>
          <button onClick={handleExportCSV} className="inline-flex items-center gap-2 px-3 py-2 border rounded-md">
            <Download size={16} /> Exportar CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="py-2">Fecha</th>
              <th className="py-2">Alumno</th>
              <th className="py-2">Items</th>
              <th className="py-2">Total</th>
              <th className="py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={String(r?.id)} className="border-t">
                <td className="py-2">{new Date(r?.date ?? 0).toISOString().slice(0, 10)}</td>
                <td className="py-2">{safeString(r?.studentName)}</td>
                <td className="py-2">{Array.isArray(r?.transactions) ? r.transactions.length : 0}</td>
                <td className="py-2">{formatCurrency(Number(r?.totalAmount ?? 0))}</td>
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewId(String(r?.id))}
                      className="inline-flex items-center gap-1 px-2 py-1 border rounded-md"
                      title="Previsualizar"
                    >
                      <Eye size={16} /> Ver
                    </button>
                    <button
                      onClick={() => openPrintWindow(String(r?.id))}
                      className="inline-flex items-center gap-1 px-2 py-1 border rounded-md"
                      title="Imprimir"
                    >
                      <Printer size={16} /> Imprimir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-gray-500">No hay recibos.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Preview simple embebido (sin estilos pesados) */}
      {previewId && (() => {
        const r = receiptById(previewId);
        if (!r) return null;
        return (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-[95vw] max-w-3xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Previsualización de Recibo</h3>
                <button onClick={() => setPreviewId(null)} className="text-gray-600 hover:text-gray-900">✕</button>
              </div>
              <div className="border rounded-md p-4 max-h-[70vh] overflow-auto">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-bold text-gray-900">Recibo</div>
                    <div className="text-xs text-gray-500">ID: {String(r.id)}</div>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    <div>Alumno: {safeString(r.studentName)}</div>
                    <div>Fecha: {new Date(r.date).toLocaleString('es-AR')}</div>
                  </div>
                </div>
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600">
                      <th className="py-1">Detalle</th>
                      <th className="py-1">Fecha</th>
                      <th className="py-1 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(r.transactions || []).map(it => (
                      <tr key={String(it.id)} className="border-t">
                        <td className="py-1">{safeString(it.className)}</td>
                        <td className="py-1">{new Date(it.date).toISOString().slice(0,10)}</td>
                        <td className="py-1 text-right">{formatCurrency(Number(it.amount || 0))}</td>
                      </tr>
                    ))}
                    {(!r.transactions || r.transactions.length === 0) && (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-gray-500">Sin items</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-t">
                      <td colSpan={2} className="py-2 text-right font-semibold">Total</td>
                      <td className="py-2 text-right font-semibold">{formatCurrency(Number(r.totalAmount || 0))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  onClick={() => openPrintWindow(String(r.id))}
                  className="inline-flex items-center gap-2 px-3 py-2 border rounded-md"
                >
                  <Printer size={16} /> Imprimir
                </button>
                <button
                  onClick={() => setPreviewId(null)}
                  className="px-3 py-2 rounded-md bg-blue-600 text-white"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
