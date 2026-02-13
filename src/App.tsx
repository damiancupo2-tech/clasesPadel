import React, { useState } from 'react';
import { ExternalLink, Lock, ArrowRight, Shield } from 'lucide-react';

function App() {
  const [showAdminMode, setShowAdminMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === '842114') {
      setIsAdminAuthenticated(true);
      setShowAdminMode(false);
    } else {
      alert('Clave de administrador incorrecta');
      setAdminPassword('');
    }
  };

  const handleLogout = () => {
    setIsAdminAuthenticated(false);
    setAdminPassword('');
  };

  if (isAdminAuthenticated) {
    // Importar dinámicamente los componentes del sistema original
    const { AppProvider } = require('./context/AppContext');
    const { Navigation } = require('./components/Navigation');
    const { StudentList } = require('./components/StudentList');
    const { Calendar } = require('./components/Calendar');
    const { BillingModule } = require('./components/BillingModule');
    const { Reports } = require('./components/Reports');
    const { ReceiptsHistory } = require('./components/ReceiptsHistory');
    const { BackupRestore } = require('./components/BackupRestore');

    const [currentView, setCurrentView] = useState('students');

    const renderCurrentView = () => {
      switch (currentView) {
        case 'students':
          return <StudentList />;
        case 'calendar':
          return <Calendar />;
        case 'billing':
          return <BillingModule />;
        case 'reports':
          return <Reports />;
        case 'settings':
          return <BackupRestore />;
        case 'receipts':
          return <ReceiptsHistory />;
        default:
          return <StudentList />;
      }
    };

    return (
      <AppProvider>
        <div className="min-h-screen bg-gray-50">
          <div className="bg-red-600 text-white px-4 py-2 text-center text-sm">
            <div className="flex items-center justify-center gap-2">
              <Shield size={16} />
              <span>MODO ADMINISTRADOR ACTIVADO</span>
              <button
                onClick={handleLogout}
                className="ml-4 bg-red-700 hover:bg-red-800 px-3 py-1 rounded text-xs"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
          <Navigation currentView={currentView} onViewChange={setCurrentView} />
          <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {renderCurrentView()}
          </main>
        </div>
      </AppProvider>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Pantalla principal de migración */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-8">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <ArrowRight size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Sistema Actualizado
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              El sistema cambió por una versión mejorada.
            </p>
            <p className="text-gray-700 mb-8">
              Ingresá al siguiente link para acceder a la nueva versión con todas las funcionalidades mejoradas y nuevas características.
            </p>
          </div>

          {/* Botón principal para acceder al nuevo sistema */}
          <div className="mb-8">
            <a
              href="https://damiancupo1982-padel-nl1e.bolt.host"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <span className="text-lg">Acceder al Nuevo Sistema</span>
              <ExternalLink size={24} />
            </a>
          </div>

          {/* Características destacadas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-green-600 font-semibold mb-2">✨ Mejorado</div>
              <div className="text-sm text-gray-600">Interfaz más moderna y rápida</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-blue-600 font-semibold mb-2">🚀 Nuevas Funciones</div>
              <div className="text-sm text-gray-600">Más herramientas de gestión</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-purple-600 font-semibold mb-2">🔒 Más Seguro</div>
              <div className="text-sm text-gray-600">Mayor protección de datos</div>
            </div>
          </div>

          {/* Botón modo admin */}
          <div className="border-t pt-6">
            <button
              onClick={() => setShowAdminMode(true)}
              className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm transition-colors"
            >
              <Lock size={16} />
              Modo Administrador
            </button>
          </div>
        </div>

        {/* Modal de login admin */}
        {showAdminMode && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Shield size={20} className="text-red-600" />
                  Modo Administrador
                </h3>
                <button
                  onClick={() => {
                    setShowAdminMode(false);
                    setAdminPassword('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Clave de Administrador
                  </label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Ingrese la clave"
                    required
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdminMode(false);
                      setAdminPassword('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Ingresar
                  </button>
                </div>
              </form>
              
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-xs text-yellow-800">
                  ⚠️ El modo administrador permite acceso al sistema anterior solo para tareas de mantenimiento.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;