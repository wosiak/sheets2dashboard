import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GoogleSheetsService } from '../services/googleSheetsService';
import { FilterBar } from './FilterBar';
import { MetricCard } from './MetricCard';

interface CustomSuccessData {
  DATA: string;
  'ATIVIDADE DIÁRIA': string;
  'OPORTUNIDADE': string;
  'INDICAÇÃO': string;
  'ENVIO DE BOLETO': string;
  'NOVO CLIENTE': string;
  '1 CONTATO': string;
  'RELACIONAMENTO': string;
  'SUPORTE': string;
  'INADIMPLENTE': string;
  'INSATISFEITO': string;
  'CANCELADA': string;
  'DESISTIU': string;
  'DUPLICADO': string;
  'RENOVAÇÃO': string;
}

const CustomSuccessDashboard = () => {
  console.log('🚀 CustomSuccessDashboard - Componente inicializado');
  
  const [data, setData] = useState<CustomSuccessData[]>([]);
  const [filteredData, setFilteredData] = useState<CustomSuccessData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'hoje' | 'ontem' | 'semana' | 'mes'>('ontem');
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const googleSheetsService = new GoogleSheetsService(import.meta.env.VITE_GOOGLE_SHEETS_API_KEY);

  useEffect(() => {
    console.log('🔄 CustomSuccessDashboard - useEffect inicial executado');
    fetchData();
  }, []);

  useEffect(() => {
    if (data.length > 0) {
      console.log('🔄 CustomSuccessDashboard - useEffect de filtro executado');
      filterData();
    }
  }, [data, selectedPeriod]);

  const fetchData = async () => {
    try {
      console.log('📊 Buscando dados da planilha Custom Success...');
      setLoading(true);
      setError(null);

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/1zqBau-zlqhgFb8ifl9X1qcLc-DtJhNw5-NtVcOGk3qc/values/2025!A:L?key=${import.meta.env.VITE_GOOGLE_SHEETS_API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Dados da planilha Custom Success carregados com sucesso');

      if (!result.values || result.values.length === 0) {
        setData([]);
        setLoading(false);
        return;
      }

      const headers = result.values[0];
      const rows = result.values.slice(1);

      const parsedData: CustomSuccessData[] = rows.map((row: any[]) => {
        const obj: any = {};
        headers.forEach((header: string, index: number) => {
          obj[header] = row[index] || '';
        });
        return obj as CustomSuccessData;
      });

      console.log('📊 Dados Custom Success processados:', parsedData.length, 'registros');
      setData(parsedData);
    } catch (err) {
      console.error('❌ Erro ao buscar dados Custom Success:', err);
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
        envioBoleto: 0,
        suporte: 0,
        cancelada: 0,
      };
    }

    const atividadeDiaria = filteredData.reduce((sum, row) => {
      const value = parseInt(row['ATIVIDADE DIÁRIA'] || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    const envioBoleto = filteredData.reduce((sum, row) => {
      const value = parseInt(row['ENVIO DE BOLETO'] || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    const suporte = filteredData.reduce((sum, row) => {
      const value = parseInt(row['SUPORTE'] || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    const cancelada = filteredData.reduce((sum, row) => {
      const value = parseInt(row['CANCELADA'] || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    return {
      atividadeDiaria,
      envioBoleto,
      suporte,
      cancelada,
    };
  };

  const prepareChartData = () => {
    if (filteredData.length === 0) {
      return [
        { data: 'Sem dados', atividadeDiaria: 0, envioBoleto: 0, suporte: 0, cancelada: 0 }
      ];
    }

    return filteredData.map(row => ({
      data: row.DATA,
      atividadeDiaria: parseInt(row['ATIVIDADE DIÁRIA'] || '0') || 0,
      envioBoleto: parseInt(row['ENVIO DE BOLETO'] || '0') || 0,
      suporte: parseInt(row['SUPORTE'] || '0') || 0,
      cancelada: parseInt(row['CANCELADA'] || '0') || 0,
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
            <p className="mt-4 text-gray-600">Carregando dados Custom Success...</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Custom Success</h1>
          <p className="text-gray-600">Dashboard de Atividades e Suporte</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="ATIVIDADE DIÁRIA"
            value={metrics.atividadeDiaria}
          />
          <MetricCard
            title="ENVIO DE BOLETO"
            value={metrics.envioBoleto}
          />
          <MetricCard
            title="SUPORTE"
            value={metrics.suporte}
          />
          <MetricCard
            title="CANCELADA"
            value={metrics.cancelada}
          />
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

          {/* Envio de Boleto */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Envio de Boleto por Dia</h3>
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
                  formatter={(value: any) => [Math.round(value), 'Envio de Boleto']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Bar dataKey="envioBoleto" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Suporte */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Suporte por Dia</h3>
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
                  formatter={(value: any) => [Math.round(value), 'Suporte']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Bar dataKey="suporte" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Cancelada */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cancelada por Dia</h3>
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
                  formatter={(value: any) => [Math.round(value), 'Cancelada']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Bar dataKey="cancelada" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomSuccessDashboard;
