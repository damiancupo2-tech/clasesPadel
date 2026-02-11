import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { Navigation } from './components/Navigation';
import { StudentList } from './components/StudentList';
import { Calendar } from './components/Calendar';
import { BillingModule } from './components/BillingModule';
import { Reports } from './components/Reports';import { ReceiptsHistory } from './components/ReceiptsHistory';
import { BackupRestore } from './components/BackupRestore';
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
          <BackupRestore />
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