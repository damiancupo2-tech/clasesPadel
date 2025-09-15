import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Receipt, CheckCircle, Calendar, DollarSign, FileText, Download } from 'lucide-react';

export function BillingModule() {
  const { state, dispatch } = useApp();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'card'>('cash');
  const [selectedTransactions, setSelectedTransactions] = useState<{[key: string]: boolean}>({});
  const [customAmounts, setCustomAmounts] = useState<{[key: string]: number}>({});
  const [discounts, setDiscounts] = useState<{[key: string]: number}>({});
  const [partialPaymentAmount, setPartialPaymentAmount] = useState<number>(0);
  const [showPartialPayment, setShowPartialPayment] = useState(false);

  const pendingTransactions = state.transactions.filter(tx => tx.status === 'Pendiente');
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const groupedByStudent = pendingTransactions.reduce((acc, tx) => {
    if (!acc[tx.studentId]) {
      acc[tx.studentId] = {
        studentName: tx.studentName,
        transactions: [],
        total: 0
      };
    }
    acc[tx.studentId].transactions.push(tx);
    acc[tx.studentId].total += tx.amount;
    return acc;
  }, {} as Record<string, { studentName: string; transactions: typeof pendingTransactions; total: number }>);

  const handleTransactionToggle = (transactionId: string) => {
    setSelectedTransactions(prev => ({
      ...prev,
      [transactionId]: !prev[transactionId]
    }));
    
    // Reset custom amounts and discounts when toggling
    if (!selectedTransactions[transactionId]) {
      setCustomAmounts(prev => ({ ...prev, [transactionId]: 0 }));
      setDiscounts(prev => ({ ...prev, [transactionId]: 0 }));
    }
  };

  const handleCustomAmountChange = (transactionId: string, amount: number) => {
    setCustomAmounts(prev => ({
      ...prev,
      [transactionId]: amount
    }));
  };

  const handleDiscountChange = (transactionId: string, discount: number) => {
    setDiscounts(prev => ({
      ...prev,
      [transactionId]: discount
    }));
  };

  const getTransactionFinalAmount = (transactionId: string, originalAmount: number) => {
    const customAmount = customAmounts[transactionId];
    const discount = discounts[transactionId] || 0;
    
    if (customAmount > 0) {
      return customAmount;
    }
    
    return Math.max(0, originalAmount - discount);
  };

  const handlePay = (studentId: string) => {
    const allTransactions = groupedByStudent[studentId].transactions;
    const transactionsToPay = allTransactions.filter(tx => 
      selectedTransactions[tx.id] !== false // Por defecto seleccionadas
    );
    
    if (transactionsToPay.length === 0) {
      alert('Selecciona al menos una clase para cobrar');
      return;
    }

    if (showPartialPayment && partialPaymentAmount > 0) {
      // Pago parcial
      handlePartialPayment(studentId, transactionsToPay);
    } else {
      // Pago completo con montos personalizados/descuentos
      transactionsToPay.forEach(tx => {
        const finalAmount = getTransactionFinalAmount(tx.id, tx.amount);
        
        if (finalAmount < tx.amount) {
          // Crear nueva transacción por la diferencia
          const remainingAmount = tx.amount - finalAmount;
          const newTransaction = {
            id: `${tx.id}_remaining_${Date.now()}`,
            studentId: tx.studentId,
            studentName: tx.studentName,
            classId: tx.classId,
            className: tx.className,
            type: 'charge' as const,
            amount: remainingAmount,
            date: new Date(),
            description: `${tx.description} - Saldo restante`,
            status: 'Pendiente' as const
          };
          
          // Agregar nueva transacción por el saldo
          dispatch({ type: 'ADD_TRANSACTION', payload: newTransaction });
        }
        
        // Marcar la transacción original como pagada
        dispatch({ type: 'UPDATE_TRANSACTION_STATUS', payload: { id: tx.id, status: 'Pagado' } });
      });
    }

    const totalAmount = showPartialPayment 
      ? partialPaymentAmount
      : transactionsToPay.reduce((sum, tx) => sum + getTransactionFinalAmount(tx.id, tx.amount), 0);

    const receipt = {
      id: `${studentId}_${Date.now()}`,
      studentId,
      studentName: groupedByStudent[studentId].studentName,
      date: new Date(),
      totalAmount,
      transactions: transactionsToPay.map(tx => ({
        id: tx.id,
        className: tx.className,
        date: tx.date,
        amount: showPartialPayment 
          ? (partialPaymentAmount * tx.amount) / transactionsToPay.reduce((sum, t) => sum + t.amount, 0)
          : getTransactionFinalAmount(tx.id, tx.amount)
      })),
    };

    dispatch({ type: 'ADD_RECEIPT', payload: receipt });
    
    // Reset states
    setSelectedTransactions({});
    setCustomAmounts({});
    setDiscounts({});
    setPartialPaymentAmount(0);
    setShowPartialPayment(false);
    setSelectedStudentId(null);
  };

  const handlePartialPayment = (studentId: string, transactions: any[]) => {
    const totalDebt = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    
    if (partialPaymentAmount >= totalDebt) {
      // Si el pago cubre toda la deuda, marcar como pagado
      transactions.forEach(tx => {
        dispatch({ type: 'UPDATE_TRANSACTION_STATUS', payload: { id: tx.id, status: 'Pagado' } });
      });
    } else {
      // Pago parcial: crear nuevas transacciones por el saldo
      transactions.forEach(tx => {
        const proportionalPayment = (partialPaymentAmount * tx.amount) / totalDebt;
        const remainingAmount = tx.amount - proportionalPayment;
        
        if (remainingAmount > 0) {
          const newTransaction = {
            id: `${tx.id}_partial_${Date.now()}`,
            studentId: tx.studentId,
            studentName: tx.studentName,
            classId: tx.classId,
            className: tx.className,
            type: 'charge' as const,
            amount: remainingAmount,
            date: new Date(),
            description: `${tx.description} - Saldo restante`,
            status: 'Pendiente' as const
          };
          
          dispatch({ type: 'ADD_TRANSACTION', payload: newTransaction });
        }
        
        // Marcar la transacción original como pagada
        dispatch({ type: 'UPDATE_TRANSACTION_STATUS', payload: { id: tx.id, status: 'Pagado' } });
      });
    }
  };

  const exportToCSV = () => {
    const headers = ['Alumno', 'Clase', 'Fecha', 'Monto', 'Estado'];
    const csvContent = [
      headers.join(','),
      ...pendingTransactions.map(tx => [
        `"${tx.studentName}"`,
        `"${tx.className}"`,
        new Date(tx.date).toLocaleDateString('es-AR'),
        tx.amount,
        tx.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `facturas_pendientes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handlePrint = () => {
    const printContent = `
      <html>
        <head>
          <title>Facturas Pendientes</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
            th { background-color: #f3f4f6; font-weight: bold; }
            .total { font-weight: bold; background-color: #fef3c7; }
          </style>
        </head>
        <body>
          <h1>Facturas Pendientes</h1>
          <p><strong>Fecha de generación:</strong> ${new Date().toLocaleDateString('es-AR')}</p>
          
          <table>
            <thead>
              <tr>
                <th>Alumno</th>
                <th>Clase</th>
                <th>Fecha</th>
                <th>Monto</th>
              </tr>
            </thead>
            <tbody>
              ${pendingTransactions.map(tx => `
                <tr>
                  <td>${tx.studentName}</td>
                  <td>${tx.className}</td>
                  <td>${new Date(tx.date).toLocaleDateString('es-AR')}</td>
                  <td>${formatCurrency(tx.amount)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr class="total">
                <td colspan="3"><strong>Total General</strong></td>
                <td><strong>${formatCurrency(pendingTransactions.reduce((sum, tx) => sum + tx.amount, 0))}</strong></td>
              </tr>
            </tfoot>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Facturas Pendientes</h1>
        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2"
          >
            <Download size={20} />
            Exportar CSV
          </button>
          <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <FileText size={20} />
            Imprimir
          </button>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Receipt className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Facturas Pendientes</p>
              <p className="text-2xl font-semibold text-gray-900">{pendingTransactions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Pendiente</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(pendingTransactions.reduce((sum, tx) => sum + tx.amount, 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Alumnos con Deuda</p>
              <p className="text-2xl font-semibold text-gray-900">{Object.keys(groupedByStudent).length}</p>
            </div>
          </div>
        </div>
      </div>

      {Object.keys(groupedByStudent).length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Receipt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600 text-lg">No hay facturas pendientes</p>
          <p className="text-gray-500 text-sm">Todas las facturas han sido pagadas</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByStudent).map(([studentId, group]) => (
            <div key={studentId} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold">{group.studentName}</h2>
                  <p className="text-sm text-gray-500">{group.transactions.length} clase(s)</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-blue-700">{formatCurrency(group.total)}</p>
                  <button
                    className="mt-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    onClick={() => setSelectedStudentId(studentId)}
                  >
                    Cobrar
                  </button>
                </div>
              </div>

              {selectedStudentId === studentId && (
                <div className="mt-6 border-t pt-6 space-y-4">
                  <h3 className="font-medium text-gray-900">Clases a cobrar:</h3>
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {group.transactions.map(tx => (
                      <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedTransactions[tx.id] !== false}
                            onChange={() => handleTransactionToggle(tx.id)}
                            className="h-4 w-4 text-blue-600 rounded"
                          />
                          <div>
                            <p className="font-medium text-sm">{tx.className}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(tx.date).toLocaleDateString('es-AR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-medium text-green-600">
                            {formatCurrency(getTransactionFinalAmount(tx.id, tx.amount))}
                          </span>
                          {selectedTransactions[tx.id] !== false && (
                            <div className="flex gap-1 text-xs">
                              <input
                                type="number"
                                placeholder="Monto custom"
                                value={customAmounts[tx.id] || ''}
                                onChange={(e) => handleCustomAmountChange(tx.id, parseFloat(e.target.value) || 0)}
                                className="w-20 px-1 py-0.5 border rounded text-xs"
                              />
                              <input
                                type="number"
                                placeholder="Descuento"
                                value={discounts[tx.id] || ''}
                                onChange={(e) => handleDiscountChange(tx.id, parseFloat(e.target.value) || 0)}
                                className="w-20 px-1 py-0.5 border rounded text-xs"
                              />
                            </div>
                          )}
                          {tx.amount !== getTransactionFinalAmount(tx.id, tx.amount) && (
                            <span className="text-xs text-gray-500 line-through">
                              {formatCurrency(tx.amount)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t pt-3">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={showPartialPayment}
                          onChange={(e) => setShowPartialPayment(e.target.checked)}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <label className="text-sm font-medium">Pago parcial</label>
                      </div>
                      
                      {showPartialPayment && (
                        <div className="bg-yellow-50 p-3 rounded-lg">
                          <label className="block text-sm font-medium mb-1">Monto del pago parcial:</label>
                          <input
                            type="number"
                            value={partialPaymentAmount}
                            onChange={(e) => setPartialPaymentAmount(parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-yellow-300 rounded-md"
                            placeholder="Ingrese el monto que paga el alumno"
                          />
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total a cobrar:</span>
                        <span className="text-lg font-bold text-green-600">
                          {showPartialPayment 
                            ? formatCurrency(partialPaymentAmount)
                            : formatCurrency(
                                group.transactions
                                  .filter(tx => selectedTransactions[tx.id] !== false)
                                  .reduce((sum, tx) => sum + getTransactionFinalAmount(tx.id, tx.amount), 0)
                              )
                          }
                        </span>
                      </div>
                      
                      {!showPartialPayment && (
                        <div className="text-xs text-gray-500">
                          Total original: {formatCurrency(
                            group.transactions
                              .filter(tx => selectedTransactions[tx.id] !== false)
                              .reduce((sum, tx) => sum + tx.amount, 0)
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium">Método de pago:</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="cash">Efectivo</option>
                      <option value="transfer">Transferencia</option>
                      <option value="card">Tarjeta</option>
                    </select>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedStudentId(null)}
                      className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handlePay(studentId)}
                      disabled={showPartialPayment && partialPaymentAmount <= 0}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle size={18} />
                      Confirmar Pago
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}