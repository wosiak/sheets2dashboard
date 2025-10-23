import React from 'react';
import { MonthFilter } from './MonthFilter';

interface FilterBarProps {
  selectedPeriod: 'hoje' | 'ontem' | 'semana' | 'mes' | 'custom';
  onPeriodChange: (period: 'hoje' | 'ontem' | 'semana' | 'mes' | 'custom') => void;
  selectedVendor: string;
  onVendorChange: (vendor: string) => void;
  vendors: string[];
  totalRecords: number;
  showVendorFilter?: boolean;
  // Novos props para filtro de mês customizado
  selectedMonth?: string;
  onMonthChange?: (month: string) => void;
  selectedYear?: string;
  onYearChange?: (year: string) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedPeriod,
  onPeriodChange,
  selectedVendor,
  onVendorChange,
  vendors,
  totalRecords,
  showVendorFilter = true,
  selectedMonth = '',
  onMonthChange = () => {},
  selectedYear = '',
  onYearChange = () => {},
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Período
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => onPeriodChange(e.target.value as 'hoje' | 'ontem' | 'semana' | 'mes' | 'custom')}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="hoje">Hoje</option>
              <option value="ontem">Ontem</option>
              <option value="semana">Última Semana</option>
              <option value="mes">Mês Atual</option>
              <option value="custom">Mês Específico</option>
            </select>
          </div>

          {/* Filtro de Mês Específico */}
          {selectedPeriod === 'custom' && (
            <MonthFilter
              selectedMonth={selectedMonth}
              onMonthChange={onMonthChange}
              selectedYear={selectedYear}
              onYearChange={onYearChange}
            />
          )}

          {/* Filtro de Vendedor */}
          {showVendorFilter && (
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Corretor</label>
              <select
                value={selectedVendor}
                onChange={(e) => onVendorChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos os Corretores</option>
                {vendors.map((vendor) => (
                  <option key={vendor} value={vendor}>
                    {vendor}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="text-right">
          <div className="text-sm text-gray-600">
            Total de registros: <span className="font-semibold text-gray-900">{totalRecords}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
