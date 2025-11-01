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

export const BarChart: React.FC<BarChartProps> = ({
  data,
  xAxisKey,
  yAxisKey,
  title,
  color = '#3b82f6',
  format = 'number',
}) => {
  const colors = [
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#06b6d4',
    '#84cc16',
    '#f97316',
  ];

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

  // 🔖 Custom label component
  const renderCustomLabel = (props: any) => {
    const { x, y, width, value } = props;
    const labelX = x + width / 2;
    const labelY = y - 6;
    return (
      <text
        x={labelX}
        y={labelY}
        fill="#374151"
        textAnchor="middle"
        fontSize={12}
        fontWeight={600}
      >
        {formatValue(value)}
      </text>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <RechartsBarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey={xAxisKey}
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={format === 'currency' ? formatValue : undefined}
            allowDecimals={false}
            domain={[0, 'dataMax + 1']}
          />
          <Tooltip
            formatter={(value: number) => [formatValue(value), '']}
            labelStyle={{ color: '#374151' }}
          />
          <Bar dataKey={yAxisKey} radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
              />
            ))}
            <LabelList dataKey={yAxisKey} content={renderCustomLabel} />
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};
