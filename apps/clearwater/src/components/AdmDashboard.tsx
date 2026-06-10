import React, { useState, useEffect } from 'react';
import { BarChart } from './charts/BarChart';
import { googleSheetsService } from '../services/googleSheetsService';
import { getDashboardConfig } from '../config/dashboards';
import { ChartFilter } from './ChartFilter';

interface AdmDashboardProps {
  spreadsheetId: string;
}

export const AdmDashboard: React.FC<AdmDashboardProps> = ({ spreadsheetId }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'hoje' | 'ontem' | 'semana' | 'mes'>('mes');
  const [selectedCharts, setSelectedCharts] = useState<string[]>([]);

  const config = getDashboardConfig('adm');

  // Inicializar todos os gráficos como selecionados
  useEffect(() => {
    setSelectedCharts(config.charts.map(chart => chart.id));
  }, [config.charts]);

  // Funções para controlar a seleção de gráficos
  const handleChartToggle = (chartId: string) => {
    setSelectedCharts(prev => 
      prev.includes(chartId) 
        ? prev.filter(id => id !== chartId)
        : [...prev, chartId]
    );
  };

  const handleSelectAll = () => {
    setSelectedCharts(config.charts.map(chart => chart.id));
  };

  const handleClearAll = () => {
    setSelectedCharts([]);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const rawData = await googleSheetsService.fetchData(config.spreadsheetId, config.sheetName);
        const filteredData = googleSheetsService.filterDataByPeriod(rawData, period);
        
        setData(filteredData);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setError('Erro ao carregar dados da planilha');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Atualizar dados a cada intervalo configurado
    const interval = setInterval(fetchData, config.refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [config.spreadsheetId, config.sheetName, period, config.refreshInterval]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dados da planilha...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">Erro ao carregar dados</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ADM IMPLANTAÇÃO</h1>
          <p className="text-gray-600 mb-4">Dashboard de acompanhamento de processos administrativos</p>
          
          {/* Filtros de período */}
          <div className="flex justify-center space-x-2 mb-6">
            {(['hoje', 'ontem', 'semana', 'mes'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  period === p
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          {/* Filtro de Gráficos */}
          <ChartFilter
            charts={config.charts}
            selectedCharts={selectedCharts}
            onChartToggle={handleChartToggle}
            onSelectAll={handleSelectAll}
            onClearAll={handleClearAll}
          />

          {/* Estatísticas rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {config.charts
              .filter(chart => selectedCharts.includes(chart.id))
              .map((chart) => {
                const total = data.reduce((sum, row) => {
                  const value = parseInt(row[chart.dataKey] || '0');
                  return sum + (isNaN(value) ? 0 : value);
                }, 0);
                
                const colors = {
                  'atividade_diaria': 'text-blue-600',
                  'nova_proposta': 'text-green-600',
                  'pend_assinatura': 'text-purple-600',
                  'em_analise': 'text-yellow-600',
                  'pendencia': 'text-orange-600',
                  'entrevista_medica': 'text-indigo-600',
                  'boleto': 'text-pink-600',
                  'implantada': 'text-emerald-600',
                  'desistiu': 'text-red-600',
                  'erro_vendas': 'text-rose-600',
                  'declinada': 'text-gray-600',
                };
                
                return (
                  <div key={chart.id} className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className={`text-2xl font-bold ${colors[chart.dataKey as keyof typeof colors] || 'text-blue-600'}`}>
                      {total}
                    </div>
                    <div className="text-sm text-gray-600">{chart.title}</div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {config.charts
            .filter(chart => selectedCharts.includes(chart.id))
            .map((chart) => (
              <div key={chart.id} className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{chart.title}</h3>
                <div className="h-64">
                  <BarChart
                    data={data}
                    dataKey={chart.dataKey}
                    xAxisKey={chart.xAxisKey}
                    yAxisKey={chart.yAxisKey}
                  />
                </div>
              </div>
            ))}
        </div>

        {/* Informações adicionais */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Dados atualizados automaticamente a cada {config.refreshInterval} segundos</p>
          <p>Total de registros: {data.length} | Gráficos visíveis: {selectedCharts.length}/{config.charts.length}</p>
        </div>
      </div>
    </div>
  );
};
