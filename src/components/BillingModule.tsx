import React, { useMemo, useState, useEffect } from 'react';
import { Search, Percent, BadgeDollarSign, CheckCircle2, ListChecks, Receipt } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/format';
import { Student, Transaction } from '../types';

type DiscountMode = 'amount' | 'percent';
type Tab = 'discount' | 'charge';

export function BillingModule() {
  const { state, dispatch } = useApp();

  // ------ Helpers ------
  const isPending = (t: any) => t?.status === 'Pendiente' && Number(t?.amount) > 0;

  // Total pendiente por alumno (solo Pendiente)
  const pendingByStudent = useMemo(() => {
    const map = new Map<string, { studentId: string; studentName: string; total: number }>();
    for (const t of state.transactions) {
      if (isPending(t)) {
        const prev = map.get(t.studentId);
        const total = (prev?.total || 0) + Number(t.amount || 0);
        map.set(t.studentId, { studentId: t.studentId, studentName: t.studentName, total });
      }
    }
    return Array.from(map.values());
  }, [state.transactions]);

  // ------ Búsqueda y selección de alumno ------
  const [query, setQuery] = useState('');
  const sortedFiltered = useMemo(() => {
    const q = query.toLowerCase();
    return pendingByStudent
      .filter(s => s.studentName.toLowerCase().includes(q))
      .sort((a, b) => a.studentName.localeCompare(b.studentName, 'es', { sensitivity: 'base' }));
  }, [pendingByStudent, query]);

  const [selected, setSelected] = useState<{ studentId: string; studentName: string; total: number } | null>(null);

  // Tabs: Descuento total (global) / Cobrar clases (con descuento y pago parcial)
  const [tab, setTab] = useState<Tab>('charge');

  // ------ Descuento global sobre TOTAL del alumno (tab "Descuento") ------
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
    // por comodidad vamos a la pestaña de cobro
    setTab('charge');
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

  // ------ Cobro por selección de clases (con descuento y pago parcial) ------
  const pendingTxForSelected = useMemo(() => {
    if (!selected) return [];
    return state.transactions
      .filter(t => t.studentId === selected.studentId && isPending(t))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [state.transactions, selected]);

  const [checked, setChecked] = useState<Record<string, boolean>>({});
  useEffect(() => {
    // al cambiar de alumno, limpio selección
    setChecked({});
  }, [selected?.studentId]);

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

  const selectedSubtotal = useMemo(
    () => selectedTx.reduce((acc, t) => acc + Number(t.amount || 0), 0),
    [selectedTx]
  );

  // Descuento dentro del cobro por selección
  const [chargeDiscMode, setChargeDiscMode] = useState<DiscountMode>('amount');
  const [chargeDiscAmount, setChargeDiscAmount] = useState<number>(0);
  const [chargeDiscPercent, setChargeDiscPercent] = useState<number>(0);

  // Monto a cobrar ahora (parcial)
  const [paymentNow, setPaymentNow] = useState<number>(0);
  const [paymentTouched, setPaymentTouched] = useState<boolean>(false);

  // recalcula sugerido cuando cambia selección o descuento
  useEffect(() => {
    const disc = chargeDiscMode === 'amount'
      ? Math.max(0, Math.min(chargeDiscAmount, selectedSubtotal))
      : Math.max(0, Math.min(+(selectedSubtotal * (chargeDiscPercent / 100)).toFixed(2), selectedSubtotal));

    const suggested = Math.max(0, +(selectedSubtotal - disc).toFixed(2));
    if (!paymentTouched) setPaymentNow(suggested);
  }, [selectedSubtotal, chargeDiscMode, chargeDiscAmount, chargeDiscPercent, paymentTouched]);

  const syncChargeDisc = (mode: DiscountMode, val: number) => {
    if (mode === 'amount') {
      const amt = Math.max(0, Math.min(val, selectedSubtotal));
      setChargeDiscAmount(amt);
      setChargeDiscPercent(selectedSubtotal > 0 ? +(amt * 100 / selectedSubtotal).toFixed(2) : 0);
    } else {
      const pct = Math.max(0, Math.min(val, 100));
      setChargeDiscPercent(pct);
      const amt = +(selectedSubtotal * (pct / 100)).toFixed(2);
      setChargeDiscAmount(Math.max(0, Math.min(amt, selectedSubtotal)));
    }
    setPaymentTouched(false); // recalcular sugerido
  };

  const cobrarSeleccionado = () => {
    if (!selected || selectedTx.length === 0) return;

    const sub = selectedSubtotal;
    const discount = chargeDiscMode === 'amount'
      ? Math.max(0, Math.min(chargeDiscAmount, sub))
      : Math.max(0, Math.min(+(sub * (chargeDiscPercent / 100)).toFixed(2), sub));

    const toPay = Math.max(0, Math.min(paymentNow, +(sub - discount).toFixed(2)));

    // Distribución del descuento y del pago sobre cada transacción seleccionada
    let remainingDiscount = discount;
    let remainingPayment = toPay;

    const ops: Array<() => void> = [];

    // Encontrar el student
    const student: Student | undefined = state.students.find(s => s.id === selected.studentId);

    // Para el recibo: siempre los montos originales de los items seleccionados
    const receiptItems = selectedTx.map(t => ({
      id: t.id,
      className: t.className,
      date: new Date(t.date),
      amount: Number(t.amount || 0)
    }));

    // Recorremos en orden cronológico
    selectedTx.forEach((t) => {
      const original = Number(t.amount || 0);

      // Aplico parte del descuento a este item
      const d_i = Math.min(original, remainingDiscount);
      remainingDiscount -= d_i;

      // Monto a saldar después del descuento en este item
      const afterDiscount = +(original - d_i).toFixed(2);

      // Aplico pago a este item
      const pay_i = Math.min(afterDiscount, remainingPayment);
      remainingPayment -= pay_i;

      const remainder = +(afterDiscount - pay_i).toFixed(2);

      // Marcamos SIEMPRE el original como Pagado (cerramos el cargo original)
      ops.push(() => dispatch({ type: 'UPDATE_TRANSACTION_STATUS', payload: { id: t.id, status: 'Pagado' } }));

      // Si hay saldo remanente del item, generamos un nuevo cargo pendiente
      if (remainder > 0) {
        const newTx: Transaction = {
          id: `${t.id}_rem_${Date.now()}`,
          studentId: t.studentId,
          studentName: t.studentName,
          classId: t.classId,
          className: `${t.className} (Saldo restante)`,
          type: 'charge',
          amount: remainder,
          date: new Date(t.date),
          description: `${t.description} (Saldo restante)`,
          status: 'Pendiente'
        };
        ops.push(() => dispatch({ type: 'ADD_TRANSACTION', payload: newTx }));
      }
    });

    // Recibo con sub-total, descuento y saldo total (sub - desc)
    const receipt = {
      id: `rcpt_sel_${selected.studentId}_${Date.now()}`,
      studentId: selected.studentId,
      studentName: selected.studentName,
      date: new Date(),
      transactions: receiptItems,
      totalAmount: sub,
      discountAmount: discount,
      paidAmount: toPay
    };
    ops.push(() => dispatch({ type: 'ADD_RECEIPT', payload: receipt }));

    // Registrar descuento en historial del alumno y bajar su currentBalance por el descuento
    if (discount > 0 && student) {
      const entry = {
        id: `disc_sel_${student.id}_${Date.now()}`,
        date: new Date(),
        className: `Descuento en cobro (${receiptItems.length} ítem/s)`,
        classId: 'descuento-cobro-seleccion',
        attendanceStatus: 'Presente' as const,
        amount: -discount,
        createdAt: new Date(),
        kind: 'discount' as const,
        note: 'Descuento aplicado en cobro por selección'
      };
      const updated: Student = {
        ...student,
        accountHistory: [...(student.accountHistory || []), entry],
        currentBalance: Math.max(0, +(student.currentBalance - discount).toFixed(2))
      };
      ops.push(() => dispatch({ type: 'UPDATE_STUDENT', payload: updated }));
    }

    // Ejecutar operaciones
    ops.forEach(fn => fn());

    // Reset UI
    setChecked({});
    setChargeDiscMode('amount');
    setChargeDiscAmount(0);
    setChargeDiscPercent(0);
    setPaymentTouched(false);
    setPaymentNow(0);
    setSelected(null);
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
              // --------- TAB DESCUENTO GLOBAL ----------
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
              // --------- TAB COBRAR CLASES (con descuento y pago parcial) ----------
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

                {/* Controles de descuento y pago parcial */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="md:col-span-1">
                    <label className="block text-sm text-gray-600 mb-1">Descuento</label>
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border ${chargeDiscMode === 'amount' ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white border-gray-300 text-gray-700'}`}
                        onClick={() => setChargeDiscMode('amount')}
                      >
                        <BadgeDollarSign size={16} /> $ Monto
                      </button>
                      <button
                        className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border ${chargeDiscMode === 'percent' ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white border-gray-300 text-gray-700'}`}
                        onClick={() => setChargeDiscMode('percent')}
                      >
                        <Percent size={16} /> % Porcentaje
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        value={chargeDiscAmount}
                        onChange={(e) => syncChargeDisc('amount', parseFloat(e.target.value || '0'))}
                        placeholder="$"
                      />
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        value={chargeDiscPercent}
                        onChange={(e) => syncChargeDisc('percent', parseFloat(e.target.value || '0'))}
                        placeholder="%"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Base: {formatCurrency(selectedSubtotal)} (subtotal seleccionado)</p>
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-sm text-gray-600 mb-1">Monto a cobrar ahora (pago parcial)</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={paymentNow}
                      onChange={(e) => { setPaymentTouched(true); setPaymentNow(parseFloat(e.target.value || '0')); }}
                    />
                    <p className="mt-1 text-xs text-gray-500">Máx: {formatCurrency(Math.max(0, selectedSubtotal - chargeDiscAmount))}</p>
                  </div>

                  <div className="md:col-span-1">
                    <div className="bg-gray-50 border rounded-md p-3 text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sub-total</span>
                        <span className="font-medium">{formatCurrency(selectedSubtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Descuento</span>
                        <span className="font-medium">{formatCurrency(chargeDiscAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">A cobrar ahora</span>
                        <span className="font-semibold">{formatCurrency(Math.max(0, Math.min(paymentNow, selectedSubtotal - chargeDiscAmount)))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Saldo que queda pendiente</span>
                        <span className="font-medium">
                          {formatCurrency(Math.max(0, +(selectedSubtotal - chargeDiscAmount - Math.max(0, Math.min(paymentNow, selectedSubtotal - chargeDiscAmount))).toFixed(2)))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-700">
                    Total seleccionado: <span className="font-semibold">{formatCurrency(selectedSubtotal)}</span>
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
