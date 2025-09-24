import React, { useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { exportCSV, exportJSON, formatCurrency } from '../utils/format';

export function ReceiptsHistory() {
  const { state } = useApp();
  const [query, setQuery] = useState('');

  const safeString = (v: any) => (typeof v === 'string' ? v : v?.toString?.() ?? '');
  const norm = (v: any) => safeString(v).toLowerCase();

  const filtered = useMemo(() => {
    const q = norm(query);
    return (state.receipts ?? [])
      .filter(r => norm(r?.studentName).includes(q))
      .sort((a, b) =>
        // primero por fecha desc, luego por nombre asc
        new Date(b?.date ?? 0).getTime() - new Date(a?.date ?? 0).getTime() ||
        safeString(a?.studentName).localeCompare(safeString(b?.studentName), 'es', { sensitivity: 'base' })
      );
  }, [state.receipts, query]);

  const rows = filtered.map(r => ({
    fecha: new Date(r?.date ?? 0).toISOString().slice(0, 10),
    alumno: safeString(r?.studentName),
    cantidadItems: Array.isArray(r?.transactions) ? r.transactions.length : 0,
    total: Number(r?.totalAmount ?? 0)
  }));

  const handleExportJSON = () => exportJSON('recibos', rows);
  const handleExportCSV = () => exportCSV('recibos', rows);

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
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={String(r?.id)} className="border-t">
                <td className="py-2">{new Date(r?.date ?? 0).toISOString().slice(0, 10)}</td>
                <td className="py-2">{safeString(r?.studentName)}</td>
                <td className="py-2">{Array.isArray(r?.transactions) ? r.transactions.length : 0}</td>
                <td className="py-2">{formatCurrency(Number(r?.totalAmount ?? 0))}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-gray-500">No hay recibos.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
