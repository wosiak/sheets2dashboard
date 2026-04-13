import React from 'react';

interface MetricCardProps {
  title: string;
  value: number;
  format?: 'number' | 'currency' | 'percentage' | 'default';
  subtitle?: string;
  animationDelay?: number;
  variant?: 'default' | 'wide';
  icon?: 'calendar' | 'check' | 'phone' | 'phone-in' | 'phone-out' | 'money' | 'chart';
}

const icons: Record<string, JSX.Element> = {
  calendar: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  check: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  phone: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  'phone-in': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 3l-6 6m0 0V4m0 5h5M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  'phone-out': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 3h5m0 0v5m0-5l-6 6M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  money: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  chart: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
};

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  format = 'default',
  subtitle,
  animationDelay = 0,
  variant = 'default',
  icon = 'chart',
}) => {
  const formatValue = (val: number, fmt: string) => {
    switch (fmt) {
      case 'currency':
        return val.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          minimumFractionDigits: 2,
        });
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'number':
        return val.toLocaleString('pt-BR');
      default:
        return val.toString();
    }
  };

  const iconEl = icons[icon] || icons.chart;

  if (variant === 'wide') {
    return (
      <div
        className="metric-card metric-card-wide animate-fade-in-up"
        style={{ animationDelay: `${animationDelay}s` }}
      >
        <div className="flex items-center gap-4">
          <div className="metric-icon shrink-0">{iconEl}</div>
          <p className="metric-label shrink-0">{title}</p>
          <p className={`metric-value ${format === 'currency' ? 'is-currency' : ''}`}>
            {formatValue(value, format)}
          </p>
          {subtitle && (
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="metric-card animate-fade-in-up"
      style={{ animationDelay: `${animationDelay}s` }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="metric-label">{title}</p>
          <p className={`metric-value mt-1 ${format === 'currency' ? 'is-currency' : ''}`}>
            {formatValue(value, format)}
          </p>
          {subtitle && (
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>
          )}
        </div>
        <div className="metric-icon">{iconEl}</div>
      </div>
    </div>
  );
};
