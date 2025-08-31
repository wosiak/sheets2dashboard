import type { DashboardConfig } from '../types';

// Configurações para diferentes dashboards
export const dashboardConfigs: Record<string, DashboardConfig> = {
  vendas: {
    spreadsheetId: '1IwtjjLQRiyqfCADbnCX-jditUecvtlpHT1svy0JN3ls',
    sheetName: '2025',
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
      {
        id: 'faturamento-por-vendedor',
        title: 'Faturamento por Vendedor',
        type: 'bar',
        dataKey: 'faturamento',
        xAxisKey: 'vendedor',
        yAxisKey: 'faturamento',
      },
    ],
  },
  
  adm: {
    spreadsheetId: '19eH7lt-HX3XXD3bvh6_oBHrIoS9UME2UR7r74FAJ-oU',
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
        id: 'pend-assinatura',
        title: 'Pendente Assinatura',
        type: 'bar',
        dataKey: 'pend_assinatura',
        xAxisKey: 'data',
        yAxisKey: 'pend_assinatura',
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
        id: 'pendencia',
        title: 'Pendência',
        type: 'bar',
        dataKey: 'pendencia',
        xAxisKey: 'data',
        yAxisKey: 'pendencia',
      },
      {
        id: 'entrevista-medica',
        title: 'Entrevista Médica',
        type: 'bar',
        dataKey: 'entrevista_medica',
        xAxisKey: 'data',
        yAxisKey: 'entrevista_medica',
      },
      {
        id: 'boleto',
        title: 'Boleto',
        type: 'bar',
        dataKey: 'boleto',
        xAxisKey: 'data',
        yAxisKey: 'boleto',
      },
      {
        id: 'implantada',
        title: 'Implantada',
        type: 'bar',
        dataKey: 'implantada',
        xAxisKey: 'data',
        yAxisKey: 'implantada',
      },
      {
        id: 'desistiu',
        title: 'Desistiu',
        type: 'bar',
        dataKey: 'desistiu',
        xAxisKey: 'data',
        yAxisKey: 'desistiu',
      },
      {
        id: 'erro-vendas',
        title: 'Erro de Vendas',
        type: 'bar',
        dataKey: 'erro_vendas',
        xAxisKey: 'data',
        yAxisKey: 'erro_vendas',
      },
      {
        id: 'declinada',
        title: 'Declinada',
        type: 'bar',
        dataKey: 'declinada',
        xAxisKey: 'data',
        yAxisKey: 'declinada',
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
    spreadsheetId: '1GUkqFhUTVLFVNiYIp3aBnAKerjZF26CkIwKwSlfs4Xw',
    sheetName: '2025',
    refreshInterval: 30,
    charts: [
      { id: 'novo-contato-por-dia', title: 'Novo Contato por Dia', type: 'bar', dataKey: 'novoContato', xAxisKey: 'data', yAxisKey: 'novoContato' },
      { id: 'fechamento-por-dia', title: 'Fechamento por Dia', type: 'bar', dataKey: 'fechamento', xAxisKey: 'data', yAxisKey: 'fechamento' },
      { id: 'sem-interesse-por-dia', title: 'Sem Interesse por Dia', type: 'bar', dataKey: 'semInteresse', xAxisKey: 'data', yAxisKey: 'semInteresse' },
      { id: 'reativado-por-dia', title: 'Reativado por Dia', type: 'bar', dataKey: 'reativado', xAxisKey: 'data', yAxisKey: 'reativado' },
    ],
  },
  
  financeiro: {
    spreadsheetId: '1yNtfhoSM_RlrDfH8OCCwkzwvsz7ZBmPiPS1RWvWa8eE',
    sheetName: '2025',
    refreshInterval: 30,
    charts: [
      { id: 'nova-proposta-por-dia', title: 'Nova Proposta por Dia', type: 'bar', dataKey: 'novaProposta', xAxisKey: 'data', yAxisKey: 'novaProposta' },
      { id: 'status-proposta-por-dia', title: 'Status Proposta por Dia', type: 'bar', dataKey: 'statusProposta', xAxisKey: 'data', yAxisKey: 'statusProposta' },
      { id: 'nota-fiscal-por-dia', title: 'Nota Fiscal por Dia', type: 'bar', dataKey: 'notaFiscal', xAxisKey: 'data', yAxisKey: 'notaFiscal' },
      { id: 'estorno-por-dia', title: 'Estorno por Dia', type: 'bar', dataKey: 'estorno', xAxisKey: 'data', yAxisKey: 'estorno' },
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
