import React, { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { exportCSV, exportJSON, formatCurrency } from '../utils/format';

export function Reports() {
  const { state } = useApp();
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');

  const filtered = useMemo(() => {
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;
    return state.transactions.filter(t => {
      const d = new Date(t.date);
      if (fromDate && d < fromDate) return false;
      if (toDate && d > toDate) return false;
      return true;
    });
  }, [state.transactions, from, to]);

  const rows = filtered.map(t => ({
    fecha: new Date(t.date).toISOString().slice(0, 10),
    alumno: t.studentName,
    tipo: t.type,
    clase: t.className,
    descripcion: t.description,
    estado: t.status,
    liquidacion: t.settlementKind || '',
    monto: t.amount
  }));

  const total = filtered.reduce((acc, t) => acc + (t.type === 'charge' ? t.amount : 0), 0);

  const handleExportJSON = () => exportJSON(`reportes_${from || 'inicio'}_${to || 'hoy'}`, rows);
  const handleExportCSV = () => exportCSV(`reportes_${from || 'inicio'}_${to || 'hoy'}`, rows);

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Desde</label>
            <input type="date" className="border rounded-md px-3 py-2 w-full" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Hasta</label>
            <input type="date" className="border rounded-md px-3 py-2 w-full" value={to} onChange={e => setTo(e.target.value)} />
          </div>
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
              <th className="py-2">Tipo</th>
              <th className="py-2">Clase</th>
              <th className="py-2">Descripción</th>
              <th className="py-2">Estado</th>
              <th className="py-2">Liquidación</th>
              <th className="py-2">Monto</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="py-2">{r.fecha}</td>
                <td className="py-2">{r.alumno}</td>
                <td className="py-2">{r.tipo}</td>
                <td className="py-2">{r.clase}</td>
                <td className="py-2">{r.descripcion}</td>
                <td className="py-2">{r.estado}</td>
                <td className="py-2">{r.liquidacion}</td>
                <td className="py-2">{formatCurrency(r.monto)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t">
              <td colSpan={7} className="py-2 font-semibold text-right">Total cargos</td>
              <td className="py-2 font-semibold">{formatCurrency(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
