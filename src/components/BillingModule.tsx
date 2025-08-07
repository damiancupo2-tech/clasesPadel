import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Receipt, CheckCircle, Calendar, DollarSign, FileText, Download } from 'lucide-react';

export function BillingModule() {
  const { state, dispatch } = useApp();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'card'>('cash');
  const [selectedTransactions, setSelectedTransactions] = useState<{[key: string]: boolean}>({});

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

    transactionsToPay.forEach(tx => {
      dispatch({ type: 'UPDATE_TRANSACTION_STATUS', payload: { id: tx.id, status: 'Pagado' } });
    });

    const totalAmount = transactionsToPay.reduce((sum, tx) => sum + tx.amount, 0);

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
        amount: tx.amount
      })),
    };

    dispatch({ type: 'ADD_RECEIPT', payload: receipt });
    setSelectedTransactions({});
    setSelectedStudentId(null);
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
                        <span className="font-medium text-green-600">
                          {formatCurrency(tx.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-medium">Total a cobrar:</span>
                      <span className="text-lg font-bold text-green-600">
                        {formatCurrency(
                          group.transactions
                            .filter(tx => selectedTransactions[tx.id] !== false)
                            .reduce((sum, tx) => sum + tx.amount, 0)
                        )}
                      </span>
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
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
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