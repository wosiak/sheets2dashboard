import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart } from './charts/BarChart';
import { MetricCard } from './MetricCard';
import { FilterBar } from './FilterBar';
import { getDashboardConfig } from '../config/dashboards';
import { GoogleSheetsService } from '../services/googleSheetsService';

const OPERADORES_EXCLUIDOS = ['MADUREIRA', 'MARI DANTAS', 'EDUARDO BRAGAGNOLO', 'ADRIANA FERREIRA'];

const PERIOD_LABELS: Record<string, string> = {
  hoje: 'Hoje',
  ontem: 'Ontem',
  semana: 'Última Semana',
  mes: 'Mês Atual',
  custom: 'Mês Específico',
};

interface DashboardProps {
  dashboardName: string;
  isTVMode?: boolean;
  selectedPeriodLabel?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ dashboardName, isTVMode = false }) => {
  const config = getDashboardConfig(dashboardName);
  const [selectedPeriod, setSelectedPeriod] = React.useState<'hoje' | 'ontem' | 'semana' | 'mes'>('ontem');
  const [selectedVendors, setSelectedVendors] = React.useState<string[]>([]);
  const [selectedSources, setSelectedSources] = React.useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = React.useState<string>('');
  const [selectedYear, setSelectedYear] = React.useState<string>('');

  const defaultApiKey = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY || '';
  const googleSheetsService = React.useMemo(() => {
    return new GoogleSheetsService(defaultApiKey);
  }, [defaultApiKey]);

  const { data: rawData, isLoading, error } = useQuery({
    queryKey: ['dashboard-data', dashboardName, config.spreadsheetId, config.sheetName],
    queryFn: async () => {
      let targetApiKey = defaultApiKey;
      let targetSpreadsheetId = config.spreadsheetId;
      let targetSheetName = config.sheetName;

      try {
        const configResp = await fetch('/api/sales-config');
        if (configResp.ok) {
          const salesConfig = await configResp.json();
          if (salesConfig.apiKey) targetApiKey = salesConfig.apiKey;
          if (salesConfig.spreadsheetId) targetSpreadsheetId = salesConfig.spreadsheetId;
          if (salesConfig.sheetName) targetSheetName = salesConfig.sheetName;
        }
      } catch (err) {
        console.warn('⚠️ Falha ao buscar configuração dinâmica do backend, usando fallbacks:', err);
      }

      const dynamicService = new GoogleSheetsService(targetApiKey);
      const sheetData = await dynamicService.getSheetData(targetSpreadsheetId, targetSheetName);
      const parsed = dynamicService.parseSheetData(sheetData);
      
      return parsed.filter(row => {
        const nome = (row['Responsável'] || row['Responsavel'] || '').trim().replace(/\s+/g, ' ').toUpperCase();
        return !OPERADORES_EXCLUIDOS.some(excluido => nome.includes(excluido));
      });
    },
    refetchInterval: config.refreshInterval * 1000,
    staleTime: 0,
  });

  const filteredData = React.useMemo(() => {
  if (!rawData) return [];

  const today = new Date();
  const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0');
  const currentYear = today.getFullYear().toString();

  const periodToUse = selectedPeriod === 'mes' ? 'custom' : selectedPeriod;
  const monthToUse = selectedPeriod === 'mes' ? currentMonth : selectedMonth;
  const yearToUse = selectedPeriod === 'mes' ? currentYear : selectedYear;

  const periodFiltered = googleSheetsService.filterDataByPeriod(
    rawData,
    periodToUse,
    monthToUse,
    yearToUse
  );

  return periodFiltered.filter(row => {
    const vendorMatch =
      selectedVendors.length === 0 ||
      selectedVendors.includes(row.Responsável);

    const sourceMatch =
  selectedSources.length > 0
    ? selectedSources.includes(row.Fonte ?? '')
    : true;


    return vendorMatch && sourceMatch;
  });
}, [
  rawData,
  selectedPeriod,
  selectedMonth,
  selectedYear,
  selectedVendors,
  selectedSources,
  googleSheetsService
]);


  const metrics = React.useMemo(() => {
    const total = {
      reuniao_agendada: 0,
      reuniao_realizada: 0,
      quantidade_de_ligacao: 0,
      valor_ganho: 0,
      ligacoes_inbound: 0,
      ligacoes_outbound: 0,
    };

    filteredData.forEach(row => {
      total.reuniao_agendada += Number(row['Reunião Agendada']) || 0;
      total.reuniao_realizada += Number(row['Reunião Realizada']) || 0;
      total.quantidade_de_ligacao += Number(row['Quantidade de Ligação']) || 0;
      total.valor_ganho += Number(row['Ganho']) || 0;
      total.ligacoes_inbound += Number(row['Ligações Inbound'] || 0);
      total.ligacoes_outbound += Number(row['Ligações Outbound'] || 0);
    });

    return total;
  }, [filteredData]);

  const chartData = React.useMemo(() => {
    const vendorMetrics = googleSheetsService.getVendorMetrics(filteredData);

    const sort = (arr: any[]) => arr.sort((a, b) => b.value - a.value);

    const inboundMap: Record<string, number> = {};
    const outboundMap: Record<string, number> = {};

    filteredData.forEach(row => {
      const resp = row['Responsável'];
      if (!resp) return;
      inboundMap[resp] = (inboundMap[resp] || 0) + Number(row['Ligações Inbound'] || 0);
      outboundMap[resp] = (outboundMap[resp] || 0) + Number(row['Ligações Outbound'] || 0);
    });

    return {
      reunioesAgendadas: sort(vendorMetrics.map(v => ({ name: v.responsavel, value: v.reuniao_agendada }))),
      reunioesRealizadas: sort(vendorMetrics.map(v => ({ name: v.responsavel, value: v.reuniao_realizada }))),
      ligacoes: sort(vendorMetrics.map(v => ({ name: v.responsavel, value: v.quantidade_de_ligacao }))),
      valorGanho: sort(vendorMetrics.map(v => ({ name: v.responsavel, value: v.valor_ganho }))),
      inbound: sort(Object.entries(inboundMap).map(([name, value]) => ({ name, value }))),
      outbound: sort(Object.entries(outboundMap).map(([name, value]) => ({ name, value }))),
    };
  }, [filteredData]);

  const vendors = React.useMemo(() => {
    return Array.from(new Set(rawData?.map(r => r.Responsável).filter(Boolean) || [])).sort();
  }, [rawData]);

  const sources = React.useMemo(() => {
    return Array.from(new Set(rawData?.map(r => r.Fonte).filter(Boolean) || [])).sort();
  }, [rawData]);

  React.useEffect(() => {
  if (vendors.length > 0 && selectedVendors.length === 0) {
    setSelectedVendors(vendors);
  }
}, [vendors, selectedVendors]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p style={{ color: 'var(--text-secondary)' }}>Carregando dados da planilha...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <p className="p-8 text-center text-red-400">Erro ao carregar dados da planilha.</p>;
  }

  return (
    <div className="min-h-screen p-0">
      <div className="max-w-[1600px] mx-auto">

        {/* Header interno + badge de período no TV mode */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Dashboard Solyd Imob
            </h1>
            <p style={{ color: 'var(--text-secondary)' }} className="text-sm mt-1">
              Acompanhamento de performance
            </p>
          </div>
          {isTVMode && (
            <span
              className="tv-period-badge hidden px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', color: 'var(--text-secondary)' }}
            >
              Período: {PERIOD_LABELS[selectedPeriod] || selectedPeriod}
            </span>
          )}
        </div>

        {/* Filtros */}
        <div className="mb-6">
          <FilterBar
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
            selectedVendors={selectedVendors}
            onVendorsChange={setSelectedVendors}
            vendors={vendors}
            selectedSources={selectedSources}
            onSourcesChange={setSelectedSources}
            sources={sources}
            totalRecords={filteredData.length}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
          />
        </div>

        {/* Métricas — linha principal */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-3">
          <MetricCard title="Reunião Agendada" value={metrics.reuniao_agendada} icon="calendar" animationDelay={0.05} />
          <MetricCard title="Reunião Realizada" value={metrics.reuniao_realizada} icon="check" animationDelay={0.10} />
          <MetricCard title="Ligações" value={metrics.quantidade_de_ligacao} icon="phone" animationDelay={0.15} />
          <MetricCard title="Ligações Inbound" value={metrics.ligacoes_inbound} icon="phone-in" animationDelay={0.20} />
          <MetricCard title="Ligações Outbound" value={metrics.ligacoes_outbound} icon="phone-out" animationDelay={0.25} />
        </div>

        {/* Métricas — linha de destaque (Ganho) */}
        <div className="mb-8">
          <MetricCard title="Ganho" value={metrics.valor_ganho} format="currency" icon="money" animationDelay={0.30} variant="wide" />
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BarChart data={chartData.ligacoes} xAxisKey="name" yAxisKey="value" title="Ligações" color="#f59e0b" />
          <BarChart data={chartData.reunioesAgendadas} xAxisKey="name" yAxisKey="value" title="Reuniões Agendadas" color="#3b82f6" />
          <BarChart data={chartData.reunioesRealizadas} xAxisKey="name" yAxisKey="value" title="Reuniões Realizadas" color="#10b981" />
          <BarChart data={chartData.valorGanho} xAxisKey="name" yAxisKey="value" title="Ganho" color="#ef4444" format="currency" />
          <BarChart data={chartData.inbound} xAxisKey="name" yAxisKey="value" title="Ligações Inbound" color="#8b5cf6" />
          <BarChart data={chartData.outbound} xAxisKey="name" yAxisKey="value" title="Ligações Outbound" color="#06b6d4" />
        </div>
      </div>
    </div>
  );
};
