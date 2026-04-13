import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Dashboard } from './components/Dashboard';
import { TVModeToggle } from './components/TVModeToggle';
import { ThemeToggle } from './components/ThemeToggle';
import { availableDashboards } from './config/dashboards';
import solyidmoblogo from './assets/solydimob-logo.jpeg';

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
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('solyd-theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('solyd-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (isTVMode) {
      document.documentElement.classList.add('tv-mode');
    } else {
      document.documentElement.classList.remove('tv-mode');
    }
    return () => document.documentElement.classList.remove('tv-mode');
  }, [isTVMode]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  console.log('🎯 App - Dashboard atual:', currentDashboard);
  console.log('📋 Dashboards disponíveis:', availableDashboards.map(d => d.id));

  return (
    <QueryClientProvider client={queryClient}>
      <div className={`min-h-screen ${isTVMode ? 'p-0' : 'p-0'}`}>
        {/* Header */}
        <div className={`app-header ${isTVMode ? 'px-8 py-5' : 'px-6 py-4'}`}>
          <div className="flex items-center justify-between max-w-[1600px] mx-auto">
            <div className="flex items-center gap-3 w-56">
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
            </div>

            <div className="flex items-center gap-4">
              <img
                src={solyidmoblogo}
                alt="Solyd Imob Logo"
                className={`rounded-lg object-cover ${isTVMode ? 'w-14 h-14' : 'w-10 h-10'}`}
              />
              <h1 className={`font-semibold text-[var(--text-primary)] ${isTVMode ? 'text-xl' : 'text-lg'}`}>
                Dashboards | Solyd Imob
              </h1>
            </div>

            <div className="flex items-center gap-4 w-56 justify-end">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">Dashboard:</label>
                <select
                  value={currentDashboard}
                  onChange={(e) => setCurrentDashboard(e.target.value)}
                  className="header-select"
                >
                  {availableDashboards.map((dashboard) => (
                    <option key={dashboard.id} value={dashboard.id}>
                      {dashboard.name}
                    </option>
                  ))}
                </select>
              </div>

              <TVModeToggle isTVMode={isTVMode} onToggle={setIsTVMode} />
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className={isTVMode ? 'px-8 py-4' : 'px-6 py-6'}>
          <Dashboard dashboardName={currentDashboard} isTVMode={isTVMode} selectedPeriodLabel="" />
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default App;
