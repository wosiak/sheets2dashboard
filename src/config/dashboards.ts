import type { DashboardConfig } from '../types';

// Configurações para diferentes dashboards
export const dashboardConfigs: Record<string, DashboardConfig> = {
  vendas: {
    spreadsheetId: import.meta.env.VITE_SPREADSHEET_VENDAS_ID || '',
    sheetName: import.meta.env.VITE_SHEET_VENDAS_NAME || 'AGOSTO2025',
    refreshInterval: 30,
    charts: [
      {
        id: 'leads-por-vendedor',
        title: 'Leads por Vendedor',
        type: 'bar',
        dataKey: 'leads',
        xAxisKey: 'vendedor',
        yAxisKey: 'leads',
      },
      {
        id: 'vendas-por-vendedor',
        title: 'Vendas por Vendedor',
        type: 'bar',
        dataKey: 'contratos',
        xAxisKey: 'vendedor',
        yAxisKey: 'contratos',
      },
    ],
  },
  
  adm: {
    spreadsheetId: import.meta.env.VITE_SPREADSHEET_ADM_ID || '',
    sheetName: import.meta.env.VITE_SHEET_ADM_NAME || 'AGOSTO2025',
    refreshInterval: 60,
    charts: [
      {
        id: 'implantacoes-por-mes',
        title: 'Implantações por Mês',
        type: 'line',
        dataKey: 'implantacoes',
        xAxisKey: 'mes',
        yAxisKey: 'implantacoes',
      },
      {
        id: 'status-implantacoes',
        title: 'Status das Implantações',
        type: 'pie',
        dataKey: 'quantidade',
        xAxisKey: 'status',
        yAxisKey: 'quantidade',
      },
    ],
  },
  
  rh: {
    spreadsheetId: import.meta.env.VITE_SPREADSHEET_RH_ID || '',
    sheetName: import.meta.env.VITE_SHEET_RH_NAME || 'AGOSTO2025',
    refreshInterval: 120,
    charts: [
      {
        id: 'funcionarios-por-departamento',
        title: 'Funcionários por Departamento',
        type: 'pie',
        dataKey: 'quantidade',
        xAxisKey: 'departamento',
        yAxisKey: 'quantidade',
      },
      {
        id: 'produtividade-por-equipe',
        title: 'Produtividade por Equipe',
        type: 'bar',
        dataKey: 'produtividade',
        xAxisKey: 'equipe',
        yAxisKey: 'produtividade',
      },
    ],
  },
  
  custom: {
    spreadsheetId: import.meta.env.VITE_SPREADSHEET_CUSTOM_ID || '',
    sheetName: import.meta.env.VITE_SHEET_CUSTOM_NAME || 'Sheet1',
    refreshInterval: 45,
    charts: [
      {
        id: 'sucesso-por-canal',
        title: 'Sucesso por Canal',
        type: 'bar',
        dataKey: 'sucesso',
        xAxisKey: 'canal',
        yAxisKey: 'sucesso',
      },
      {
        id: 'conversao-por-periodo',
        title: 'Conversão por Período',
        type: 'line',
        dataKey: 'conversao',
        xAxisKey: 'periodo',
        yAxisKey: 'conversao',
      },
    ],
  },
  
  suporte: {
    spreadsheetId: import.meta.env.VITE_SPREADSHEET_SUPORTE_ID || '',
    sheetName: import.meta.env.VITE_SHEET_SUPORTE_NAME || 'Sheet1',
    refreshInterval: 60,
    charts: [
      {
        id: 'tickets-por-status',
        title: 'Tickets por Status',
        type: 'pie',
        dataKey: 'quantidade',
        xAxisKey: 'status',
        yAxisKey: 'quantidade',
      },
      {
        id: 'tempo-resposta-por-agente',
        title: 'Tempo de Resposta por Agente',
        type: 'bar',
        dataKey: 'tempo_medio',
        xAxisKey: 'agente',
        yAxisKey: 'tempo_medio',
      },
    ],
  },
  
  retencao: {
    spreadsheetId: import.meta.env.VITE_SPREADSHEET_RETENCAO_ID || '',
    sheetName: import.meta.env.VITE_SHEET_RETENCAO_NAME || 'Sheet1',
    refreshInterval: 90,
    charts: [
      {
        id: 'retencao-por-plano',
        title: 'Retenção por Plano',
        type: 'bar',
        dataKey: 'retencao',
        xAxisKey: 'plano',
        yAxisKey: 'retencao',
      },
      {
        id: 'churn-por-mes',
        title: 'Churn por Mês',
        type: 'line',
        dataKey: 'churn',
        xAxisKey: 'mes',
        yAxisKey: 'churn',
      },
    ],
  },
  
  financeiro: {
    spreadsheetId: import.meta.env.VITE_SPREADSHEET_FINANCEIRO_ID || '',
    sheetName: import.meta.env.VITE_SHEET_FINANCEIRO_NAME || 'Sheet1',
    refreshInterval: 60,
    charts: [
      {
        id: 'receita-mensal',
        title: 'Receita Mensal',
        type: 'line',
        dataKey: 'receita',
        xAxisKey: 'mes',
        yAxisKey: 'receita',
      },
      {
        id: 'custos-vs-receita',
        title: 'Custos vs Receita',
        type: 'bar',
        dataKey: 'valor',
        xAxisKey: 'categoria',
        yAxisKey: 'valor',
      },
    ],
  },
};

// Dashboard padrão
export const defaultDashboard = 'vendas';

// Função para obter configuração do dashboard
export const getDashboardConfig = (dashboardName: string): DashboardConfig => {
  return dashboardConfigs[dashboardName] || dashboardConfigs[defaultDashboard];
};

// Lista de dashboards disponíveis
export const availableDashboards = Object.keys(dashboardConfigs).map(key => ({
  id: key,
  name: key.charAt(0).toUpperCase() + key.slice(1),
  config: dashboardConfigs[key],
}));
