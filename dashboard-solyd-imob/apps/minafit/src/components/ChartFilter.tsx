import React, { useState } from 'react';

interface Chart {
  id: string;
  title: string;
}

interface ChartFilterProps {
  charts: Chart[];
  selectedCharts: string[];
  onChartToggle: (chartId: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}

export const ChartFilter: React.FC<ChartFilterProps> = ({
  charts,
  selectedCharts,
  onChartToggle,
  onSelectAll,
  onClearAll,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const allSelected = selectedCharts.length === charts.length;
  const someSelected = selectedCharts.length > 0 && selectedCharts.length < charts.length;

  return (
    <div className="relative inline-block">
      {/* Botão compacto */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
        </svg>
        <span className="text-sm font-medium text-gray-700">
          Gráficos ({selectedCharts.length}/{charts.length})
        </span>
        <svg 
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
          {/* Header do dropdown */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">
              Selecionar Gráficos
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={onSelectAll}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  allSelected
                    ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
                disabled={allSelected}
              >
                Todos
              </button>
              <button
                onClick={onClearAll}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  selectedCharts.length === 0
                    ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
                disabled={selectedCharts.length === 0}
              >
                Limpar
              </button>
            </div>
          </div>
          
          {/* Lista de gráficos */}
          <div className="max-h-64 overflow-y-auto p-3">
            <div className="grid grid-cols-1 gap-2">
              {charts.map((chart) => (
                <label
                  key={chart.id}
                  className="flex items-center space-x-3 p-2 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedCharts.includes(chart.id)}
                    onChange={() => onChartToggle(chart.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 font-medium">
                    {chart.title}
                  </span>
                </label>
              ))}
            </div>
          </div>
          
          {/* Footer com aviso */}
          {selectedCharts.length === 0 && (
            <div className="p-3 bg-yellow-50 border-t border-yellow-200 rounded-b-lg">
              <p className="text-xs text-yellow-800 text-center">
                ⚠️ Selecione pelo menos um gráfico
              </p>
            </div>
          )}
        </div>
      )}

      {/* Overlay para fechar ao clicar fora */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};
