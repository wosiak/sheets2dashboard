import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';

interface BarChartProps {
  data: any[];
  xAxisKey: string;
  yAxisKey: string;
  title: string;
  color?: string;
  format?: 'number' | 'currency';
}

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
  '#3b82f6',
  '#84cc16',
];

const RESOLVED_COLORS = [
  '#8b5cf6',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#f97316',
  '#ec4899',
  '#3b82f6',
  '#84cc16',
];

export const BarChart: React.FC<BarChartProps> = ({
  data,
  xAxisKey,
  yAxisKey,
  title,
  color = '#3b82f6',
  format = 'number',
}) => {
  const formatValue = (value: number) => {
    if (format === 'currency') {
      return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
      });
    }
    return Math.round(value).toString();
  };

  const renderCustomLabel = (props: any) => {
    const { x, y, width, value } = props;
    const labelX = x + width / 2;
    const labelY = y - 6;
    return (
      <text
        x={labelX}
        y={labelY}
        fill="var(--text-secondary)"
        textAnchor="middle"
        fontSize={12}
        fontWeight={600}
      >
        {formatValue(value)}
      </text>
    );
  };

  return (
    <div className="chart-container animate-fade-in-up">
      <h3 className="chart-title">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <RechartsBarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
          <XAxis
            dataKey={xAxisKey}
            tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
            angle={-45}
            textAnchor="end"
            height={80}
            axisLine={{ stroke: 'var(--border-card)' }}
            tickLine={{ stroke: 'var(--border-card)' }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
            tickFormatter={format === 'currency' ? formatValue : undefined}
            allowDecimals={false}
            domain={[0, 'dataMax + 1']}
            axisLine={{ stroke: 'var(--border-card)' }}
            tickLine={{ stroke: 'var(--border-card)' }}
          />
          <Tooltip
            formatter={(value: number) => [formatValue(value), '']}
            contentStyle={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-card)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
            }}
            labelStyle={{ color: 'var(--text-primary)' }}
          />
          <Bar dataKey={yAxisKey} radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={RESOLVED_COLORS[index % RESOLVED_COLORS.length]}
              />
            ))}
            <LabelList dataKey={yAxisKey} content={renderCustomLabel} />
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};
