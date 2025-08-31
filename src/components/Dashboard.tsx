import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart } from './charts/BarChart';
import { MetricCard } from './MetricCard';
import { FilterBar } from './FilterBar';
import { getDashboardConfig } from '../config/dashboards';
import { GoogleSheetsService } from '../services/googleSheetsService';
import { getMockDataForDashboard } from '../data/mockData';
import RhDashboard from './RhDashboard';

interface DashboardProps {
  dashboardName: string;
}

// Componente separado para dashboard de vendas
const VendasDashboard: React.FC<{ config: any }> = ({ config }) => {
  const [selectedPeriod, setSelectedPeriod] = React.useState<'hoje' | 'ontem' | 'semana' | 'mes'>('ontem');
  const [selectedVendor, setSelectedVendor] = React.useState<string>('');

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
    </div>
  );
};

// Componente separado para dashboard de ADM
const AdmDashboardSimple: React.FC<{ config: any }> = ({ config }) => {
  const [selectedPeriod, setSelectedPeriod] = React.useState<'hoje' | 'ontem' | 'semana' | 'mes'>('ontem');
  
  const hasApiKey = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY && import.meta.env.VITE_GOOGLE_SHEETS_API_KEY !== 'your_google_sheets_api_key_here';
  
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
        default:
          return true;
      }
    });
    
    console.log('📅 Dados ADM filtrados por período:', { period: selectedPeriod, count: filteredRows.length });
    return { headers, rows: filteredRows };
  }, [rawData, selectedPeriod]);

  // Calcula métricas
  const metrics = React.useMemo(() => {
    if (!filteredData.rows || filteredData.rows.length === 0) {
      return {
        atividade_diaria: 0,
        nova_proposta: 0,
        em_analise: 0,
        implantada: 0
      };
    }
    
    const headers = filteredData.headers;
    const rows = filteredData.rows;
    
    // Encontra índices das colunas
    const dataIndex = headers.findIndex((h: string) => h === 'DATA');
    const atividadeIndex = headers.findIndex((h: string) => h === 'ATIVIDADE DIÁRIA');
    const propostaIndex = headers.findIndex((h: string) => h === 'NOVA PROPOSTA');
    const analiseIndex = headers.findIndex((h: string) => h === 'EM ANÁLISE');
    const implantadaIndex = headers.findIndex((h: string) => h === 'IMPLANTADA');
    
    let atividadeTotal = 0;
    let propostaTotal = 0;
    let analiseTotal = 0;
    let implantadaTotal = 0;
    
    rows.forEach((row: any[]) => {
      if (atividadeIndex >= 0 && row[atividadeIndex]) {
        atividadeTotal += Number(row[atividadeIndex]) || 0;
      }
      if (propostaIndex >= 0 && row[propostaIndex]) {
        propostaTotal += Number(row[propostaIndex]) || 0;
      }
      if (analiseIndex >= 0 && row[analiseIndex]) {
        analiseTotal += Number(row[analiseIndex]) || 0;
      }
      if (implantadaIndex >= 0 && row[implantadaIndex]) {
        implantadaTotal += Number(row[implantadaIndex]) || 0;
      }
    });
    
    return {
      atividade_diaria: atividadeTotal,
      nova_proposta: propostaTotal,
      em_analise: analiseTotal,
      implantada: implantadaTotal
    };
  }, [filteredData]);

  // Gera dados para gráficos
  const chartData = React.useMemo(() => {
    if (!filteredData.rows || filteredData.rows.length === 0) {
      return {
        atividadeDiaria: [],
        novaProposta: [],
        emAnalise: [],
        implantada: []
      };
    }
    
    const headers = filteredData.headers;
    const rows = filteredData.rows;
    
    // Encontra índices das colunas
    const dataIndex = headers.findIndex((h: string) => h === 'DATA');
    const atividadeIndex = headers.findIndex((h: string) => h === 'ATIVIDADE DIÁRIA');
    const propostaIndex = headers.findIndex((h: string) => h === 'NOVA PROPOSTA');
    const analiseIndex = headers.findIndex((h: string) => h === 'EM ANÁLISE');
    const implantadaIndex = headers.findIndex((h: string) => h === 'IMPLANTADA');
    
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
      emAnalise: sortedRows.map((row: any[]) => ({
        name: row[dataIndex] || '',
        value: Number(row[analiseIndex]) || 0
      })),
      implantada: sortedRows.map((row: any[]) => ({
        name: row[dataIndex] || '',
        value: Number(row[implantadaIndex]) || 0
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
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Período
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as 'hoje' | 'ontem' | 'semana' | 'mes')}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="hoje">Hoje</option>
                <option value="ontem">Ontem</option>
                <option value="semana">Última Semana</option>
                <option value="mes">Mês</option>
              </select>
            </div>
            <div className="text-sm text-gray-600">
              Total de registros: <span className="font-semibold text-gray-900">{filteredData.rows?.length || 0}</span>
            </div>
          </div>
        </div>
        
        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="ATIVIDADE DIÁRIA"
            value={metrics.atividade_diaria}
            format="number"
          />
          <MetricCard
            title="NOVA PROPOSTA"
            value={metrics.nova_proposta}
            format="number"
          />
          <MetricCard
            title="EM ANÁLISE"
            value={metrics.em_analise}
            format="number"
          />
          <MetricCard
            title="IMPLANTADA"
            value={metrics.implantada}
            format="number"
          />
        </div>
        
        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Atividade Diária */}
          <div>
            {filteredData.rows?.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-t-lg p-2 text-center">
                <p className="text-xs text-yellow-700">📊 Nenhum registro encontrado para o período selecionado</p>
              </div>
            )}
            <BarChart
              data={chartData.atividadeDiaria}
              xAxisKey="name"
              yAxisKey="value"
              title="Atividade Diária"
              color="#3b82f6"
            />
          </div>
          
          {/* Nova Proposta */}
          <div>
            {filteredData.rows?.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-t-lg p-2 text-center">
                <p className="text-xs text-yellow-700">📈 Nenhum registro encontrado para o período selecionado</p>
              </div>
            )}
            <BarChart
              data={chartData.novaProposta}
              xAxisKey="name"
              yAxisKey="value"
              title="Nova Proposta"
              color="#10b981"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Em Análise */}
          <div>
            {filteredData.rows?.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-t-lg p-2 text-center">
                <p className="text-xs text-yellow-700">🔍 Nenhum registro encontrado para o período selecionado</p>
              </div>
            )}
            <BarChart
              data={chartData.emAnalise}
              xAxisKey="name"
              yAxisKey="value"
              title="Em Análise"
              color="#f59e0b"
            />
          </div>
          
          {/* Implantada */}
          <div>
            {filteredData.rows?.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-t-lg p-2 text-center">
                <p className="text-xs text-yellow-700">✅ Nenhum registro encontrado para o período selecionado</p>
              </div>
            )}
            <BarChart
              data={chartData.implantada}
              xAxisKey="name"
              yAxisKey="value"
              title="Implantada"
              color="#8b5cf6"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente principal que apenas decide qual dashboard renderizar
export const Dashboard: React.FC<DashboardProps> = ({ dashboardName }) => {
  const config = getDashboardConfig(dashboardName);
  
  console.log('🔍 Dashboard - Configuração:', { dashboardName, sheetName: config.sheetName, spreadsheetId: config.spreadsheetId });

  // Renderiza dashboard específica baseada no nome
  if (dashboardName === 'adm') {
    return <AdmDashboardSimple config={config} />;
  }
  
  if (dashboardName === 'rh') {
    return <RhDashboard />;
  }
  
  if (dashboardName === 'vendas') {
    return <VendasDashboard config={config} />;
  }

  // Dashboard padrão (vendas)
  return <VendasDashboard config={config} />;
};
