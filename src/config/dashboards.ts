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
    sheetName: '2025',
    refreshInterval: 60,
    charts: [
      {
        id: 'atividade-diaria',
        title: 'Atividade Diária',
        type: 'bar',
        dataKey: 'atividade_diaria',
        xAxisKey: 'data',
        yAxisKey: 'atividade_diaria',
      },
      {
        id: 'nova-proposta',
        title: 'Nova Proposta',
        type: 'bar',
        dataKey: 'nova_proposta',
        xAxisKey: 'data',
        yAxisKey: 'nova_proposta',
      },
      {
        id: 'em-analise',
        title: 'Em Análise',
        type: 'bar',
        dataKey: 'em_analise',
        xAxisKey: 'data',
        yAxisKey: 'em_analise',
      },
      {
        id: 'implantada',
        title: 'Implantada',
        type: 'bar',
        dataKey: 'implantada',
        xAxisKey: 'data',
        yAxisKey: 'implantada',
      },
    ],
  },
  
  rh: {
    spreadsheetId: '1lrpFiG9QCS_lWuy_RE8kGZ9SowbSQjYdRYR086C_fxM',
    sheetName: '2025',
    refreshInterval: 30,
    charts: [
      {
        id: 'atendimento-por-dia',
        title: 'Atendimento por Dia',
        type: 'bar',
        dataKey: 'atendimento',
        xAxisKey: 'data',
        yAxisKey: 'atendimento',
      },
      {
        id: 'entrevista-por-dia',
        title: 'Entrevista por Dia',
        type: 'bar',
        dataKey: 'entrevista',
        xAxisKey: 'data',
        yAxisKey: 'entrevista',
      },
      {
        id: 'aprovado-por-dia',
        title: 'Aprovado por Dia',
        type: 'bar',
        dataKey: 'aprovado',
        xAxisKey: 'data',
        yAxisKey: 'aprovado',
      },
      {
        id: 'reprovado-por-dia',
        title: 'Reprovado por Dia',
        type: 'bar',
        dataKey: 'reprovado',
        xAxisKey: 'data',
        yAxisKey: 'reprovado',
      },
    ],
  },
  customSuccess: {
    spreadsheetId: '1zqBau-zlqhgFb8ifl9X1qcLc-DtJhNw5-NtVcOGk3qc',
    sheetName: '2025',
    refreshInterval: 30,
    charts: [
      { id: 'atividade-diaria-por-dia', title: 'Atividade Diária por Dia', type: 'bar', dataKey: 'atividadeDiaria', xAxisKey: 'data', yAxisKey: 'atividadeDiaria' },
      { id: 'envio-boleto-por-dia', title: 'Envio de Boleto por Dia', type: 'bar', dataKey: 'envioBoleto', xAxisKey: 'data', yAxisKey: 'envioBoleto' },
      { id: 'suporte-por-dia', title: 'Suporte por Dia', type: 'bar', dataKey: 'suporte', xAxisKey: 'data', yAxisKey: 'suporte' },
      { id: 'cancelada-por-dia', title: 'Cancelada por Dia', type: 'bar', dataKey: 'cancelada', xAxisKey: 'data', yAxisKey: 'cancelada' },
    ],
  },
  
  suporte: {
    spreadsheetId: '19TdHUfkCIXzm4niGvC3JT95JRmUPz9-0sF7iCmBpGZ8',
    sheetName: '2025',
    refreshInterval: 30,
    charts: [
      { id: 'atividade-diaria-por-dia', title: 'Atividade Diária por Dia', type: 'bar', dataKey: 'atividadeDiaria', xAxisKey: 'data', yAxisKey: 'atividadeDiaria' },
      { id: 'nova-solicitacao-por-dia', title: 'Nova Solicitação por Dia', type: 'bar', dataKey: 'novaSolicitacao', xAxisKey: 'data', yAxisKey: 'novaSolicitacao' },
      { id: 'normal-por-dia', title: 'Normal por Dia', type: 'bar', dataKey: 'normal', xAxisKey: 'data', yAxisKey: 'normal' },
      { id: 'concluido-por-dia', title: 'Concluído por Dia', type: 'bar', dataKey: 'concluido', xAxisKey: 'data', yAxisKey: 'concluido' },
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
  name: key === 'customSuccess' ? 'Custom Success' : key.charAt(0).toUpperCase() + key.slice(1),
  config: dashboardConfigs[key],
}));
