import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GoogleSheetsService } from '../services/googleSheetsService';
import { FilterBar } from './FilterBar';
import { MetricCard } from './MetricCard';

interface FinanceiroData {
  DATA: string;
  'NOVA PROPOSTA': string;
  'STATUS PROPOSTA': string;
  'NOTA FISCAL': string;
  'ESTORNO': string;
}

const FinanceiroDashboard = () => {
  console.log('🚀 FinanceiroDashboard - Componente inicializado');
  
  const [data, setData] = useState<FinanceiroData[]>([]);
  const [filteredData, setFilteredData] = useState<FinanceiroData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'hoje' | 'ontem' | 'semana' | 'mes'>('ontem');
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const googleSheetsService = new GoogleSheetsService(import.meta.env.VITE_GOOGLE_SHEETS_API_KEY);

  useEffect(() => {
    console.log('🔄 FinanceiroDashboard - useEffect inicial executado');
    fetchData();
  }, []);

  useEffect(() => {
    if (data.length > 0) {
      console.log('🔄 FinanceiroDashboard - useEffect de filtro executado');
      filterData();
    }
  }, [data, selectedPeriod]);

  const fetchData = async () => {
    try {
      console.log('📊 Buscando dados da planilha Financeiro...');
      setLoading(true);
      setError(null);

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/1yNtfhoSM_RlrDfH8OCCwkzwvsz7ZBmPiPS1RWvWa8eE/values/2025!A:H?key=${import.meta.env.VITE_GOOGLE_SHEETS_API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Dados da planilha Financeiro carregados com sucesso');

      if (!result.values || result.values.length === 0) {
        setData([]);
        setLoading(false);
        return;
      }

      const headers = result.values[0];
      const rows = result.values.slice(1);

      const parsedData: FinanceiroData[] = rows.map((row: any[]) => {
        const obj: any = {};
        headers.forEach((header: string, index: number) => {
          obj[header] = row[index] || '';
        });
        return obj as FinanceiroData;
      });

      console.log('📊 Dados Financeiro processados:', parsedData.length, 'registros');
      setData(parsedData);
    } catch (err) {
      console.error('❌ Erro ao buscar dados Financeiro:', err);
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
        novaProposta: 0,
        statusProposta: 0,
        notaFiscal: 0,
        estorno: 0,
      };
    }

    const novaProposta = filteredData.reduce((sum, row) => {
      const value = parseInt(row['NOVA PROPOSTA'] || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    const statusProposta = filteredData.reduce((sum, row) => {
      const value = parseInt(row['STATUS PROPOSTA'] || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    const notaFiscal = filteredData.reduce((sum, row) => {
      const value = parseInt(row['NOTA FISCAL'] || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    const estorno = filteredData.reduce((sum, row) => {
      const value = parseInt(row['ESTORNO'] || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    return {
      novaProposta,
      statusProposta,
      notaFiscal,
      estorno,
    };
  };

  const prepareChartData = () => {
    if (filteredData.length === 0) {
      return [
        { data: 'Sem dados', novaProposta: 0, statusProposta: 0, notaFiscal: 0, estorno: 0 }
      ];
    }

    return filteredData.map(row => ({
      data: row.DATA,
      novaProposta: parseInt(row['NOVA PROPOSTA'] || '0') || 0,
      statusProposta: parseInt(row['STATUS PROPOSTA'] || '0') || 0,
      notaFiscal: parseInt(row['NOTA FISCAL'] || '0') || 0,
      estorno: parseInt(row['ESTORNO'] || '0') || 0,
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
            <p className="mt-4 text-gray-600">Carregando dados Financeiro...</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Financeiro</h1>
          <p className="text-gray-600">Dashboard de Propostas, Faturas e Estornos</p>
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
            title="NOVA PROPOSTA"
            value={metrics.novaProposta}
          />
          <MetricCard
            title="STATUS PROPOSTA"
            value={metrics.statusProposta}
          />
          <MetricCard
            title="NOTA FISCAL"
            value={metrics.notaFiscal}
          />
          <MetricCard
            title="ESTORNO"
            value={metrics.estorno}
          />
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Nova Proposta */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Nova Proposta por Dia</h3>
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
                  formatter={(value: any) => [Math.round(value), 'Nova Proposta']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Bar dataKey="novaProposta" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Status Proposta */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Proposta por Dia</h3>
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
                  formatter={(value: any) => [Math.round(value), 'Status Proposta']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Bar dataKey="statusProposta" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Nota Fiscal */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Nota Fiscal por Dia</h3>
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
                  formatter={(value: any) => [Math.round(value), 'Nota Fiscal']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Bar dataKey="notaFiscal" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Estorno */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estorno por Dia</h3>
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
                  formatter={(value: any) => [Math.round(value), 'Estorno']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Bar dataKey="estorno" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceiroDashboard;
