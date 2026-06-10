import React from 'react';

interface FilterOption {
  label: string;
  value: string;
}

interface FiltersProps {
  filters: Record<string, FilterOption[]>;
  selectedFilters: Record<string, string>;
  onFilterChange: (filterKey: string, value: string) => void;
}

export const Filters: React.FC<FiltersProps> = ({ 
  filters, 
  selectedFilters, 
  onFilterChange 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Filtros</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Object.entries(filters).map(([filterKey, options]) => (
          <div key={filterKey} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 capitalize">
              {filterKey.replace(/([A-Z])/g, ' $1').toLowerCase()}
            </label>
            <select
              value={selectedFilters[filterKey] || ''}
              onChange={(e) => onFilterChange(filterKey, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};
