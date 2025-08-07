import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StudentAccountHistory } from './StudentAccountHistory';
import {
  Download,
  Calendar,
  Users,
  DollarSign,
  FileText,
  Eye,
  Printer
} from 'lucide-react';

export function Reports() {
  const { state } = useApp();
  const [selectedStudentForAccount, setSelectedStudentForAccount] = useState(null);
  const [showAccountHistory, setShowAccountHistory] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);

  const getFilteredData = () => {
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    end.setHours(23, 59, 59, 999);

    const filteredClasses = state.classes.filter((cls) => {
      const cd = new Date(cls.date);
      return cd >= start && cd <= end;
    });

    const filteredTransactions = state.transactions.filter((t) => {
      const td = new Date(t.date);
      return td >= start && td <= end;
    });

    return { filteredClasses, filteredTransactions };
  };

  const { filteredClasses, filteredTransactions } = getFilteredData();

  const totalClasses = filteredClasses.length;
  const completedClasses = filteredClasses.filter((c) => c.status === 'completed').length;

  const totalPaid = filteredTransactions
    .filter((t) => t.type === 'payment' && t.status === 'Pagado')
    .reduce((s, t) => s + t.amount, 0);

  const totalPending = filteredTransactions
    .filter((t) => t.type === 'charge' && t.status === 'Pendiente')
    .reduce((s, t) => s + t.amount, 0);

  const previewReport = (type: string) => {
    let data: any = {};
    switch (type) {
      case 'students':
        data = {
          title: 'Reporte de Alumnos',
          data: state.students.map((st) => ({
            Nombre: st.name,
            DNI: st.dni,
            Teléfono: st.phone,
            'Saldo Pendiente': formatCurrency(
              state.transactions
                .filter((t) => t.studentId === st.id && t.status === 'Pendiente')
                .reduce((s, t) => s + t.amount, 0)
            ),
            'Fecha Registro': new Date(st.createdAt).toLocaleDateString('es-AR')
          }))
        };
        break;
      case 'attendances': {
        const arr: any[] = [];
        filteredClasses.forEach((cls) =>
          Object.entries(cls.attendances || {}).forEach(([sid, att]) => {
            if (att) {
              const s = state.students.find((st) => st.id === sid);
              arr.push({
                Fecha: new Date(cls.date).toLocaleDateString('es-AR'),
                Alumno: s?.name || 'N/A',
                'Tipo de Clase': cls.type,
                'Monto Cobrado': formatCurrency(cls.pricePerStudent)
              });
            }
          })
        );
        data = { title: 'Reporte de Asistencias', data: arr };
        break;
      }
      case 'payments':
        data = {
          title: 'Reporte de Pagos',
          data: filteredTransactions.map((t) => {
            const s = state.students.find((st) => st.id === t.studentId);
            return {
              Fecha: new Date(t.date).toLocaleDateString('es-AR'),
              Alumno: s?.name || 'N/A',
              Tipo: t.type === 'charge' ? 'Cargo' : 'Pago',
              Descripción: t.description,
              Monto: formatCurrency(t.amount),
              Estado: t.status
            };
          })
        };
        break;
    }
    setPreviewData(data);
    setShowPreview(true);
  };

  const exportJSON = (data: any) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${data.title
      .toLowerCase()
      .replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const printReport = (data: any) => {
    const html = `
      <html><head><title>${data.title}</title></head><body>
        <h1>${data.title}</h1>
        <p>Desde ${dateRange.start} hasta ${dateRange.end}</p>
        <table border="1" cellpadding="5" cellspacing="0">
          <thead>
            <tr>${Object.keys(data.data[0] || {})
              .map((k) => `<th>${k}</th>`)
              .join('')}</tr>
          </thead>
          <tbody>
            ${data.data
              .map(
                (row: any) =>
                  '<tr>' +
                  Object.values(row).map((v: any) => `<td>${v}</td>`).join('') +
                  '</tr>'
              )
              .join('')}
          </tbody>
        </table>
      </body></html>`;
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
      w.print();
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Reportes y Exportación</h1>
        <div className="flex gap-2 items-end">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="px-3 py-2 border rounded"
          />
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="px-3 py-2 border rounded"
          />
          <button
            onClick={() => setDateRange({ ...dateRange })}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            OK
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[ 
          { icon: Calendar, label: 'Total Clases', value: totalClasses },
          { icon: Users, label: 'Clases Completadas', value: completedClasses },
          { icon: DollarSign, label: 'Ingresos Generados', value: totalPaid, format: formatCurrency, color: 'text-green-600' },
          { icon: FileText, label: 'Pagos Pendientes', value: totalPending, format: formatCurrency, color: 'text-red-600' }
        ].map((card, i) => (
          <div key={i} className="bg-white shadow p-4 rounded flex items-center">
            <card.icon className="h-6 w-6 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">{card.label}</p>
              <p className={`text-xl font-semibold ${card.color || 'text-gray-900'}`}>
                {card.format ? card.format(card.value) : card.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Resumen por Alumno */}
      <div className="bg-white shadow rounded p-6">
        <h2 className="text-lg font-semibold mb-3">Resumen por Alumno</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2 text-left">Alumno</th>
              <th className="py-2 text-left">Clases Asistidas</th>
              <th className="py-2 text-left">Monto Cobrado</th>
              <th className="py-2 text-left">Saldo Pendiente</th>
            </tr>
          </thead>
          <tbody>
            {state.students.map((st) => {
              const txs = state.transactions.filter((t) => t.studentId === st.id);
              const paid = txs.filter((t) => t.status === 'Pagado').reduce((s, t) => s + t.amount, 0);
              const pending = txs.filter((t) => t.status === 'Pendiente').reduce((s, t) => s + t.amount, 0);
              const attended = filteredClasses.filter((cls) => cls.attendances?.[st.id]).length;
              return (
                <tr
                  key={st.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => {
                    setSelectedStudentForAccount(st);
                    setShowAccountHistory(true);
                  }}
                >
                  <td className="py-2">{st.name}</td>
                  <td className="py-2">{attended}</td>
                  <td className="py-2">{formatCurrency(paid)}</td>
                  <td className={`py-2 ${pending > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(pending)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Export Buttons */}
      <div>
        <button
          onClick={() => previewReport('students')}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Ver detalles o exportar
        </button>
      </div>

      {/* Modals */}
      {showAccountHistory && selectedStudentForAccount && (
        <StudentAccountHistory
          student={selectedStudentForAccount}
          onClose={() => {
            setShowAccountHistory(false);
            setSelectedStudentForAccount(null);
          }}
        />
      )}
      {showPreview && previewData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 max-w-6xl max-h-screen overflow-y-auto rounded shadow">
            {/* header */}
            <div className="flex justify-between mb-4">
              <h3 className="text-xl font-bold">{previewData.title}</h3>
              <div className="flex gap-3">
                <button onClick={() => exportJSON(previewData)} className="bg-green-600 text-white px-3 py-2 rounded">
                  <Download size={16} />
                  JSON
                </button>
                <button onClick={() => printReport(previewData)} className="bg-blue-600 text-white px-3 py-2 rounded">
                  <Printer size={16} />
                  Imprimir
                </button>
                <button onClick={() => setShowPreview(false)} className="text-gray-600 px-3 py-2 rounded">
                  ✕
                </button>
              </div>
            </div>
            {/* table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    {Object.keys(previewData.data[0] || {}).map((k) => (
                      <th key={k} className="py-2 px-3 text-left font-medium">
                        {k}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.data.map((row: any, i: number) => (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      {Object.values(row).map((v: any, j: number) => (
                        <td key={j} className="py-2 px-3">{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-gray-500">Registros: {previewData.data.length}</p>
          </div>
        </div>
      )}
    </div>
  );
}
