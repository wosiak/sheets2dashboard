export interface SalesData {
  id: string;
  vendedor: string;
  leads: number;
  vendas: number;
  valor: number;
  data: string;
  status: 'ativo' | 'inativo' | 'pendente';
}

export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface DashboardConfig {
  spreadsheetId: string;
  sheetName: string;
  refreshInterval: number; // em segundos
  charts: ChartConfig[];
}

export interface ChartConfig {
  id: string;
  title: string;
  type: 'bar' | 'line' | 'pie' | 'area';
  dataKey: string;
  xAxisKey: string;
  yAxisKey: string;
  filterBy?: string;
}

export interface FilterOption {
  label: string;
  value: string;
}

export interface DashboardState {
  currentSpreadsheet: string;
  filters: Record<string, string>;
  autoRefresh: boolean;
  refreshInterval: number;
}
