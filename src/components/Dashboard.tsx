import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart } from './charts/BarChart';
import { PieChart } from './charts/PieChart';
import { MetricCard } from './MetricCard';
import { FilterBar } from './FilterBar';
import { getDashboardConfig } from '../config/dashboards';
import { GoogleSheetsService } from '../services/googleSheetsService';
import { getMockDataForDashboard } from '../data/mockData';

interface DashboardProps {
  dashboardName: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ dashboardName }) => {
  const config = getDashboardConfig(dashboardName);
  const [selectedPeriod, setSelectedPeriod] = React.useState<'hoje' | 'ontem' | 'semana' | 'mes'>('ontem');
  const [selectedVendor, setSelectedVendor] = React.useState<string>('');

  const hasApiKey = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY && import.meta.env.VITE_GOOGLE_SHEETS_API_KEY !== 'your_google_sheets_api_key_here';
  console.log('🔍 Dashboard - Configuração:', { dashboardName: config.sheetName, spreadsheetId: config.spreadsheetId, hasApiKey: !!hasApiKey });

  const googleSheetsService = new GoogleSheetsService(import.meta.env.VITE_GOOGLE_SHEETS_API_KEY || '');

  const { data: rawData, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard-data', dashboardName, config.spreadsheetId, config.sheetName],
    queryFn: async () => {
      console.log('🚀 Iniciando busca de dados para:', config.sheetName);
      if (hasApiKey && config.spreadsheetId && config.spreadsheetId !== 'YOUR_SPREADSHEET_ID_HERE') {
        try {
          console.log('📊 Buscando dados reais da planilha...');
          const sheetData = await googleSheetsService.getSheetData(config.spreadsheetId, config.sheetName);
          const parsedData = googleSheetsService.parseSheetData(sheetData);
          console.log('✅ Dados reais carregados com sucesso:', { 
            dashboard: config.sheetName, 
            rowsCount: parsedData.length, 
            columns: Object.keys(parsedData[0] || {}), 
            sampleData: parsedData.slice(0, 2) 
          });
          return parsedData;
        } catch (error) {
          console.error('❌ Erro ao buscar dados da planilha:', error);
          console.log('🔄 Fallback para dados de exemplo...');
          return getMockDataForDashboard(config.sheetName);
        }
      } else {
        console.log('🔄 Usando dados de exemplo (sem API key ou ID da planilha)');
        return getMockDataForDashboard(config.sheetName);
      }
    },
    refetchInterval: config.refreshInterval * 1000,
    staleTime: config.refreshInterval * 1000,
  });

  // Filtra dados por período
  const filteredData = React.useMemo(() => {
    if (!rawData || !rawData.length) return [];
    
    console.log('📅 Aplicando filtro de período:', selectedPeriod);
    const periodFiltered = googleSheetsService.filterDataByPeriod(rawData, selectedPeriod);
    console.log('📊 Dados filtrados por período:', { period: selectedPeriod, count: periodFiltered.length });
    
    // Filtra por vendedor se selecionado
    if (selectedVendor) {
      const vendorFiltered = periodFiltered.filter((row: any) => row.VENDEDOR === selectedVendor);
      console.log('👤 Dados filtrados por vendedor:', { vendor: selectedVendor, count: vendorFiltered.length });
      return vendorFiltered;
    }
    
    return periodFiltered;
  }, [rawData, selectedPeriod, selectedVendor]);

  // Calcula métricas dinâmicas
  const metrics = React.useMemo(() => {
    if (!filteredData.length) return {};
    
    console.log('🧮 Calculando métricas para dados filtrados...');
    
    const metrics: Record<string, number> = {};
    
    // Soma colunas A-H
    const numericColumns = ['LEADS', 'COTAÇÃO DIÁRIA', 'LIGAÇÃO DIÁRIA', 'FOLLOW UP', 'CONTRATOS - DIÁRIO'];
    
    numericColumns.forEach(column => {
      const total = filteredData.reduce((sum, row) => {
        const value = row[column];
        return sum + (typeof value === 'number' ? value : 0);
      }, 0);
      
      if (total > 0) {
        metrics[column.toLowerCase().replace(/\s+/g, '_')] = total;
      }
    });
    
    // Métricas específicas (removido total_vendedores e total_registros)
    
    console.log('📊 Métricas calculadas:', metrics);
    return metrics;
  }, [filteredData]);

  // Dados para gráficos - usa métricas por vendedor
  const chartData = React.useMemo(() => {
    console.log('📈 Gerando dados para gráficos...');
    console.log('📊 Dados filtrados disponíveis:', filteredData.length);
    console.log('📋 Primeiros dados filtrados:', filteredData.slice(0, 3));
    
    // Obtém métricas agregadas por vendedor
    const vendorMetrics = googleSheetsService.getVendorMetrics(filteredData);
    console.log('👥 Métricas por vendedor:', vendorMetrics);
    
    const data: Record<string, any[]> = {};
    
    // Função para ordenar dados em ordem decrescente
    const sortByValue = (arr: any[]) => {
      return arr.sort((a, b) => b.value - a.value);
    };
    
    // Gráfico de leads por vendedor - SEMPRE mostra dados reais ou zero
    if (vendorMetrics.length > 0) {
      // Dados reais dos filtros
      data.leadsPorVendedor = sortByValue(vendorMetrics.map(vendor => ({
        name: vendor.vendedor,
        value: vendor.leads
      })));
      
      data.cotacaoPorVendedor = sortByValue(vendorMetrics.map(vendor => ({
        name: vendor.vendedor,
        value: vendor.cotacao_diaria
      })));
      
      data.followUpPorVendedor = sortByValue(vendorMetrics.map(vendor => ({
        name: vendor.vendedor,
        value: vendor.follow_up
      })));
      
      data.contratosPorVendedor = sortByValue(vendorMetrics.map(vendor => ({
        name: vendor.vendedor,
        value: vendor.contratos
      })));
      
      console.log('✅ Gráficos com dados reais gerados');
    } else {
      // Se não há dados filtrados, mostra gráficos vazios mas com estrutura
      console.log('⚠️ Nenhum dado encontrado para o período, criando gráficos vazios...');
      
      // Pega todos os vendedores únicos dos dados originais para mostrar estrutura
      const allVendors = new Set(rawData?.map(row => row.VENDEDOR).filter(Boolean) || []);
      const vendorList = Array.from(allVendors).sort();
      
      if (vendorList.length > 0) {
        // Cria dados com valor zero (não aleatórios)
        data.leadsPorVendedor = vendorList.map(vendor => ({
          name: vendor,
          value: 0
        }));
        
        data.cotacaoPorVendedor = vendorList.map(vendor => ({
          name: vendor,
          value: 0
        }));
        
        data.followUpPorVendedor = vendorList.map(vendor => ({
          name: vendor,
          value: 0
        }));
        
        data.contratosPorVendedor = vendorList.map(vendor => ({
          name: vendor,
          value: 0
        }));
        
        console.log('⚠️ Gráficos vazios criados');
      }
    }
    
    console.log('📊 Dados para gráficos gerados:', Object.keys(data));
    console.log('📈 Exemplo de dados de leads (ordenados):', data.leadsPorVendedor);
    return data;
  }, [filteredData, rawData]);

  // Lista de vendedores únicos para filtro
  const vendors = React.useMemo(() => {
    if (!rawData) return [];
    const uniqueVendors = new Set(rawData.map(row => row.VENDEDOR).filter(Boolean));
    return Array.from(uniqueVendors).sort();
  }, [rawData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-semibold">Erro ao carregar dados</h3>
        <p className="text-red-600 mt-2">Verifique o console para mais detalhes.</p>
        <button 
          onClick={() => refetch()}
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  const isRealData = hasApiKey && config.spreadsheetId && config.spreadsheetId !== 'YOUR_SPREADSHEET_ID_HERE';

  return (
    <div className="space-y-6">
      {/* Header com informações do dashboard */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Dashboard de {dashboardName.charAt(0).toUpperCase() + dashboardName.slice(1)}
            </h1>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <FilterBar
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        selectedVendor={selectedVendor}
        onVendorChange={setSelectedVendor}
        vendors={vendors}
        totalRecords={filteredData.length}
      />

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(metrics).map(([key, value]) => (
          <MetricCard
            key={key}
            title={key === 'cotacao_diaria' ? 'COTAÇÃO DIÁRIA' : key.replace(/_/g, ' ').toUpperCase()}
            value={value}
            format={key.includes('leads') || key.includes('cotacao') || key.includes('follow') || key.includes('contratos') ? 'number' : 'default'}
          />
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {chartData.leadsPorVendedor && chartData.leadsPorVendedor.length > 0 ? (
          <div>
            {filteredData.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-t-lg p-2 text-center">
                <p className="text-xs text-yellow-700">📊 Nenhum registro encontrado para o período selecionado</p>
              </div>
            )}
            <BarChart
              data={chartData.leadsPorVendedor}
              xAxisKey="name"
              yAxisKey="value"
              title="Leads por Vendedor"
              color="#3b82f6"
            />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border p-6 flex items-center justify-center h-64">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-2">📊</div>
              <p>Nenhum dado de leads disponível</p>
              <p className="text-sm">para o período selecionado</p>
            </div>
          </div>
        )}
        
        {chartData.cotacaoPorVendedor && chartData.cotacaoPorVendedor.length > 0 ? (
          <div>
            {filteredData.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-t-lg p-2 text-center">
                <p className="text-xs text-yellow-700">📈 Nenhum registro encontrado para o período selecionado</p>
              </div>
            )}
            <BarChart
              data={chartData.cotacaoPorVendedor}
              xAxisKey="name"
              yAxisKey="value"
              title="Cotações por Vendedor"
              color="#10b981"
            />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border p-6 flex items-center justify-center h-64">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-2">📈</div>
              <p>Nenhum dado de cotações disponível</p>
              <p className="text-sm">para o período selecionado</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {chartData.followUpPorVendedor && chartData.followUpPorVendedor.length > 0 ? (
          <div>
            {filteredData.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-t-lg p-2 text-center">
                <p className="text-xs text-yellow-700">📞 Nenhum registro encontrado para o período selecionado</p>
              </div>
            )}
            <BarChart
              data={chartData.followUpPorVendedor}
              xAxisKey="name"
              yAxisKey="value"
              title="Follow Up por Vendedor"
              color="#f59e0b"
            />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border p-6 flex items-center justify-center h-64">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-2">📞</div>
              <p>Nenhum dado de follow up disponível</p>
              <p className="text-sm">para o período selecionado</p>
            </div>
          </div>
        )}
        
        {chartData.contratosPorVendedor && chartData.contratosPorVendedor.length > 0 ? (
          <div>
            {filteredData.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-t-lg p-2 text-center">
                <p className="text-xs text-yellow-700">📋 Nenhum registro encontrado para o período selecionado</p>
              </div>
            )}
            <BarChart
              data={chartData.contratosPorVendedor}
              xAxisKey="name"
              yAxisKey="value"
              title="Contratos por Vendedor"
              color="#8b5cf6"
            />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border p-6 flex items-center justify-center h-64">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-2">📋</div>
              <p>Nenhum dado de contratos disponível</p>
              <p className="text-sm">para o período selecionado</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
