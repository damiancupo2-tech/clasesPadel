import React, { useMemo, useState } from 'react';
import { Search, Percent, BadgeDollarSign, CheckCircle2, ListChecks, Receipt } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/format';

type DiscountMode = 'amount' | 'percent';
type Tab = 'discount' | 'charge';

export function BillingModule() {
  const { state, dispatch } = useApp();

  // ------ Agregados utilitarios ------
  const isPending = (t: any) => t?.status === 'Pendiente' && Number(t?.amount) > 0;

  // Total pendiente por alumno (solo transacciones Pendiente)
  const pendingByStudent = useMemo(() => {
    const map = new Map<string, { studentId: string; studentName: string; total: number }>();
    for (const t of state.transactions) {
      if (isPending(t)) {
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
    const q = query.toLowerCase();
    return pendingByStudent
      .filter(s => s.studentName.toLowerCase().includes(q))
      .sort((a, b) => a.studentName.localeCompare(b.studentName, 'es', { sensitivity: 'base' }));
  }, [pendingByStudent, query]);

  const [selected, setSelected] = useState<{ studentId: string; studentName: string; total: number } | null>(null);

  // Tabs: descuento sobre total / cobro por selección
  const [tab, setTab] = useState<Tab>('discount');

  // ------ Descuento sobre total ------
  const [mode, setMode] = useState<DiscountMode>('amount');
  const [amount, setAmount] = useState<number>(0);
  const [percent, setPercent] = useState<number>(0);
  const [note, setNote] = useState<string>('');

  const handleSelect = (s: { studentId: string; studentName: string; total: number }) => {
    setSelected(s);
    // Resetea inputs de descuento
    setMode('amount');
    setAmount(0);
    setPercent(0);
    setNote('');
  };

  const handleSyncInputs = (newMode: DiscountMode, val: number) => {
    if (!selected) return;
    if (newMode === 'amount') {
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

    // Limpia selección
    setSelected(null);
    setAmount(0);
    setPercent(0);
    setNote('');
  };

  // ------ Cobro por selección de clases ------
  const pendingTxForSelected = useMemo(() => {
    if (!selected) return [];
    return state.transactions
      .filter(t => t.studentId === selected.studentId && isPending(t))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [state.transactions, selected]);

  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const allChecked = useMemo(() => {
    if (!pendingTxForSelected.length) return false;
    return pendingTxForSelected.every(t => checked[t.id]);
  }, [pendingTxForSelected, checked]);

  const toggleAll = (val: boolean) => {
    const next: Record<string, boolean> = {};
    pendingTxForSelected.forEach(t => { next[t.id] = val; });
    setChecked(next);
  };

  const toggleOne = (id: string, val: boolean) => {
    setChecked(prev => ({ ...prev, [id]: val }));
  };

  const selectedTx = useMemo(
    () => pendingTxForSelected.filter(t => checked[t.id]),
    [pendingTxForSelected, checked]
  );

  const selectedTotal = useMemo(
    () => selectedTx.reduce((acc, t) => acc + Number(t.amount || 0), 0),
    [selectedTx]
  );

  const cobrarSeleccionado = () => {
    if (!selected || selectedTx.length === 0) return;

    // 1) marcar cada transacción seleccionada como Pagado
    selectedTx.forEach(t => {
      dispatch({ type: 'UPDATE_TRANSACTION_STATUS', payload: { id: t.id, status: 'Pagado' } });
    });

    // 2) generar un recibo por el total cobrado
    const receipt = {
      id: `rcpt_${selected.studentId}_${Date.now()}`,
      studentId: selected.studentId,
      studentName: selected.studentName,
      date: new Date(),
      transactions: selectedTx.map(t => ({
        id: t.id,
        className: t.className,
        date: new Date(t.date),
        amount: t.amount
      })),
      totalAmount: selectedTotal
    };
    dispatch({ type: 'ADD_RECEIPT', payload: receipt });

    // 3) limpiar selección (las no tildadas quedan pendientes)
    setChecked({});
    setSelected(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Columna izquierda: listado de alumnos con saldo pendiente + buscador */}
      <div className="lg:col-span-5 bg-white rounded-xl shadow-sm border p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Le agradeciste a Dios haber conocido a Damian????</h2>
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
                onClick={() => { handleSelect(s); setTab('charge'); }}
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

      {/* Columna derecha: tabs Descuento / Cobro */}
      <div className="lg:col-span-7 bg-white rounded-xl shadow-sm border p-4">
        <div className="flex gap-2 mb-4">
          <button
            className={`px-3 py-1.5 text-sm rounded-md border ${tab === 'discount' ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white border-gray-300 text-gray-700'}`}
            onClick={() => setTab('discount')}
            title="Descuento sobre el total pendiente"
          >
            <BadgeDollarSign size={16} className="inline mr-1" /> Descuento
          </button>
          <button
            className={`px-3 py-1.5 text-sm rounded-md border ${tab === 'charge' ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white border-gray-300 text-gray-700'}`}
            onClick={() => setTab('charge')}
            title="Cobrar por selección de clases"
          >
            <ListChecks size={16} className="inline mr-1" /> Cobrar clases
          </button>
        </div>

        {!selected ? (
          <div className="text-gray-500 text-sm">Seleccioná un alumno de la lista para continuar.</div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <div>
                <p className="text-gray-800 font-medium">{selected.studentName}</p>
                <p className="text-sm text-gray-500">Total pendiente: {formatCurrency(selected.total)}</p>
              </div>
            </div>

            {tab === 'discount' ? (
              <>
                <div className="flex items-center gap-2 mb-4">
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
            ) : (
              // ----- Cobrar por selección de clases -----
              <>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-gray-600">
                    Seleccioná qué clases cobrar ahora (las no seleccionadas quedan pendientes).
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAll(!allChecked)}
                      className="px-3 py-1.5 text-sm rounded-md border bg-white hover:bg-gray-50"
                    >
                      {allChecked ? 'Deseleccionar todo' : 'Seleccionar todo'}
                    </button>
                  </div>
                </div>

                <div className="max-h-80 overflow-auto border rounded-md">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr className="text-left text-gray-600">
                        <th className="py-2 px-3">#</th>
                        <th className="py-2 px-3">Fecha</th>
                        <th className="py-2 px-3">Clase</th>
                        <th className="py-2 px-3">Monto</th>
                        <th className="py-2 px-3">Sel.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingTxForSelected.map((t, idx) => (
                        <tr key={t.id} className="border-t">
                          <td className="py-2 px-3">{idx + 1}</td>
                          <td className="py-2 px-3">{new Date(t.date).toISOString().slice(0, 10)}</td>
                          <td className="py-2 px-3">{t.className}</td>
                          <td className="py-2 px-3">{formatCurrency(Number(t.amount || 0))}</td>
                          <td className="py-2 px-3">
                            <input
                              type="checkbox"
                              checked={!!checked[t.id]}
                              onChange={(e) => toggleOne(t.id, e.target.checked)}
                            />
                          </td>
                        </tr>
                      ))}
                      {pendingTxForSelected.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-gray-500">
                            No hay transacciones pendientes.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-700">
                    Total seleccionado: <span className="font-semibold">{formatCurrency(selectedTotal)}</span>
                  </div>
                  <button
                    onClick={cobrarSeleccionado}
                    disabled={selectedTx.length === 0}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Receipt size={18} />
                    Cobrar seleccionado y generar recibo
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
