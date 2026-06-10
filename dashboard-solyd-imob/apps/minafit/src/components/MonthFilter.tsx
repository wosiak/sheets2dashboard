import React from 'react';

interface MonthFilterProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  selectedYear: string;
  onYearChange: (year: string) => void;
}

export const MonthFilter: React.FC<MonthFilterProps> = ({
  selectedMonth,
  onMonthChange,
  selectedYear,
  onYearChange,
}) => {
  const months = [
    { value: '01', label: 'Janeiro' },
    { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' },
    { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="flex items-center gap-3">
      <div>
        <label className="filter-label">Mês</label>
        <select
          value={selectedMonth}
          onChange={(e) => onMonthChange(e.target.value)}
          className="filter-select"
        >
          <option value="">Selecione o mês</option>
          {months.map((month) => (
            <option key={month.value} value={month.value}>
              {month.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="filter-label">Ano</label>
        <select
          value={selectedYear}
          onChange={(e) => onYearChange(e.target.value)}
          className="filter-select"
        >
          <option value="">Selecione o ano</option>
          {years.map((year) => (
            <option key={year} value={year.toString()}>
              {year}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
