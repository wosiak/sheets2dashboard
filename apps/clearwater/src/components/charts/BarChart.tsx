import React from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

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
  format = 'number'
}) => {
  // Cores para as barras
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

  // Função para formatar valores
  const formatValue = (value: any) => {
    if (format === 'currency') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(Number(value));
    }
    return Math.round(Number(value)).toString();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <RechartsBarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
            allowDecimals={false}
            domain={[0, 'dataMax + 1']}
          />
          <Tooltip 
            formatter={(value: any) => {
              if (format === 'currency') {
                return [new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(Number(value)), ''];
              }
              return [Math.round(Number(value)), ''];
            }}
            labelStyle={{ color: '#374151' }}
          />
          <Bar dataKey={yAxisKey} radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
            <LabelList 
              dataKey={yAxisKey} 
              position="top" 
              style={{ fontSize: '12px', fontWeight: '600', fill: '#374151' }}
              formatter={formatValue}
            />
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};
