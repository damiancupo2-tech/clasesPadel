import React, { useMemo, useState } from 'react';
import { Search, Percent, BadgeDollarSign, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/format';

type DiscountMode = 'amount' | 'percent';

export function BillingModule() {
  const { state, dispatch } = useApp();

  // Total pendiente por alumno (solo transacciones Pendiente)
  const pendingByStudent = useMemo(() => {
    const map = new Map<string, { studentId: string; studentName: string; total: number }>();
    for (const t of state.transactions) {
      if (t.status === 'Pendiente' && t.amount > 0) {
        const key = t.studentId;
        const prev = map.get(key);
        const total = (prev?.total || 0) + t.amount;
        map.set(key, { studentId: t.studentId, studentName: t.studentName, total });
      }
    }
    return Array.from(map.values());
  }, [state.transactions]);

  const [query, setQuery] = useState('');
  const sortedFiltered = useMemo(() => {
    const list = pendingByStudent
      .filter(s =>
        s.studentName.toLowerCase().includes(query.toLowerCase())
      )
      .sort((a, b) => a.studentName.localeCompare(b.studentName, 'es', { sensitivity: 'base' }));
    return list;
  }, [pendingByStudent, query]);

  const [selected, setSelected] = useState<{ studentId: string; studentName: string; total: number } | null>(null);
  const [mode, setMode] = useState<DiscountMode>('amount');
  const [amount, setAmount] = useState<number>(0);
  const [percent, setPercent] = useState<number>(0);
  const [note, setNote] = useState<string>('');

  const handleSelect = (s: { studentId: string; studentName: string; total: number }) => {
    setSelected(s);
    // Resetea inputs
    setMode('amount');
    setAmount(0);
    setPercent(0);
    setNote('');
  };

  const handleSyncInputs = (newMode: DiscountMode, val: number) => {
    if (!selected) return;
    if (newMode === 'amount') {
      // actualizar amount y % calculado
      const amt = Math.max(0, Math.min(val, selected.total));
      setAmount(amt);
      setPercent(selected.total > 0 ? +(amt * 100 / selected.total).toFixed(2) : 0);
    } else {
      const pct = Math.max(0, Math.min(val, 100));
      setPercent(pct);
      const amt = +(selected.total * (pct / 100)).toFixed(2);
      setAmount(Math.max(0, Math.min(amt, selected.total)));
    }
  };

  const applyDiscount = () => {
    if (!selected) return;
    const payload = mode === 'amount'
      ? { studentId: selected.studentId, mode: 'amount' as const, value: amount, note }
      : { studentId: selected.studentId, mode: 'percent' as const, value: percent, note };

    dispatch({ type: 'APPLY_DISCOUNT', payload });
    // Al aplicar, des-selecciono y limpio
    setSelected(null);
    setAmount(0);
    setPercent(0);
    setNote('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Columna izquierda: listado de alumnos con saldo pendiente + buscador */}
      <div className="lg:col-span-5 bg-white rounded-xl shadow-sm border p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Alumnos con saldo pendiente</h2>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar alumno..."
            className="w-full pl-9 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <ul className="divide-y">
          {sortedFiltered.length === 0 && (
            <li className="py-6 text-gray-500 text-sm">No hay alumnos con saldo pendiente.</li>
          )}
          {sortedFiltered.map(s => (
            <li key={s.studentId} className="py-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">{s.studentName}</p>
                <p className="text-sm text-gray-500">Pendiente: {formatCurrency(s.total)}</p>
              </div>
              <button
                onClick={() => handleSelect(s)}
                className={`px-3 py-1.5 text-sm rounded-md border transition ${
                  selected?.studentId === s.studentId
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                }`}
              >
                Seleccionar
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Columna derecha: aplicar descuento sobre total */}
      <div className="lg:col-span-7 bg-white rounded-xl shadow-sm border p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Aplicar descuento sobre total</h2>

        {!selected ? (
          <div className="text-gray-500 text-sm">Seleccioná un alumno de la lista para aplicar un descuento.</div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <div>
                <p className="text-gray-800 font-medium">{selected.studentName}</p>
                <p className="text-sm text-gray-500">Total pendiente: {formatCurrency(selected.total)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border ${mode === 'amount' ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white border-gray-300 text-gray-700'}`}
                  onClick={() => setMode('amount')}
                >
                  <BadgeDollarSign size={16} /> $ Monto
                </button>
                <button
                  className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border ${mode === 'percent' ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white border-gray-300 text-gray-700'}`}
                  onClick={() => setMode('percent')}
                >
                  <Percent size={16} /> % Porcentaje
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Descuento en $ (sobre total)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={amount}
                  onChange={(e) => handleSyncInputs('amount', parseFloat(e.target.value || '0'))}
                />
                <p className="mt-1 text-xs text-gray-500">Máx: {formatCurrency(selected.total)}</p>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Descuento en % (sobre total)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={percent}
                  onChange={(e) => handleSyncInputs('percent', parseFloat(e.target.value || '0'))}
                />
                <p className="mt-1 text-xs text-gray-500">0% a 100%</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">Nota (opcional)</label>
              <input
                type="text"
                className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Motivo del descuento, ejemplo: fidelización, promo, etc."
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Nuevo saldo estimado:{' '}
                <span className="font-semibold">
                  {formatCurrency(Math.max(0, selected.total - (mode === 'amount' ? amount : +(selected.total * (percent / 100)).toFixed(2))))}
                </span>
              </div>
              <button
                onClick={applyDiscount}
                disabled={(mode === 'amount' && amount <= 0) || (mode === 'percent' && percent <= 0)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle2 size={18} />
                Aplicar descuento y saldar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
