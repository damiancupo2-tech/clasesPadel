import React, { useState } from 'react';
import { Class } from '../types';
import { useApp } from '../context/AppContext';
import { X, Save, Calendar, Users, DollarSign } from 'lucide-react';

interface ClassFormProps {
  classData?: Class;
  onClose: () => void;
  selectedDate?: Date;
}

export function ClassForm({ classData, onClose, selectedDate }: ClassFormProps) {
  const { state, dispatch } = useApp();

  const [formData, setFormData] = useState({
    date: classData?.date ? new Date(classData.date) : selectedDate || new Date(),
    type: classData?.type || 'group' as 'individual' | 'group',
    maxStudents: classData?.maxStudents || 2,
    pricePerStudent: classData?.pricePerStudent || 1000,
    observations: classData?.observations || '',
    repeating: classData?.repeating || 'none' as 'none' | 'weekly' | 'monthly',
    students: classData?.students || []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newClass: Class = {
      id: classData?.id || Date.now().toString(),
      ...formData,
      attendances: classData?.attendances || {},
      status: classData?.status || 'scheduled',
      createdAt: classData?.createdAt || new Date(),
      parentId: classData?.parentId
    };

    if (classData) {
      dispatch({ type: 'UPDATE_CLASS', payload: newClass });
    } else {
      dispatch({ type: 'ADD_CLASS', payload: newClass });
    }

    onClose();
  };

  const formatDateTime = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d}T${h}:${min}`;
  };

  const toggleStudent = (id: string) => {
    const exists = formData.students.includes(id);
    const updated = exists
      ? formData.students.filter(s => s !== id)
      : [...formData.students, id];

    if (updated.length <= formData.maxStudents) {
      setFormData({ ...formData, students: updated });
    }
  };

  const isRecurringClass = classData?.parentId || classData?.repeating !== 'none';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar size={24} className="text-blue-600" />
            {classData ? 'Editar Clase' : 'Nueva Clase'}
            {isRecurringClass && (
              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                Recurrente
              </span>
            )}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Fecha y hora */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y hora</label>
            <input
              type="datetime-local"
              required
              value={formatDateTime(formData.date)}
              onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Repetición */}
          {!classData && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Repetición</label>
              <select
                value={formData.repeating}
                onChange={(e) => setFormData({ ...formData, repeating: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="none">Única</option>
                <option value="weekly">Semanal (mismo mes)</option>
                <option value="monthly">Mensual (mismo mes)</option>
              </select>
            </div>
          )}

          {/* Tipo de clase */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={formData.type}
              onChange={(e) => {
                const type = e.target.value as 'individual' | 'group';
                const newMax = type === 'individual' ? 1 : Math.max(2, formData.maxStudents);
                setFormData({ ...formData, type, maxStudents: newMax, students: [] });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="individual">Individual</option>
              <option value="group">Grupal</option>
            </select>
          </div>

          {/* Máximo de alumnos */}
          {formData.type === 'group' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex gap-2 items-center">
                <Users size={16} />
                Máximo de alumnos
              </label>
              <select
                value={formData.maxStudents}
                onChange={(e) =>
                  setFormData({ ...formData, maxStudents: parseInt(e.target.value), students: [] })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {[2, 3, 4, 5].map(n => (
                  <option key={n} value={n}>{n} personas</option>
                ))}
              </select>
            </div>
          )}

          {/* Precio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <DollarSign size={16} />
              Precio por alumno
            </label>
            <input
              type="number"
              required
              min="0"
              value={formData.pricePerStudent}
              onChange={(e) => setFormData({ ...formData, pricePerStudent: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea
              value={formData.observations}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Selección de alumnos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alumnos ({formData.students.length}/{formData.maxStudents})
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-2">
              {state.students.map(student => {
                const isSelected = formData.students.includes(student.id);
                return (
                  <div
                    key={student.id}
                    onClick={() => toggleStudent(student.id)}
                    className={`cursor-pointer px-3 py-1 rounded flex justify-between items-center ${
                      isSelected ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'
                    }`}
                  >
                    <span>{student.name}</span>
                    {isSelected && <span className="text-sm">✓</span>}
                  </div>
                );
              })}
            </div>
            {formData.students.length === formData.maxStudents && (
              <p className="text-xs text-green-600 mt-1">Máximo de alumnos alcanzado</p>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Save size={18} />
              {classData ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
