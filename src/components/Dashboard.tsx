import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart } from './charts/BarChart';
import { MetricCard } from './MetricCard';
import { FilterBar } from './FilterBar';
import { MonthFilter } from './MonthFilter';
import { getDashboardConfig } from '../config/dashboards';
import { GoogleSheetsService } from '../services/googleSheetsService';
import { getMockDataForDashboard } from '../data/mockData';
import RhDashboard from './RhDashboard';
import CustomSuccessDashboard from './CustomSuccessDashboard';
import SuporteDashboard from './SuporteDashboard';
import RetencaoDashboard from './RetencaoDashboard';
import FinanceiroDashboard from './FinanceiroDashboard';
import { ChartFilter } from './ChartFilter';

interface DashboardProps {
  dashboardName: string;
}

// Componente separado para dashboard de vendas
const VendasDashboard: React.FC<{ config: any }> = ({ config }) => {
  const [selectedPeriod, setSelectedPeriod] = React.useState<'hoje' | 'ontem' | 'semana' | 'mes' | 'custom'>('ontem');
  const [selectedVendor, setSelectedVendor] = React.useState<string>('');
  const [selectedMonth, setSelectedMonth] = React.useState<string>('');
  const [selectedYear, setSelectedYear] = React.useState<string>('');

  const hasApiKey = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY && import.meta.env.VITE_GOOGLE_SHEETS_API_KEY !== 'your_google_sheets_api_key_here';
  const googleSheetsService = new GoogleSheetsService(import.meta.env.VITE_GOOGLE_SHEETS_API_KEY || '');

  const { data: rawData, isLoading, error } = useQuery({
    queryKey: ['dashboard-data', 'vendas', config.spreadsheetId, config.sheetName],
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
    const periodFiltered = googleSheetsService.filterDataByPeriod(
      rawData, 
      selectedPeriod, 
      selectedPeriod === 'custom' ? selectedMonth : undefined,
      selectedPeriod === 'custom' ? selectedYear : undefined
    );
    console.log('📊 Dados filtrados por período:', { period: selectedPeriod, count: periodFiltered.length });
    
    // Filtra por vendedor se selecionado
    if (selectedVendor) {
      const vendorFiltered = periodFiltered.filter((row: any) => row.VENDEDOR === selectedVendor);
      console.log('👤 Dados filtrados por vendedor:', { vendor: selectedVendor, count: vendorFiltered.length });
      return vendorFiltered;
    }
    
    return periodFiltered;
  }, [rawData, selectedPeriod, selectedVendor, selectedMonth, selectedYear]);

  // Calcula métricas dinâmicas
  const metrics = React.useMemo(() => {
    if (!filteredData.length) return {};
    
    console.log('🧮 Calculando métricas para dados filtrados...');
    
    const metrics: Record<string, number> = {};
    
    // Soma colunas A-J
    const numericColumns = ['LEADS', 'COTAÇÃO DIÁRIA', 'LIGAÇÃO DIÁRIA', 'FOLLOW UP', 'CONTRATOS - DIÁRIO', 'FATURAMENTO', 'QUALIFICAÇÃO', 'FEEDBACK'];
    
    numericColumns.forEach(column => {
      const total = filteredData.reduce((sum, row) => {
        const value = row[column];
        return sum + (typeof value === 'number' ? value : 0);
      }, 0);
      
      if (total > 0) {
        metrics[column.toLowerCase().replace(/\s+/g, '_')] = total;
      }
    });
    
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
      
      data.ligacaoPorVendedor = sortByValue(vendorMetrics.map(vendor => ({
        name: vendor.vendedor,
        value: vendor.ligacao_diaria
      })));
      
      data.followUpPorVendedor = sortByValue(vendorMetrics.map(vendor => ({
        name: vendor.vendedor,
        value: vendor.follow_up
      })));
      
      data.contratosPorVendedor = sortByValue(vendorMetrics.map(vendor => ({
        name: vendor.vendedor,
        value: vendor.contratos
      })));
      
      data.faturamentoPorVendedor = sortByValue(vendorMetrics.map(vendor => ({
        name: vendor.vendedor,
        value: vendor.faturamento
      })));
      
      data.qualificacaoPorVendedor = sortByValue(vendorMetrics.map(vendor => ({
        name: vendor.vendedor,
        value: vendor.qualificacao
      })));
      
      data.feedbackPorVendedor = sortByValue(vendorMetrics.map(vendor => ({
        name: vendor.vendedor,
        value: vendor.feedback
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
        
        data.ligacaoPorVendedor = vendorList.map(vendor => ({
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
        
        data.faturamentoPorVendedor = vendorList.map(vendor => ({
          name: vendor,
          value: 0
        }));
        
        data.qualificacaoPorVendedor = vendorList.map(vendor => ({
          name: vendor,
          value: 0
        }));
        
        data.feedbackPorVendedor = vendorList.map(vendor => ({
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
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando dados da planilha...</p>
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
            <div className="text-red-500 text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Erro ao carregar dados</h2>
            <p className="text-gray-600 mb-6">Não foi possível conectar com a planilha</p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-red-700">
                Verifique se a planilha está acessível e se as permissões estão corretas.
              </p>
            </div>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard de Vendas</h1>
          <p className="text-gray-600">Acompanhamento de performance e métricas de vendas</p>
        </div>

        {/* Filtros */}
        <FilterBar
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          selectedVendor={selectedVendor}
          onVendorChange={setSelectedVendor}
          vendors={vendors}
          totalRecords={filteredData.length}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
        />

        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(metrics).map(([key, value]) => (
            <MetricCard
              key={key}
              title={key === 'cotacao_diaria' ? 'COTAÇÃO DIÁRIA' : key.replace(/_/g, ' ').toUpperCase()}
              value={value}
              format={key.includes('faturamento') ? 'currency' : key.includes('leads') || key.includes('cotacao') || key.includes('follow') || key.includes('contratos') ? 'number' : 'default'}
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {chartData.faturamentoPorVendedor && chartData.faturamentoPorVendedor.length > 0 ? (
            <div>
              {filteredData.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-t-lg p-2 text-center">
                  <p className="text-xs text-yellow-700">💰 Nenhum registro encontrado para o período selecionado</p>
                </div>
              )}
              <BarChart
                data={chartData.faturamentoPorVendedor}
                xAxisKey="name"
                yAxisKey="value"
                title="Faturamento por Vendedor"
                color="#ef4444"
                format="currency"
              />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border p-6 flex items-center justify-center h-64">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-2">💰</div>
                <p>Nenhum dado de faturamento disponível</p>
                <p className="text-sm">para o período selecionado</p>
              </div>
            </div>
          )}
          
          {chartData.ligacaoPorVendedor && chartData.ligacaoPorVendedor.length > 0 ? (
            <div>
              {filteredData.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-t-lg p-2 text-center">
                  <p className="text-xs text-yellow-700">📞 Nenhum registro encontrado para o período selecionado</p>
                </div>
              )}
              <BarChart
                data={chartData.ligacaoPorVendedor}
                xAxisKey="name"
                yAxisKey="value"
                title="Ligação Diária por Vendedor"
                color="#06b6d4"
              />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border p-6 flex items-center justify-center h-64">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-2">📞</div>
                <p>Nenhum dado de ligação diária disponível</p>
                <p className="text-sm">para o período selecionado</p>
              </div>
            </div>
          )}
        </div>

        {/* Novos gráficos de Qualificação e Feedback */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {chartData.qualificacaoPorVendedor && chartData.qualificacaoPorVendedor.length > 0 ? (
            <div>
              {filteredData.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-t-lg p-2 text-center">
                  <p className="text-xs text-yellow-700">🎯 Nenhum registro encontrado para o período selecionado</p>
                </div>
              )}
              <BarChart
                data={chartData.qualificacaoPorVendedor}
                xAxisKey="name"
                yAxisKey="value"
                title="Qualificação por Vendedor"
                color="#8b5cf6"
              />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border p-6 flex items-center justify-center h-64">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-2">🎯</div>
                <p>Nenhum dado de qualificação disponível</p>
                <p className="text-sm">para o período selecionado</p>
              </div>
            </div>
          )}
          
          {chartData.feedbackPorVendedor && chartData.feedbackPorVendedor.length > 0 ? (
            <div>
              {filteredData.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-t-lg p-2 text-center">
                  <p className="text-xs text-yellow-700">💬 Nenhum registro encontrado para o período selecionado</p>
                </div>
              )}
              <BarChart
                data={chartData.feedbackPorVendedor}
                xAxisKey="name"
                yAxisKey="value"
                title="Feedback por Vendedor"
                color="#10b981"
              />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border p-6 flex items-center justify-center h-64">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-2">💬</div>
                <p>Nenhum dado de feedback disponível</p>
                <p className="text-sm">para o período selecionado</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente separado para dashboard de ADM
const AdmDashboardSimple: React.FC<{ config: any }> = ({ config }) => {
  const [selectedPeriod, setSelectedPeriod] = React.useState<'hoje' | 'ontem' | 'semana' | 'mes' | 'custom'>('ontem');
  const [selectedCharts, setSelectedCharts] = React.useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = React.useState<string>('');
  const [selectedYear, setSelectedYear] = React.useState<string>('');
  
  const hasApiKey = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY && import.meta.env.VITE_GOOGLE_SHEETS_API_KEY !== 'your_google_sheets_api_key_here';
  
  // Inicializar todos os gráficos como selecionados
  React.useEffect(() => {
    setSelectedCharts([
      'atividade-diaria',
      'nova-proposta', 
      'pend-assinatura',
      'em-analise',
      'pendencia',
      'entrevista-medica',
      'boleto',
      'implantada',
      'desistiu',
      'erro-vendas',
      'declinada'
    ]);
  }, []);
  
  // Busca dados da planilha ADM
  const { data: rawData, isLoading, error } = useQuery({
    queryKey: ['adm-data', config.spreadsheetId, config.sheetName],
    queryFn: async () => {
      console.log('📊 Buscando dados da planilha ADM...');
      
      if (hasApiKey && config.spreadsheetId) {
        try {
          // Busca dados da planilha até coluna L
          const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/2025!A:L?key=${import.meta.env.VITE_GOOGLE_SHEETS_API_KEY}`
          );
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          console.log('✅ Dados ADM carregados:', data.values?.length || 0, 'linhas');
          return data.values || [];
        } catch (error) {
          console.error('❌ Erro ao buscar dados ADM:', error);
          return [];
        }
      }
      return [];
    },
    refetchInterval: config.refreshInterval * 1000,
    staleTime: 30 * 1000,
  });

  // Filtra dados por período
  const filteredData = React.useMemo(() => {
    if (!rawData || rawData.length < 2) return { headers: [], rows: [] };
    
    // Primeira linha são os headers
    const headers = rawData[0];
    const dataRows = rawData.slice(1);
    
    // Filtra por período
    const today = new Date();
    const brasiliaTime = new Date(today.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
    
    const filteredRows = dataRows.filter((row: any[]) => {
      if (!row[0]) return false; // Pula linhas sem data
      
      const rowDate = row[0]; // Coluna A é a DATA
      const rowDateParts = rowDate.split('/');
      
      if (rowDateParts.length < 2) return false;
      
      const day = parseInt(rowDateParts[0]);
      const month = parseInt(rowDateParts[1]) - 1;
      const year = rowDateParts[2] ? parseInt(rowDateParts[2]) : brasiliaTime.getFullYear();
      
      if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
      
      const rowDateObj = new Date(year, month, day);
      
      switch (selectedPeriod) {
        case 'hoje':
          return rowDateObj.getDate() === brasiliaTime.getDate() && 
                 rowDateObj.getMonth() === brasiliaTime.getMonth() && 
                 rowDateObj.getFullYear() === brasiliaTime.getFullYear();
        case 'ontem':
          const yesterday = new Date(brasiliaTime);
          yesterday.setDate(yesterday.getDate() - 1);
          return rowDateObj.getDate() === yesterday.getDate() && 
                 rowDateObj.getMonth() === yesterday.getMonth() && 
                 rowDateObj.getFullYear() === yesterday.getFullYear();
        case 'semana':
          const weekAgo = new Date(brasiliaTime);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return rowDateObj >= weekAgo;
        case 'mes':
          return rowDateObj.getMonth() === brasiliaTime.getMonth() && 
                 rowDateObj.getFullYear() === brasiliaTime.getFullYear();
        case 'custom':
          if (!selectedMonth || !selectedYear) return false;
          const targetMonth = parseInt(selectedMonth) - 1; // Mês começa em 0
          const targetYear = parseInt(selectedYear);
          return rowDateObj.getMonth() === targetMonth && rowDateObj.getFullYear() === targetYear;
        default:
          return true;
      }
    });
    
    console.log('📅 Dados ADM filtrados por período:', { period: selectedPeriod, count: filteredRows.length });
    return { headers, rows: filteredRows };
  }, [rawData, selectedPeriod, selectedMonth, selectedYear]);

  // Calcula métricas
  const metrics = React.useMemo(() => {
    if (!filteredData.rows || filteredData.rows.length === 0) {
      return {
        atividade_diaria: 0,
        nova_proposta: 0,
        pend_assinatura: 0,
        em_analise: 0,
        pendencia: 0,
        entrevista_medica: 0,
        boleto: 0,
        implantada: 0,
        desistiu: 0,
        erro_vendas: 0,
        declinada: 0
      };
    }
    
    const headers = filteredData.headers;
    const rows = filteredData.rows;
    
    // Encontra índices das colunas
    const dataIndex = headers.findIndex((h: string) => h === 'DATA');
    const atividadeIndex = headers.findIndex((h: string) => h === 'ATIVIDADE DIÁRIA');
    const propostaIndex = headers.findIndex((h: string) => h === 'NOVA PROPOSTA');
    const pendAssinaturaIndex = headers.findIndex((h: string) => h === 'PEND ASSINATURA');
    const analiseIndex = headers.findIndex((h: string) => h === 'EM ANÁLISE');
    const pendenciaIndex = headers.findIndex((h: string) => h === 'PENDÊNCIA');
    const entrevistaMedicaIndex = headers.findIndex((h: string) => h === 'ENTREVISTA MÉDICA');
    const boletoIndex = headers.findIndex((h: string) => h === 'BOLETO');
    const implantadaIndex = headers.findIndex((h: string) => h === 'IMPLANTADA');
    const desistiuIndex = headers.findIndex((h: string) => h === 'DESISTIU');
    const erroVendasIndex = headers.findIndex((h: string) => h === 'ERRO DE VENDAS');
    const declinadaIndex = headers.findIndex((h: string) => h === 'DECLINADA');
    
    let atividadeTotal = 0;
    let propostaTotal = 0;
    let pendAssinaturaTotal = 0;
    let analiseTotal = 0;
    let pendenciaTotal = 0;
    let entrevistaMedicaTotal = 0;
    let boletoTotal = 0;
    let implantadaTotal = 0;
    let desistiuTotal = 0;
    let erroVendasTotal = 0;
    let declinadaTotal = 0;
    
    rows.forEach((row: any[]) => {
      if (atividadeIndex >= 0 && row[atividadeIndex]) {
        atividadeTotal += Number(row[atividadeIndex]) || 0;
      }
      if (propostaIndex >= 0 && row[propostaIndex]) {
        propostaTotal += Number(row[propostaIndex]) || 0;
      }
      if (pendAssinaturaIndex >= 0 && row[pendAssinaturaIndex]) {
        pendAssinaturaTotal += Number(row[pendAssinaturaIndex]) || 0;
      }
      if (analiseIndex >= 0 && row[analiseIndex]) {
        analiseTotal += Number(row[analiseIndex]) || 0;
      }
      if (pendenciaIndex >= 0 && row[pendenciaIndex]) {
        pendenciaTotal += Number(row[pendenciaIndex]) || 0;
      }
      if (entrevistaMedicaIndex >= 0 && row[entrevistaMedicaIndex]) {
        entrevistaMedicaTotal += Number(row[entrevistaMedicaIndex]) || 0;
      }
      if (boletoIndex >= 0 && row[boletoIndex]) {
        boletoTotal += Number(row[boletoIndex]) || 0;
      }
      if (implantadaIndex >= 0 && row[implantadaIndex]) {
        implantadaTotal += Number(row[implantadaIndex]) || 0;
      }
      if (desistiuIndex >= 0 && row[desistiuIndex]) {
        desistiuTotal += Number(row[desistiuIndex]) || 0;
      }
      if (erroVendasIndex >= 0 && row[erroVendasIndex]) {
        erroVendasTotal += Number(row[erroVendasIndex]) || 0;
      }
      if (declinadaIndex >= 0 && row[declinadaIndex]) {
        declinadaTotal += Number(row[declinadaIndex]) || 0;
      }
    });
    
    return {
      atividade_diaria: atividadeTotal,
      nova_proposta: propostaTotal,
      pend_assinatura: pendAssinaturaTotal,
      em_analise: analiseTotal,
      pendencia: pendenciaTotal,
      entrevista_medica: entrevistaMedicaTotal,
      boleto: boletoTotal,
      implantada: implantadaTotal,
      desistiu: desistiuTotal,
      erro_vendas: erroVendasTotal,
      declinada: declinadaTotal
    };
  }, [filteredData]);

  // Funções para controlar a seleção de gráficos
  const handleChartToggle = (chartId: string) => {
    setSelectedCharts(prev => 
      prev.includes(chartId) 
        ? prev.filter(id => id !== chartId)
        : [...prev, chartId]
    );
  };

  const handleSelectAll = () => {
    setSelectedCharts([
      'atividade-diaria',
      'nova-proposta', 
      'pend-assinatura',
      'em-analise',
      'pendencia',
      'entrevista-medica',
      'boleto',
      'implantada',
      'desistiu',
      'erro-vendas',
      'declinada'
    ]);
  };

  const handleClearAll = () => {
    setSelectedCharts([]);
  };

  // Configuração dos gráficos para o filtro
  const chartConfigs = [
    { id: 'atividade-diaria', title: 'Atividade Diária' },
    { id: 'nova-proposta', title: 'Nova Proposta' },
    { id: 'pend-assinatura', title: 'Pendente Assinatura' },
    { id: 'em-analise', title: 'Em Análise' },
    { id: 'pendencia', title: 'Pendência' },
    { id: 'entrevista-medica', title: 'Entrevista Médica' },
    { id: 'boleto', title: 'Boleto' },
    { id: 'implantada', title: 'Implantada' },
    { id: 'desistiu', title: 'Desistiu' },
    { id: 'erro-vendas', title: 'Erro de Vendas' },
    { id: 'declinada', title: 'Declinada' }
  ];

  // Gera dados para gráficos
  const chartData = React.useMemo(() => {
    if (!filteredData.rows || filteredData.rows.length === 0) {
      return {
        atividadeDiaria: [],
        novaProposta: [],
        pendAssinatura: [],
        emAnalise: [],
        pendencia: [],
        entrevistaMedica: [],
        boleto: [],
        implantada: [],
        desistiu: [],
        erroVendas: [],
        declinada: []
      };
    }
    
    const headers = filteredData.headers;
    const rows = filteredData.rows;
    
    // Encontra índices das colunas
    const dataIndex = headers.findIndex((h: string) => h === 'DATA');
    const atividadeIndex = headers.findIndex((h: string) => h === 'ATIVIDADE DIÁRIA');
    const propostaIndex = headers.findIndex((h: string) => h === 'NOVA PROPOSTA');
    const pendAssinaturaIndex = headers.findIndex((h: string) => h === 'PEND ASSINATURA');
    const analiseIndex = headers.findIndex((h: string) => h === 'EM ANÁLISE');
    const pendenciaIndex = headers.findIndex((h: string) => h === 'PENDÊNCIA');
    const entrevistaMedicaIndex = headers.findIndex((h: string) => h === 'ENTREVISTA MÉDICA');
    const boletoIndex = headers.findIndex((h: string) => h === 'BOLETO');
    const implantadaIndex = headers.findIndex((h: string) => h === 'IMPLANTADA');
    const desistiuIndex = headers.findIndex((h: string) => h === 'DESISTIU');
    const erroVendasIndex = headers.findIndex((h: string) => h === 'ERRO DE VENDAS');
    const declinadaIndex = headers.findIndex((h: string) => h === 'DECLINADA');
    
    // Ordena por data
    const sortedRows = rows.sort((a: any[], b: any[]) => {
      const dateA = a[dataIndex]?.split('/') || [];
      const dateB = b[dataIndex]?.split('/') || [];
      
      if (dateA.length < 2 || dateB.length < 2) return 0;
      
      const dayA = parseInt(dateA[0]) || 0;
      const monthA = parseInt(dateA[1]) || 0;
      const dayB = parseInt(dateB[0]) || 0;
      const monthB = parseInt(dateB[1]) || 0;
      
      if (monthA !== monthB) return monthA - monthB;
      return dayA - dayB;
    });
    
    return {
      atividadeDiaria: sortedRows.map((row: any[]) => ({
        name: row[dataIndex] || '',
        value: Number(row[atividadeIndex]) || 0
      })),
      novaProposta: sortedRows.map((row: any[]) => ({
        name: row[dataIndex] || '',
        value: Number(row[propostaIndex]) || 0
      })),
      pendAssinatura: sortedRows.map((row: any[]) => ({
        name: row[dataIndex] || '',
        value: Number(row[pendAssinaturaIndex]) || 0
      })),
      emAnalise: sortedRows.map((row: any[]) => ({
        name: row[dataIndex] || '',
        value: Number(row[analiseIndex]) || 0
      })),
      pendencia: sortedRows.map((row: any[]) => ({
        name: row[dataIndex] || '',
        value: Number(row[pendenciaIndex]) || 0
      })),
      entrevistaMedica: sortedRows.map((row: any[]) => ({
        name: row[dataIndex] || '',
        value: Number(row[entrevistaMedicaIndex]) || 0
      })),
      boleto: sortedRows.map((row: any[]) => ({
        name: row[dataIndex] || '',
        value: Number(row[boletoIndex]) || 0
      })),
      implantada: sortedRows.map((row: any[]) => ({
        name: row[dataIndex] || '',
        value: Number(row[implantadaIndex]) || 0
      })),
      desistiu: sortedRows.map((row: any[]) => ({
        name: row[dataIndex] || '',
        value: Number(row[desistiuIndex]) || 0
      })),
      erroVendas: sortedRows.map((row: any[]) => ({
        name: row[dataIndex] || '',
        value: Number(row[erroVendasIndex]) || 0
      })),
      declinada: sortedRows.map((row: any[]) => ({
        name: row[dataIndex] || '',
        value: Number(row[declinadaIndex]) || 0
      }))
    };
  }, [filteredData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando dados da planilha ADM...</p>
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
            <div className="text-red-500 text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Erro ao carregar dados</h2>
            <p className="text-gray-600 mb-6">Não foi possível conectar com a planilha ADM</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ADM IMPLANTAÇÃO</h1>
          <p className="text-gray-600">Dashboard de acompanhamento de processos administrativos</p>
        </div>
        
        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Período
                </label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value as 'hoje' | 'ontem' | 'semana' | 'mes' | 'custom')}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="hoje">Hoje</option>
                  <option value="ontem">Ontem</option>
                  <option value="semana">Última Semana</option>
                  <option value="mes">Mês Atual</option>
                  <option value="custom">Mês Específico</option>
                </select>
              </div>
              
              {/* Filtro de Mês Específico */}
              {selectedPeriod === 'custom' && (
                <MonthFilter
                  selectedMonth={selectedMonth}
                  onMonthChange={setSelectedMonth}
                  selectedYear={selectedYear}
                  onYearChange={setSelectedYear}
                />
              )}
              
              {/* Filtro de Gráficos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gráficos
                </label>
                <ChartFilter
                  charts={chartConfigs}
                  selectedCharts={selectedCharts}
                  onChartToggle={handleChartToggle}
                  onSelectAll={handleSelectAll}
                  onClearAll={handleClearAll}
                />
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              Total de registros: <span className="font-semibold text-gray-900">{filteredData.rows?.length || 0}</span>
            </div>
          </div>
        </div>
        
        {/* Métricas */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          {chartConfigs
            .filter(chart => selectedCharts.includes(chart.id))
            .map((chart) => {
              const metricKey = chart.id.replace('-', '_') as keyof typeof metrics;
              const value = metrics[metricKey] || 0;
              
              const colors = {
                'atividade-diaria': 'text-blue-600',
                'nova-proposta': 'text-green-600',
                'pend-assinatura': 'text-orange-600',
                'em-analise': 'text-yellow-600',
                'pendencia': 'text-red-600',
                'entrevista-medica': 'text-cyan-600',
                'boleto': 'text-lime-600',
                'implantada': 'text-purple-600',
                'desistiu': 'text-gray-600',
                'erro-vendas': 'text-rose-600',
                'declinada': 'text-indigo-600',
              };
              
              return (
                <MetricCard
                  key={chart.id}
                  title={chart.title.toUpperCase()}
                  value={value}
                  format="number"
                />
              );
            })}
        </div>
        
        {/* Gráficos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chartConfigs
            .filter(chart => selectedCharts.includes(chart.id))
            .map((chart) => {
              // Mapeia o ID do gráfico para os dados correspondentes
              const chartDataMap: Record<string, any> = {
                'atividade-diaria': { data: chartData.atividadeDiaria, color: '#3b82f6' },
                'nova-proposta': { data: chartData.novaProposta, color: '#10b981' },
                'pend-assinatura': { data: chartData.pendAssinatura, color: '#f97316' },
                'em-analise': { data: chartData.emAnalise, color: '#f59e0b' },
                'pendencia': { data: chartData.pendencia, color: '#ef4444' },
                'entrevista-medica': { data: chartData.entrevistaMedica, color: '#06b6d4' },
                'boleto': { data: chartData.boleto, color: '#84cc16' },
                'implantada': { data: chartData.implantada, color: '#8b5cf6' },
                'desistiu': { data: chartData.desistiu, color: '#6b7280' },
                'erro-vendas': { data: chartData.erroVendas, color: '#dc2626' },
                'declinada': { data: chartData.declinada, color: '#7c3aed' }
              };
              
              const chartInfo = chartDataMap[chart.id];
              
              return (
                <div key={chart.id}>
                  {filteredData.rows?.length === 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-t-lg p-2 text-center">
                      <p className="text-xs text-yellow-700">📊 Nenhum registro encontrado para o período selecionado</p>
                    </div>
                  )}
                  <BarChart
                    data={chartInfo.data}
                    xAxisKey="name"
                    yAxisKey="value"
                    title={chart.title}
                    color={chartInfo.color}
                  />
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

// Componente principal que apenas decide qual dashboard renderizar
export const Dashboard: React.FC<DashboardProps> = ({ dashboardName }) => {
  const config = getDashboardConfig(dashboardName);
  
  console.log('🔍 Dashboard - Configuração:', { dashboardName, sheetName: config.sheetName, spreadsheetId: config.spreadsheetId });
  console.log('🎯 Renderizando dashboard:', dashboardName);

  // Renderiza dashboard específica baseada no nome
  if (dashboardName === 'adm') {
    console.log('📊 Renderizando dashboard ADM');
    return <AdmDashboardSimple config={config} />;
  }
  
  if (dashboardName === 'rh') {
    console.log('📊 Renderizando dashboard RH');
    return <RhDashboard />;
  }

  if (dashboardName === 'customSuccess') {
    console.log('📊 Renderizando dashboard Custom Success');
    return <CustomSuccessDashboard />;
  }

  if (dashboardName === 'suporte') {
    console.log('📊 Renderizando dashboard Suporte');
    return <SuporteDashboard />;
  }

  if (dashboardName === 'retencao') {
    console.log('📊 Renderizando dashboard Retenção');
    return <RetencaoDashboard />;
  }

  if (dashboardName === 'financeiro') {
    console.log('📊 Renderizando dashboard Financeiro');
    return <FinanceiroDashboard />;
  }
  
  if (dashboardName === 'vendas') {
    console.log('📊 Renderizando dashboard Vendas');
    return <VendasDashboard config={config} />;
  }

  // Dashboard padrão (vendas)
  console.log('📊 Renderizando dashboard padrão (Vendas)');
  return <VendasDashboard config={config} />;
};
