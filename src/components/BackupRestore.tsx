import React, { useState } from 'react';
import { Download, Upload, AlertCircle, CheckCircle, FileText, Database, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Student, Class, Transaction, Receipt } from '../types';

interface BackupData {
  version: string;
  exportDate: string;
  clubId: string;
  clubName: string;
  students: Student[];
  classes: Class[];
  transactions: Transaction[];
  receipts: Receipt[];
  metadata: {
    totalStudents: number;
    totalClasses: number;
    totalTransactions: number;
    totalReceipts: number;
  };
}

type StatusType = 'idle' | 'loading' | 'success' | 'error';

export function BackupRestore() {
  const { state, dispatch } = useApp();
  const [status, setStatus] = useState<StatusType>('idle');
  const [message, setMessage] = useState<string>('');
  const [backupInfo, setBackupInfo] = useState<BackupData | null>(null);

  const showStatus = (type: StatusType, msg: string) => {
    setStatus(type);
    setMessage(msg);
    if (type === 'success' || type === 'error') {
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 5000);
    }
  };

  const exportBackup = async () => {
    try {
      setStatus('loading');
      setMessage('Generando backup...');

      // Preparar datos para exportación
      const backupData: BackupData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        clubId: 'default',
        clubName: 'Mi Club de Pádel',
        students: state.students.map(student => ({
          ...student,
          createdAt: student.createdAt,
          accountHistory: ((student.accountHistory || []) || []).map(entry => ({
            ...entry,
            date: entry.date,
            createdAt: entry.createdAt
          }))
        })),
        classes: (state.classes || []).map(cls => ({
          ...cls,
          date: cls.date,
          createdAt: cls.createdAt
        })),
        transactions: (state.transactions || []).map(transaction => ({
          ...transaction,
          date: transaction.date
        })),
        receipts: (state.receipts || []).map(receipt => ({
          ...receipt,
          date: receipt.date,
          transactions: (receipt.transactions || []).map(t => ({
            ...t,
            date: t.date
          }))
        })),
        metadata: {
          totalStudents: (state.students || []).length,
          totalClasses: (state.classes || []).length,
          totalTransactions: (state.transactions || []).length,
          totalReceipts: (state.receipts || []).length
        }
      };

      // Generar archivo JSON
      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      // Crear nombre del archivo
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      const filename = `backup-padel-${dateStr}-${timeStr}.json`;
      
      // Descargar archivo
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showStatus('success', `Backup exportado exitosamente: ${filename}`);
    } catch (error) {
      console.error('Error al exportar backup:', error);
      showStatus('error', 'Error al generar el backup. Revisa la consola para más detalles.');
    }
  };

  const validateBackupStructure = (data: any): data is BackupData => {
    if (!data || typeof data !== 'object') return false;
    
    const requiredFields = ['version', 'exportDate', 'students', 'classes', 'transactions', 'receipts', 'metadata'];
    for (const field of requiredFields) {
      if (!(field in data)) {
        showStatus('error', `Campo requerido faltante: ${field}`);
        return false;
      }
    }

    if (!Array.isArray(data.students) || !Array.isArray(data.classes) || 
        !Array.isArray(data.transactions) || !Array.isArray(data.receipts)) {
      showStatus('error', 'Los datos deben ser arrays válidos');
      return false;
    }

    if (!data.metadata || typeof data.metadata !== 'object') {
      showStatus('error', 'Metadata inválida');
      return false;
    }

    return true;
  };

  const convertDates = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj === 'string') {
      // Intentar convertir strings ISO a Date
      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
      if (isoRegex.test(obj)) {
        return new Date(obj);
      }
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(convertDates);
    }
    
    if (typeof obj === 'object') {
      const converted: any = {};
      for (const [key, value] of Object.entries(obj)) {
        converted[key] = convertDates(value);
      }
      return converted;
    }
    
    return obj;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setStatus('loading');
      setMessage('Leyendo archivo de backup...');

      const text = await file.text();
      const data = JSON.parse(text);

      if (!validateBackupStructure(data)) {
        return; // El error ya se mostró en validateBackupStructure
      }

      setMessage('Validando estructura del backup...');
      setBackupInfo(data);

      // Convertir fechas de strings ISO a objetos Date
      const convertedData = convertDates(data);

      setMessage('Restaurando datos...');

      // Limpiar datos existentes y cargar nuevos
      dispatch({ type: 'LOAD_DATA', payload: {
        students: convertedData.students || [],
        classes: convertedData.classes || [],
        transactions: convertedData.transactions || [],
        receipts: convertedData.receipts || []
      }});

      showStatus('success', 
        `Backup restaurado exitosamente!\n` +
        `• ${data.metadata.totalStudents} alumnos\n` +
        `• ${data.metadata.totalClasses} clases\n` +
        `• ${data.metadata.totalTransactions} transacciones\n` +
        `• ${data.metadata.totalReceipts} recibos`
      );

      // Limpiar el input file
      event.target.value = '';
      
      // Recargar página después de 3 segundos
      setTimeout(() => {
        window.location.reload();
      }, 3000);

    } catch (error) {
      console.error('Error al restaurar backup:', error);
      if (error instanceof SyntaxError) {
        showStatus('error', 'El archivo no es un JSON válido');
      } else {
        showStatus('error', 'Error al procesar el archivo de backup');
      }
      event.target.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCurrentStats = () => ({
    students: state.students.length,
    classes: state.classes.length,
    transactions: state.transactions.length,
    receipts: state.receipts.length
  });

  const stats = getCurrentStats();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Database size={24} className="text-blue-600" />
          Backup y Restauración
        </h2>
        
        <p className="text-gray-600 mb-6">
          Exporta todos tus datos para crear un respaldo de seguridad o importa datos desde otro sistema.
        </p>

        {/* Estado actual del sistema */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FileText size={18} />
            Estado Actual del Sistema
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.students}</div>
              <div className="text-gray-600">Alumnos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.classes}</div>
              <div className="text-gray-600">Clases</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.transactions}</div>
              <div className="text-gray-600">Transacciones</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.receipts}</div>
              <div className="text-gray-600">Recibos</div>
            </div>
          </div>
        </div>

        {/* Botones principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Exportar Backup */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Download size={18} className="text-green-600" />
              Exportar Backup
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Descarga todos los datos del sistema en un archivo JSON.
            </p>
            <button
              onClick={exportBackup}
              disabled={status === 'loading'}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {status === 'loading' ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Download size={18} />
                  Descargar Backup
                </>
              )}
            </button>
          </div>

          {/* Importar Backup */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Upload size={18} className="text-blue-600" />
              Restaurar Backup
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Carga un archivo de backup para restaurar datos.
            </p>
            <label className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 cursor-pointer">
              <Upload size={18} />
              Seleccionar Archivo
              <input
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                disabled={status === 'loading'}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Mensajes de estado */}
        {status !== 'idle' && (
          <div className={`rounded-lg p-4 flex items-start gap-3 ${
            status === 'loading' ? 'bg-blue-50 border border-blue-200' :
            status === 'success' ? 'bg-green-50 border border-green-200' :
            'bg-red-50 border border-red-200'
          }`}>
            {status === 'loading' && <RefreshCw size={20} className="text-blue-600 animate-spin mt-0.5" />}
            {status === 'success' && <CheckCircle size={20} className="text-green-600 mt-0.5" />}
            {status === 'error' && <AlertCircle size={20} className="text-red-600 mt-0.5" />}
            <div className="flex-1">
              <div className={`font-medium ${
                status === 'loading' ? 'text-blue-800' :
                status === 'success' ? 'text-green-800' :
                'text-red-800'
              }`}>
                {status === 'loading' && 'Procesando...'}
                {status === 'success' && 'Operación Exitosa'}
                {status === 'error' && 'Error'}
              </div>
              <div className={`text-sm mt-1 whitespace-pre-line ${
                status === 'loading' ? 'text-blue-700' :
                status === 'success' ? 'text-green-700' :
                'text-red-700'
              }`}>
                {message}
              </div>
            </div>
          </div>
        )}

        {/* Información del backup cargado */}
        {backupInfo && status === 'success' && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mt-4">
            <h4 className="font-semibold text-blue-900 mb-2">Información del Backup Restaurado</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <div><strong>Versión:</strong> {backupInfo.version}</div>
              <div><strong>Fecha de exportación:</strong> {new Date(backupInfo.exportDate).toLocaleString('es-AR')}</div>
              <div><strong>Club:</strong> {backupInfo.clubName || 'Sin nombre'}</div>
              <div className="mt-2 pt-2 border-t border-blue-200">
                <strong>Datos restaurados:</strong>
                <ul className="mt-1 space-y-1">
                  <li>• {backupInfo.metadata.totalStudents} alumnos</li>
                  <li>• {backupInfo.metadata.totalClasses} clases</li>
                  <li>• {backupInfo.metadata.totalTransactions} transacciones</li>
                  <li>• {backupInfo.metadata.totalReceipts} recibos</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Advertencias importantes */}
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 mt-6">
          <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
            <AlertCircle size={18} />
            Advertencias Importantes
          </h4>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• <strong>Restaurar un backup reemplazará TODOS los datos actuales</strong></li>
            <li>• Asegúrate de hacer un backup antes de restaurar otro</li>
            <li>• Los archivos de backup contienen información sensible, guárdalos de forma segura</li>
            <li>• La página se recargará automáticamente después de restaurar</li>
          </ul>
        </div>

        {/* Información técnica */}
        <div className="bg-gray-50 rounded-lg p-4 mt-6">
          <h4 className="font-semibold text-gray-900 mb-2">Información Técnica</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div><strong>Formato:</strong> JSON con estructura versionada</div>
            <div><strong>Compatibilidad:</strong> Compatible con otros sistemas que usen el mismo formato</div>
            <div><strong>Almacenamiento:</strong> Los datos se guardan en localStorage del navegador</div>
            <div><strong>Versión actual:</strong> 1.0</div>
          </div>
        </div>
      </div>
    </div>
  );
}