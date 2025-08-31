import React, { useState, useEffect } from 'react';
import { BarChart } from './charts/BarChart';
import { googleSheetsService } from '../services/googleSheetsService';
import { getDashboardConfig } from '../config/dashboards';

interface AdmDashboardProps {
  spreadsheetId: string;
}

export const AdmDashboard: React.FC<AdmDashboardProps> = ({ spreadsheetId }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'hoje' | 'ontem' | 'semana' | 'mes'>('mes');

  const config = getDashboardConfig('adm');

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

          {/* Estatísticas rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-2xl font-bold text-blue-600">
                {data.reduce((sum, row) => sum + (parseInt(row.atividade_diaria) || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Atividade Diária</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-2xl font-bold text-green-600">
                {data.reduce((sum, row) => sum + (parseInt(row.nova_proposta) || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Nova Proposta</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-2xl font-bold text-yellow-600">
                {data.reduce((sum, row) => sum + (parseInt(row.em_analise) || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Em Análise</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-2xl font-bold text-purple-600">
                {data.reduce((sum, row) => sum + (parseInt(row.implantada) || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Implantada</div>
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {config.charts.map((chart) => (
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
          <p>Total de registros: {data.length}</p>
        </div>
      </div>
    </div>
  );
};
