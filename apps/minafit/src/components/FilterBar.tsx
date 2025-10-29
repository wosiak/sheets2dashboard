import React, { useState, useRef, useEffect } from 'react';
import { MonthFilter } from './MonthFilter';

interface FilterBarProps {
  selectedPeriod: 'hoje' | 'ontem' | 'semana' | 'mes' | 'custom';
  onPeriodChange: (period: 'hoje' | 'ontem' | 'semana' | 'mes' | 'custom') => void;
  selectedVendors: string[];
  onVendorsChange: (vendors: string[]) => void;
  vendors: string[];
  totalRecords: number;
  showVendorFilter?: boolean;
  selectedMonth?: string;
  onMonthChange?: (month: string) => void;
  selectedYear?: string;
  onYearChange?: (year: string) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedPeriod,
  onPeriodChange,
  selectedVendors,
  onVendorsChange,
  vendors,
  totalRecords,
  showVendorFilter = true,
  selectedMonth = '',
  onMonthChange = () => {},
  selectedYear = '',
  onYearChange = () => {},
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleVendorToggle = (vendor: string) => {
    if (selectedVendors.includes(vendor)) {
      onVendorsChange(selectedVendors.filter(v => v !== vendor));
    } else {
      onVendorsChange([...selectedVendors, vendor]);
    }
  };

  const handleSelectAll = () => {
    onVendorsChange([...vendors]);
  };

  const handleClearAll = () => {
    onVendorsChange([]);
  };

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex flex-wrap items-center justify-between gap-6">
        {/* Filtro de Período */}
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
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

          {selectedPeriod === 'custom' && (
            <MonthFilter
              selectedMonth={selectedMonth}
              onMonthChange={onMonthChange}
              selectedYear={selectedYear}
              onYearChange={onYearChange}
            />
          )}
        </div>

        {/* Dropdown de Corretores */}
        {showVendorFilter && (
          <div className="relative w-64" ref={dropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Corretores</label>

            {/* Botão que simula o select */}
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-left bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {selectedVendors.length > 0
                ? selectedVendors.join(', ')
                : 'Selecionar corretores'}
            </button>

            {/* Dropdown aberto */}
            {dropdownOpen && (
              <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto p-3">
                <div className="flex flex-wrap gap-2 mb-3">
                  <button
                    onClick={handleSelectAll}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Selecionar Todos
                  </button>
                  <button
                    onClick={handleClearAll}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Limpar
                  </button>
                </div>

                {vendors.map((vendor) => (
                  <label
                    key={vendor}
                    className="flex items-center gap-2 text-sm text-gray-700 mb-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedVendors.includes(vendor)}
                      onChange={() => handleVendorToggle(vendor)}
                      className="text-blue-600 focus:ring-blue-500 rounded"
                    />
                    {vendor}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Total de registros */}
        <div className="text-right w-full">
          <div className="text-sm text-gray-600">
            Total de registros: <span className="font-semibold text-gray-900">{totalRecords}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
