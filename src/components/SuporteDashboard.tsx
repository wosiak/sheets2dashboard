import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GoogleSheetsService } from '../services/googleSheetsService';
import { FilterBar } from './FilterBar';
import { MetricCard } from './MetricCard';

interface SuporteData {
  DATA: string;
  'ATIVIDADE DIÁRIA': string;
  'NOVA SOLICITAÇÃO': string;
  'NORMAL': string;
  'URGENTE': string;
  'CONCLUÍDO': string;
}

const SuporteDashboard = () => {
  console.log('🚀 SuporteDashboard - Componente inicializado');
  
  const [data, setData] = useState<SuporteData[]>([]);
  const [filteredData, setFilteredData] = useState<SuporteData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'hoje' | 'ontem' | 'semana' | 'mes'>('ontem');
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const googleSheetsService = new GoogleSheetsService(import.meta.env.VITE_GOOGLE_SHEETS_API_KEY);

  useEffect(() => {
    console.log('🔄 SuporteDashboard - useEffect inicial executado');
    fetchData();
  }, []);

  useEffect(() => {
    if (data.length > 0) {
      console.log('🔄 SuporteDashboard - useEffect de filtro executado');
      filterData();
    }
  }, [data, selectedPeriod]);

  const fetchData = async () => {
    try {
      console.log('📊 Buscando dados da planilha Suporte...');
      setLoading(true);
      setError(null);

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/19TdHUfkCIXzm4niGvC3JT95JRmUPz9-0sF7iCmBpGZ8/values/2025!A:F?key=${import.meta.env.VITE_GOOGLE_SHEETS_API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Dados da planilha Suporte carregados com sucesso');

      if (!result.values || result.values.length === 0) {
        setData([]);
        setLoading(false);
        return;
      }

      const headers = result.values[0];
      const rows = result.values.slice(1);

      const parsedData: SuporteData[] = rows.map((row: any[]) => {
        const obj: any = {};
        headers.forEach((header: string, index: number) => {
          obj[header] = row[index] || '';
        });
        return obj as SuporteData;
      });

      console.log('📊 Dados Suporte processados:', parsedData.length, 'registros');
      setData(parsedData);
    } catch (err) {
      console.error('❌ Erro ao buscar dados Suporte:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    console.log('🔑 GoogleSheetsService inicializado com API Key:', import.meta.env.VITE_GOOGLE_SHEETS_API_KEY ? '✅ Configurada' : '❌ Não configurada');
    console.log('📅 Filtrando dados por período:', selectedPeriod);
    
    const filtered = googleSheetsService.filterDataByPeriod(data, selectedPeriod);
    console.log('✅ Dados filtrados por período:', { period: selectedPeriod, count: filtered.length });
    setFilteredData(filtered);
  };

  const calculateMetrics = () => {
    if (filteredData.length === 0) {
      return {
        atividadeDiaria: 0,
        novaSolicitacao: 0,
        normal: 0,
        urgente: 0,
        concluido: 0,
      };
    }

    const atividadeDiaria = filteredData.reduce((sum, row) => {
      const value = parseInt(row['ATIVIDADE DIÁRIA'] || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    const novaSolicitacao = filteredData.reduce((sum, row) => {
      const value = parseInt(row['NOVA SOLICITAÇÃO'] || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    const normal = filteredData.reduce((sum, row) => {
      const value = parseInt(row['NORMAL'] || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    const urgente = filteredData.reduce((sum, row) => {
      const value = parseInt(row['URGENTE'] || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    const concluido = filteredData.reduce((sum, row) => {
      const value = parseInt(row['CONCLUÍDO'] || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    return {
      atividadeDiaria,
      novaSolicitacao,
      normal,
      urgente,
      concluido,
    };
  };

  const prepareChartData = () => {
    if (filteredData.length === 0) {
      return [
        { data: 'Sem dados', atividadeDiaria: 0, novaSolicitacao: 0, normal: 0, urgente: 0, concluido: 0 }
      ];
    }

    return filteredData.map(row => ({
      data: row.DATA,
      atividadeDiaria: parseInt(row['ATIVIDADE DIÁRIA'] || '0') || 0,
      novaSolicitacao: parseInt(row['NOVA SOLICITAÇÃO'] || '0') || 0,
      normal: parseInt(row['NORMAL'] || '0') || 0,
      urgente: parseInt(row['URGENTE'] || '0') || 0,
      concluido: parseInt(row['CONCLUÍDO'] || '0') || 0,
    }));
  };

  const metrics = calculateMetrics();
  const chartData = prepareChartData();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando dados Suporte...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="text-red-600 text-xl mb-4">❌ Erro ao carregar dados</div>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={fetchData}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Suporte</h1>
          <p className="text-gray-600">Dashboard de Atendimento e Solicitações</p>
        </div>

        <FilterBar
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          selectedVendor={selectedVendor}
          onVendorChange={setSelectedVendor}
          vendors={[]}
          totalRecords={filteredData.length}
          showVendorFilter={false}
        />

        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <MetricCard
            title="ATIVIDADE DIÁRIA"
            value={metrics.atividadeDiaria}
          />
          <MetricCard
            title="NOVA SOLICITAÇÃO"
            value={metrics.novaSolicitacao}
          />
          <MetricCard
            title="NORMAL"
            value={metrics.normal}
          />
          <MetricCard
            title="URGENTE"
            value={metrics.urgente}
          />
          <MetricCard
            title="CONCLUÍDO"
            value={metrics.concluido}
          />
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Atividade Diária */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Atividade Diária por Dia</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="data" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => Math.round(value).toString()}
                />
                <Tooltip 
                  formatter={(value: any) => [Math.round(value), 'Atividade Diária']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Bar dataKey="atividadeDiaria" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Nova Solicitação */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Nova Solicitação por Dia</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="data" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => Math.round(value).toString()}
                />
                <Tooltip 
                  formatter={(value: any) => [Math.round(value), 'Nova Solicitação']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Bar dataKey="novaSolicitacao" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Normal */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Normal por Dia</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="data" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => Math.round(value).toString()}
                />
                <Tooltip 
                  formatter={(value: any) => [Math.round(value), 'Normal']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Bar dataKey="normal" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Concluído */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Concluído por Dia</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="data" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => Math.round(value).toString()}
                />
                <Tooltip 
                  formatter={(value: any) => [Math.round(value), 'Concluído']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Bar dataKey="concluido" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico Urgente - Largura Total */}
        <div className="w-full">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Urgente por Dia</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="data" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => Math.round(value).toString()}
                />
                <Tooltip 
                  formatter={(value: any) => [Math.round(value), 'Urgente']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Bar dataKey="urgente" fill="#DC2626" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuporteDashboard;

