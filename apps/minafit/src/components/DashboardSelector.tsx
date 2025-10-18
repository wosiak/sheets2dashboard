import React from 'react';
import { availableDashboards } from '../config/dashboards';

interface DashboardSelectorProps {
  currentDashboard: string;
  onDashboardChange: (dashboardId: string) => void;
}

export const DashboardSelector: React.FC<DashboardSelectorProps> = ({
  currentDashboard,
  onDashboardChange,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Selecionar Dashboard</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {availableDashboards.map((dashboard) => (
          <button
            key={dashboard.id}
            onClick={() => onDashboardChange(dashboard.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              currentDashboard === dashboard.id
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {dashboard.name}
          </button>
        ))}
      </div>
    </div>
  );
};
