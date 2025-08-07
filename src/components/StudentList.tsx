import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StudentForm } from './StudentForm';
import { StudentAccountHistory } from './StudentAccountHistory';
import { Search, Plus, Edit, Trash2, DollarSign } from 'lucide-react';

export function StudentList() {
  const { state, dispatch } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [showAccountHistory, setShowAccountHistory] = useState(false);
  const [selectedStudentForAccount, setSelectedStudentForAccount] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [conditionFilter, setConditionFilter] = useState('all');

  const filteredStudents = state.students.filter(student => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.dni.includes(searchTerm) ||
      student.phone.includes(searchTerm);

    const matchesCondition =
      conditionFilter === 'all' || student.condition === conditionFilter;

    return matchesSearch && matchesCondition;
  });

  const handleEdit = (student) => {
    setEditingStudent(student);
    setShowForm(true);
  };

  const handleDelete = (studentId: string) => {
    if (confirm('¿Está seguro de eliminar este alumno?')) {
      dispatch({ type: 'DELETE_STUDENT', payload: studentId });
    }
  };

  const handleShowAccount = (student) => {
    setSelectedStudentForAccount(student);
    setShowAccountHistory(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const getStudentBalance = (student) => {
    const transactions = state.transactions.filter(t => t.studentId === student.id);
    const charges = transactions
      .filter(t => t.type === 'charge')
      .reduce((sum, t) => sum + t.amount, 0);
    const payments = transactions
      .filter(t => t.type === 'payment')
      .reduce((sum, t) => sum + t.amount, 0);
    return charges - payments;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Alumnos</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Nuevo Alumno
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre, DNI o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todas las condiciones</option>
            <option value="Titular">Titular</option>
            <option value="Familiar">Familiar</option>
            <option value="Invitado">Invitado</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Nombre</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">DNI</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Teléfono</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Lote/Barrio</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Condición</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Saldo</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => {
                const currentBalance = getStudentBalance(student);
                return (
                  <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{student.name}</div>
                        {student.observations && (
                          <div className="text-sm text-gray-500">{student.observations}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-900">{student.dni}</td>
                    <td className="py-3 px-4 text-gray-900">{student.phone}</td>
                    <td className="py-3 px-4 text-gray-900">
                      {student.lot} - {student.neighborhood}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        student.condition === 'Titular'
                          ? 'bg-blue-100 text-blue-800'
                          : student.condition === 'Familiar'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {student.condition}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-medium ${
                        currentBalance > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {formatCurrency(currentBalance)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(student)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="Editar"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleShowAccount(student)}
                          className="text-green-600 hover:text-green-800 transition-colors"
                          title="Cuenta corriente"
                        >
                          <DollarSign size={18} />
                        </button>
                        {state.currentUser?.role === 'admin' && (
                          <button
                            onClick={() => handleDelete(student.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No se encontraron alumnos que coincidan con los filtros aplicados.
          </div>
        )}
      </div>

      {showForm && (
        <StudentForm
          student={editingStudent}
          onClose={() => {
            setShowForm(false);
            setEditingStudent(null);
          }}
        />
      )}

      {showAccountHistory && selectedStudentForAccount && (
        <StudentAccountHistory
          student={selectedStudentForAccount}
          onClose={() => {
            setShowAccountHistory(false);
            setSelectedStudentForAccount(null);
          }}
        />
      )}
    </div>
  );
}