import type { DashboardConfig } from '../types';

// Configurações para diferentes dashboards
export const dashboardConfigs: Record<string, DashboardConfig> = {
  vendas: {
  spreadsheetId: '1OQkhC8Hme84i3VvnDuIiNERi4CUDByHPsBkNJ66RUMc',
  sheetName: 'Dashboard',
  refreshInterval: 60, // ou o que preferir
  charts: [
    {
      id: 'reuniao-agendada-por-responsavel',
      title: 'Reuniões Agendadas por Responsável',
      type: 'bar',
      dataKey: 'Reunião Agendada',
      xAxisKey: 'Responsável',
      yAxisKey: 'Reunião Agendada',
    },
    {
      id: 'reuniao-realizada-por-responsavel',
      title: 'Reuniões Realizadas por Responsável',
      type: 'bar',
      dataKey: 'Reunião Realizada',
      xAxisKey: 'Responsável',
      yAxisKey: 'Reunião Realizada',
    },
    {
      id: 'ligacoes-por-responsavel',
      title: 'Quantidade de Ligações por Responsável',
      type: 'bar',
      dataKey: 'Quantidade de Ligação',
      xAxisKey: 'Responsável',
      yAxisKey: 'Quantidade de Ligação',
    },
    {
      id: 'valor-ganho-por-responsavel',
      title: 'Valor Ganho por Responsável',
      type: 'bar',
      dataKey: 'Valor Ganho',
      xAxisKey: 'Responsável',
      yAxisKey: 'Valor Ganho',
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
