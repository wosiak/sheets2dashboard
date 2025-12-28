import React, { useState, useRef, useEffect } from 'react';
import { MonthFilter } from './MonthFilter';

interface FilterBarProps {
  selectedPeriod: 'hoje' | 'ontem' | 'semana' | 'mes' | 'custom';
  onPeriodChange: (period: 'hoje' | 'ontem' | 'semana' | 'mes' | 'custom') => void;

  selectedVendors: string[];
  onVendorsChange: (vendors: string[]) => void;
  vendors: string[];

  selectedSources: string[];
  onSourcesChange: (sources: string[]) => void;
  sources: string[];

  totalRecords: number;

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

  selectedSources,
  onSourcesChange,
  sources,

  totalRecords,
  selectedMonth = '',
  onMonthChange = () => {},
  selectedYear = '',
  onYearChange = () => {},
}) => {
  const [vendorDropdownOpen, setVendorDropdownOpen] = useState(false);
  const [sourceDropdownOpen, setSourceDropdownOpen] = useState(false);

  const vendorRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<HTMLDivElement>(null);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (vendorRef.current && !vendorRef.current.contains(event.target as Node)) {
        setVendorDropdownOpen(false);
      }

      if (sourceRef.current && !sourceRef.current.contains(event.target as Node)) {
        setSourceDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleItem = (
    item: string,
    selected: string[],
    onChange: (v: string[]) => void
  ) => {
    if (selected.includes(item)) {
      onChange(selected.filter(v => v !== item));
    } else {
      onChange([...selected, item]);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">

        {/* COLUNA ESQUERDA - PERÍODO */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Período
          </label>

          <select
            value={selectedPeriod}
            onChange={(e) =>
              onPeriodChange(e.target.value as any)
            }
            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full"
          >
            <option value="hoje">Hoje</option>
            <option value="ontem">Ontem</option>
            <option value="semana">Última Semana</option>
            <option value="mes">Mês Atual</option>
            <option value="custom">Mês Específico</option>
          </select>

          {selectedPeriod === 'custom' && (
            <div className="mt-3">
              <MonthFilter
                selectedMonth={selectedMonth}
                onMonthChange={onMonthChange}
                selectedYear={selectedYear}
                onYearChange={onYearChange}
              />
            </div>
          )}
        </div>

        {/* COLUNA DO MEIO - CORRETORES */}
        <div className="relative w-64 mx-auto" ref={vendorRef}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Corretores
          </label>

          <button
            onClick={() => setVendorDropdownOpen(!vendorDropdownOpen)}
            className="w-full border px-3 py-2 rounded text-sm text-left bg-white"
          >
            {selectedVendors.length > 0
              ? selectedVendors.join(', ')
              : 'Selecionar'}
          </button>

          {vendorDropdownOpen && (
            <div className="absolute z-10 mt-2 w-full bg-white border rounded shadow p-3 max-h-64 overflow-y-auto">
              <div className="flex gap-2 mb-3">
                <button
                  className="text-xs text-blue-600"
                  onClick={() => onVendorsChange(vendors)}
                >
                  Selecionar todos
                </button>
                <button
                  className="text-xs text-red-500"
                  onClick={() => onVendorsChange([])}
                >
                  Limpar
                </button>
              </div>

              {vendors.map(v => (
                <label key={v} className="flex gap-2 text-sm mb-2">
                  <input
                    type="checkbox"
                    checked={selectedVendors.includes(v)}
                    onChange={() =>
                      toggleItem(v, selectedVendors, onVendorsChange)
                    }
                  />
                  {v}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* COLUNA DIREITA - FONTE + TOTAL */}
        <div className="flex items-end gap-6 justify-end">

          {/* Fonte */}
          <div className="relative w-64" ref={sourceRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fonte
            </label>

            <button
              onClick={() => setSourceDropdownOpen(!sourceDropdownOpen)}
              className="w-full border px-3 py-2 rounded text-sm text-left bg-white"
            >
              {selectedSources.length > 0
                ? selectedSources.join(', ')
                : 'Selecionar'}
            </button>

            {sourceDropdownOpen && (
              <div className="absolute z-10 mt-2 w-full bg-white border rounded shadow p-3 max-h-64 overflow-y-auto">
                <div className="flex gap-2 mb-3">
                  <button
                    className="text-xs text-blue-600"
                    onClick={() => onSourcesChange(sources)}
                  >
                    Selecionar todos
                  </button>
                  <button
                    className="text-xs text-red-500"
                    onClick={() => onSourcesChange([])}
                  >
                    Limpar
                  </button>
                </div>

                {sources.map(s => (
                  <label key={s} className="flex gap-2 text-sm mb-2">
                    <input
                      type="checkbox"
                      checked={selectedSources.includes(s)}
                      onChange={() =>
                        toggleItem(s, selectedSources, onSourcesChange)
                      }
                    />
                    {s}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Total */}
          <div className="text-sm text-gray-600 whitespace-nowrap">
            Total de registros:{' '}
            <span className="font-semibold text-gray-900">
              {totalRecords}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
