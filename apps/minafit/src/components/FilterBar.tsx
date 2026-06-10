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
    <div className="filter-bar">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">

        {/* PERÍODO */}
        <div>
          <label className="filter-label">Período</label>
          <select
            value={selectedPeriod}
            onChange={(e) => onPeriodChange(e.target.value as any)}
            className="filter-select"
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

        {/* CORRETORES */}
        <div className="relative w-64 mx-auto" ref={vendorRef}>
          <label className="filter-label">Corretores</label>

          <button
            onClick={() => setVendorDropdownOpen(!vendorDropdownOpen)}
            className="filter-dropdown-btn"
          >
            {selectedVendors.length > 0
              ? selectedVendors.join(', ')
              : 'Selecionar'}
          </button>

          {vendorDropdownOpen && (
            <div className="absolute z-10 mt-2 w-full filter-dropdown-panel">
              <div className="flex gap-3 mb-3">
                <button
                  className="text-xs font-medium"
                  style={{ color: 'var(--accent)' }}
                  onClick={() => onVendorsChange(vendors)}
                >
                  Selecionar todos
                </button>
                <button
                  className="text-xs font-medium text-red-400"
                  onClick={() => onVendorsChange([])}
                >
                  Limpar
                </button>
              </div>

              {vendors.map(v => (
                <label key={v} className="flex gap-2 text-sm mb-2 cursor-pointer">
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

        {/* FONTE + TOTAL */}
        <div className="flex items-end gap-6 justify-end">
          <div className="relative w-64" ref={sourceRef}>
            <label className="filter-label">Fonte</label>

            <button
              onClick={() => setSourceDropdownOpen(!sourceDropdownOpen)}
              className="filter-dropdown-btn"
            >
              {selectedSources.length > 0
                ? selectedSources.join(', ')
                : 'Selecionar'}
            </button>

            {sourceDropdownOpen && (
              <div className="absolute z-10 mt-2 w-full filter-dropdown-panel">
                <div className="flex gap-3 mb-3">
                  <button
                    className="text-xs font-medium"
                    style={{ color: 'var(--accent)' }}
                    onClick={() => onSourcesChange(sources)}
                  >
                    Selecionar todos
                  </button>
                  <button
                    className="text-xs font-medium text-red-400"
                    onClick={() => onSourcesChange([])}
                  >
                    Limpar
                  </button>
                </div>

                {sources.map(s => (
                  <label key={s} className="flex gap-2 text-sm mb-2 cursor-pointer">
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

          <div className="text-sm whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
            Total de registros:{' '}
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {totalRecords}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
