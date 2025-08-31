import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart } from './charts/BarChart';
import { MetricCard } from './MetricCard';
import { FilterBar } from './FilterBar';

import { GoogleSheetsService } from '../services/googleSheetsService';
import { filterDataByPeriodCustom } from '../utils/rhDateFilter';



interface RhData {
  DATA: string;
  ATENDIMENTO: string;
  ENTREVISTA: string;
  APROVADO: string;
  REPROVADOS: string;
}

interface RhMetrics {
  totalAtendimento: number;
  totalEntrevista: number;
  totalAprovado: number;
  totalReprovado: number;
}

interface RhChartData {
  atendimentoPorDia: Array<{ name: string; value: number }>;
  entrevistaPorDia: Array<{ name: string; value: number }>;
  aprovadoPorDia: Array<{ name: string; value: number }>;
  reprovadoPorDia: Array<{ name: string; value: number }>;
}

const RhDashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = React.useState<'hoje' | 'ontem' | 'semana' | 'mes'>('ontem');
  const [selectedVendor, setSelectedVendor] = React.useState<string>('todos');

  // Busca dados da planilha RH
  const { data: rawData, isLoading, error } = useQuery({
    queryKey: ['rh-data'],
    queryFn: async () => {
      console.log('📊 Buscando dados da planilha RH...');
      
      try {
        // Busca dados da planilha até coluna E (ATENDIMENTO, ENTREVISTA, APROVADO, REPROVADOS)
        const response = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/1lrpFiG9QCS_lWuy_RE8kGZ9SowbSQjYdRYR086C_fxM/values/2025!A:E?key=${import.meta.env.VITE_GOOGLE_SHEETS_API_KEY}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ Dados da planilha RH carregados com sucesso');
        return result.values || [];
      } catch (error) {
        console.error('❌ Erro ao buscar dados RH:', error);
        throw error;
      }
    },
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });

  // Processa e filtra os dados
  const { filteredData, metrics, chartData } = useMemo(() => {
    if (!rawData || rawData.length < 2) {
      return {
        filteredData: [],
        metrics: { totalAtendimento: 0, totalEntrevista: 0, totalAprovado: 0, totalReprovado: 0 },
        chartData: {
          atendimentoPorDia: [],
          entrevistaPorDia: [],
          aprovadoPorDia: [],
          reprovadoPorDia: []
        }
      };
    }

    // Pega os cabeçalhos (primeira linha)
    const headers = rawData[0];
    
    // Processa os dados (a partir da segunda linha)
    const processedData: RhData[] = rawData.slice(1).map((row: any[]) => {
      const data: any = {};
      headers.forEach((header: string, index: number) => {
        data[header] = row[index] || '';
      });
      return data as RhData;
    });

    // Filtra por período usando o serviço padrão
    const googleSheetsService = new GoogleSheetsService(import.meta.env.VITE_GOOGLE_SHEETS_API_KEY || '');
    
    // Log detalhado das datas para debug
    console.log('🔍 Debug - Primeiras 5 datas da planilha RH:');
    processedData.slice(0, 5).forEach((row, index) => {
      console.log(`  Linha ${index + 1}: DATA="${row.DATA}", ATENDIMENTO="${row.ATENDIMENTO}", ENTREVISTA="${row.ENTREVISTA}", APROVADO="${row.APROVADO}", REPROVADOS="${row.REPROVADOS}"`);
    });
    
    // Log específico para 29/08/2025
    const dados29 = processedData.filter(row => row.DATA === '29/08/2025');
    console.log('🔍 Dados específicos de 29/08/2025:', dados29);
    
    // Filtro customizado para RH que funciona com diferentes formatos de data
    const filteredData = filterDataByPeriodCustom(processedData, selectedPeriod);

    // Calcula métricas totais
    const metrics: RhMetrics = {
      totalAtendimento: 0,
      totalEntrevista: 0,
      totalAprovado: 0,
      totalReprovado: 0
    };

    filteredData.forEach((row) => {
      metrics.totalAtendimento += Number(row.ATENDIMENTO) || 0;
      metrics.totalEntrevista += Number(row.ENTREVISTA) || 0;
      metrics.totalAprovado += Number(row.APROVADO) || 0;
      metrics.totalReprovado += Number(row.REPROVADOS) || 0;
    });

    // Prepara dados para gráficos
    const chartData: RhChartData = {
      atendimentoPorDia: filteredData.map(row => ({
        name: row.DATA,
        value: Number(row.ATENDIMENTO) || 0
      })).filter(item => item.value > 0),
      entrevistaPorDia: filteredData.map(row => ({
        name: row.DATA,
        value: Number(row.ENTREVISTA) || 0
      })).filter(item => item.value > 0),
      aprovadoPorDia: filteredData.map(row => ({
        name: row.DATA,
        value: Number(row.APROVADO) || 0
      })).filter(item => item.value > 0),
      reprovadoPorDia: filteredData.map(row => ({
        name: row.DATA,
        value: Number(row.REPROVADOS) || 0
      })).filter(item => item.value > 0)
    };

    return { filteredData, metrics, chartData };
  }, [rawData, selectedPeriod]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando dados de RH...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Erro ao carregar dados</h2>
            <p className="text-gray-600">Não foi possível carregar os dados da planilha de RH.</p>
            <p className="text-sm text-gray-500 mt-2">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard RH</h1>
          <p className="text-gray-600">Processo RH - Clearwater Seguros</p>
        </div>

        {/* Filtros */}
        <FilterBar
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          selectedVendor={selectedVendor}
          onVendorChange={setSelectedVendor}
          vendors={[]}
          totalRecords={filteredData.length}
        />

        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Atendimento"
            value={metrics.totalAtendimento}
            format="number"
          />
          <MetricCard
            title="Total Entrevista"
            value={metrics.totalEntrevista}
            format="number"
          />
          <MetricCard
            title="Total Aprovado"
            value={metrics.totalAprovado}
            format="number"
          />
          <MetricCard
            title="Total Reprovado"
            value={metrics.totalReprovado}
            format="number"
          />
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Atendimento por Dia */}
          {chartData.atendimentoPorDia && chartData.atendimentoPorDia.length > 0 ? (
            <div>
              {filteredData.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-t-lg p-2 text-center">
                  <p className="text-xs text-yellow-700">📋 Nenhum registro encontrado para o período selecionado</p>
                </div>
              )}
              <BarChart
                data={chartData.atendimentoPorDia}
                xAxisKey="name"
                yAxisKey="value"
                title="Atendimento por Dia"
                color="#3b82f6"
              />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border p-6 flex items-center justify-center h-64">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-2">📊</div>
                <p>Nenhum dado de atendimento disponível</p>
                <p className="text-sm">para o período selecionado</p>
              </div>
            </div>
          )}

          {/* Entrevista por Dia */}
          {chartData.entrevistaPorDia && chartData.entrevistaPorDia.length > 0 ? (
            <div>
              {filteredData.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-t-lg p-2 text-center">
                  <p className="text-xs text-yellow-700">📋 Nenhum registro encontrado para o período selecionado</p>
                </div>
              )}
              <BarChart
                data={chartData.entrevistaPorDia}
                xAxisKey="name"
                yAxisKey="value"
                title="Entrevista por Dia"
                color="#10b981"
              />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border p-6 flex items-center justify-center h-64">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-2">📊</div>
                <p>Nenhum dado de entrevista disponível</p>
                <p className="text-sm">para o período selecionado</p>
              </div>
            </div>
          )}

          {/* Aprovado por Dia */}
          {chartData.aprovadoPorDia && chartData.aprovadoPorDia.length > 0 ? (
            <div>
              {filteredData.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-t-lg p-2 text-center">
                  <p className="text-xs text-yellow-700">📋 Nenhum registro encontrado para o período selecionado</p>
                </div>
              )}
              <BarChart
                data={chartData.aprovadoPorDia}
                xAxisKey="name"
                yAxisKey="value"
                title="Aprovado por Dia"
                color="#059669"
              />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border p-6 flex items-center justify-center h-64">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-2">📊</div>
                <p>Nenhum dado de aprovado disponível</p>
                <p className="text-sm">para o período selecionado</p>
              </div>
            </div>
          )}

          {/* Reprovado por Dia */}
          {chartData.reprovadoPorDia && chartData.reprovadoPorDia.length > 0 ? (
            <div>
              {filteredData.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-t-lg p-2 text-center">
                  <p className="text-xs text-yellow-700">📋 Nenhum registro encontrado para o período selecionado</p>
                </div>
              )}
              <BarChart
                data={chartData.reprovadoPorDia}
                xAxisKey="name"
                yAxisKey="value"
                title="Reprovado por Dia"
                color="#dc2626"
              />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border p-6 flex items-center justify-center h-64">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-2">📊</div>
                <p>Nenhum dado de reprovado disponível</p>
                <p className="text-sm">para o período selecionado</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RhDashboard;
