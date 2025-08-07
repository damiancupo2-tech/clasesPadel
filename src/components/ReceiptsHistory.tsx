// src/components/ReceiptsHistory.tsx

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Printer, Trash, Download, Calendar, Receipt, CheckSquare } from 'lucide-react';

export function ReceiptsHistory() {
  const { state, dispatch } = useApp();
  const [filterName, setFilterName] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

  const handlePrint = (receipt: any) => {
    const html = `
      <html>
        <head>
          <title>Recibo - ${receipt.studentName}</title>
          <style>
            body { font-family: Arial; padding: 20px; }
            h2 { color: #1f2937; }
            .receipt-header { background-color: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; }
            th { background-color: #f9fafb; }
            .total { font-weight: bold; background-color: #fef3c7; }
          </style>
        </head>
        <body>
          <h2>Recibo de Pago</h2>
          <div class="receipt-header">
            <p><strong>Alumno:</strong> ${receipt.studentName}</p>
            <p><strong>Fecha de pago:</strong> ${formatDate(receipt.date)}</p>
            <p><strong>Recibo N°:</strong> ${receipt.id}</p>
          </div>
          <table>
            <thead><tr><th>Clase</th><th>Fecha</th><th>Monto</th></tr></thead>
            <tbody>
              ${receipt.transactions.map((t: any) => `
                <tr>
                  <td>${t.className}</td>
                  <td>${formatDate(t.date)}</td>
                  <td>${formatCurrency(t.amount)}</td>
                </tr>`).join('')}
            </tbody>
            <tfoot>
              <tr class="total">
                <td colspan="2">Total</td>
                <td>${formatCurrency(receipt.totalAmount)}</td>
              </tr>
            </tfoot>
          </table>
        </body>
      </html>
    `;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  const exportCSV = (receipts: any[]) => {
    const headers = ['ReciboID', 'Alumno', 'Fecha de Clase', 'Clase', 'Monto'];
    const rows = receipts.flatMap((r) =>
      r.transactions.map((t: any) => [
        r.id,
        r.studentName,
        formatDate(t.date),
        t.className,
        t.amount
      ])
    );
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `recibos_exportados_${Date.now()}.csv`;
    link.click();
  };

  const deleteReceipt = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este recibo?')) {
      dispatch({ type: 'DELETE_RECEIPT', payload: id });
    }
  };

  const clearFilters = () => {
    setFilterName('');
    setDateRange({ start: '', end: '' });
    setSelectedIds([]);
  };

  const filteredReceipts = state.receipts.filter((r) => {
    const nameMatch = r.studentName.toLowerCase().includes(filterName.toLowerCase());
    let dateMatch = true;
    const d = new Date(r.date);
    const from = dateRange.start ? new Date(dateRange.start) : null;
    const to = dateRange.end ? new Date(dateRange.end) : null;
    if (from && to) dateMatch = d >= from && d <= to;
    else if (from) dateMatch = d >= from;
    else if (to) dateMatch = d <= to;
    return nameMatch && dateMatch;
  });

  const thisMonthCount = filteredReceipts.filter((r) => {
    const d = new Date(r.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const totalAmount = filteredReceipts.reduce((acc, r) => acc + r.totalAmount, 0);

  const toggleSelect = (id: string) => {
    setSelectedIds(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Historial de Recibos</h1>

      {/* Totales con filtro aplicado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6 flex items-center">
          <div className="p-2 bg-green-100 rounded-lg">
            <Receipt className="h-6 w-6 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm text-gray-600">Total Recibos</p>
            <p className="text-2xl font-semibold text-gray-900">{filteredReceipts.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Calendar className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm text-gray-600">Este Mes</p>
            <p className="text-2xl font-semibold text-gray-900">{thisMonthCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 flex items-center">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Download className="h-6 w-6 text-yellow-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm text-gray-600">Total Cobrado</p>
            <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalAmount)}</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Filtros de Búsqueda</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Nombre del alumno"
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            className="border px-3 py-2 rounded w-full"
          />
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="border px-3 py-2 rounded w-full"
          />
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="border px-3 py-2 rounded w-full"
          />
          <button onClick={clearFilters} className="bg-gray-100 rounded px-4 py-2">
            Limpiar Filtros
          </button>
        </div>
      </div>

      {/* Exportación múltiple */}
      {selectedIds.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={() => exportCSV(state.receipts.filter(r => selectedIds.includes(r.id)))}
            className="text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <Download size={16} />
            Exportar Seleccionados
          </button>
        </div>
      )}

      {/* Listado */}
      <div className="space-y-4">
        {filteredReceipts.map((r) => (
          <details
            key={r.id}
            className="bg-white rounded-lg shadow border p-4"
          >
            <summary className="flex justify-between items-center cursor-pointer">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(r.id)}
                  onChange={() => toggleSelect(r.id)}
                />
                <div>
                  <h2 className="font-semibold text-gray-900">{r.studentName}</h2>
                  <p className="text-sm text-gray-500">{formatDate(r.date)} • Recibo #{r.id.slice(-6)}</p>
                </div>
              </div>
              <span className="text-green-600 font-semibold">{formatCurrency(r.totalAmount)}</span>
            </summary>

            <div className="mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th>Clase</th>
                    <th>Fecha</th>
                    <th>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {r.transactions.map((t: any) => (
                    <tr key={t.id}>
                      <td>{t.className}</td>
                      <td>{formatDate(t.date)}</td>
                      <td>{formatCurrency(t.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end gap-3 mt-4">
                <button onClick={() => exportCSV([r])} className="text-blue-600 text-sm hover:underline">
                  <Download size={14} /> Exportar CSV
                </button>
                <button onClick={() => handlePrint(r)} className="text-green-600 text-sm hover:underline">
                  <Printer size={14} /> Imprimir
                </button>
                <button onClick={() => deleteReceipt(r.id)} className="text-red-600 text-sm hover:underline">
                  <Trash size={14} /> Eliminar
                </button>
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
