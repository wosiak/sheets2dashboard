import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Dashboard } from './components/Dashboard';
import { TVModeToggle } from './components/TVModeToggle';
import { availableDashboards } from './config/dashboards';

// Configuração do React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const [currentDashboard, setCurrentDashboard] = useState('vendas');
  const [isTVMode, setIsTVMode] = useState(false);

  console.log('🎯 App - Dashboard atual:', currentDashboard);
  console.log('📋 Dashboards disponíveis:', availableDashboards.map(d => d.id));

  return (
    <QueryClientProvider client={queryClient}>
      <div className={`min-h-screen bg-gray-50 ${isTVMode ? 'p-0' : 'p-6'}`}>
        {/* Header */}
        <div className={`bg-white shadow-sm border-b ${isTVMode ? 'p-4' : 'p-6 mb-6'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                📊 Dashboards | Clearwater
              </h1>
              <p className="text-gray-600 mt-1">
                Conectado ao Google Sheets - Atualização automática
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Seletor de Dashboard */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Dashboard:</label>
                <select
                  value={currentDashboard}
                  onChange={(e) => setCurrentDashboard(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {availableDashboards.map((dashboard) => (
                    <option key={dashboard.id} value={dashboard.id}>
                      {dashboard.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* TV Mode Toggle */}
              <TVModeToggle isTVMode={isTVMode} onToggle={setIsTVMode} />
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className={isTVMode ? 'p-4' : ''}>
          <Dashboard dashboardName={currentDashboard} />
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default App;
