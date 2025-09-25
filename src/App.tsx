import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { Navigation } from './components/Navigation';
import { StudentList } from './components/StudentList';
import { Calendar } from './components/Calendar';
import { BillingModule } from './components/BillingModule';
import { Reports } from './components/Reports';import { ReceiptsHistory } from './components/ReceiptsHistory';
function App() {
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
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Configuración</h2>
            <p className="text-gray-600">Che Molina, aunque te cueste reconocerlo... es crack Cupo no?? aprovechalo, te esta enseñando gratis! si no le das bola algun dia te vas a arrepentir!!! ponete las pilas y labura que la que no ganas hoy, de viejo la vas a lamentar!!!                                                                                            
            
            * Acordate que no sos el dueño de la verdad y el peor error que puede cometer un ser humano es no escuchar a otros y ponerse en terco, el que no escucha no aprende!!                                                                                                                                                                                       
            
            * ya sos grande, deja de hacerte el pendejo y sacate ese aro de alumno de secundaria</p>
          </div>
        );
        case 'receipts':
  return <ReceiptsHistory />;
      default:
        return <StudentList />;
    }
  };

  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-50">
        <Navigation currentView={currentView} onViewChange={setCurrentView} />
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {renderCurrentView()}
        </main>
      </div>
    </AppProvider>
  );
}

export default App;