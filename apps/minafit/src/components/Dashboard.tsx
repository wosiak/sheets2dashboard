import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart } from './charts/BarChart';
import { MetricCard } from './MetricCard';
import { FilterBar } from './FilterBar';
import { getDashboardConfig } from '../config/dashboards';
import { GoogleSheetsService } from '../services/googleSheetsService';

interface DashboardProps {
  dashboardName: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ dashboardName }) => {
  const config = getDashboardConfig(dashboardName);
  const [selectedPeriod, setSelectedPeriod] = React.useState<'hoje' | 'ontem' | 'semana' | 'mes'>('ontem');
  // const [selectedVendor, setSelectedVendor] = React.useState<string>('');
  const [selectedVendors, setSelectedVendors] = React.useState<string[]>([]);
  const [selectedSources, setSelectedSources] = React.useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = React.useState<string>('');
  const [selectedYear, setSelectedYear] = React.useState<string>('');

  const apiKey = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY || '';
  const googleSheetsService = React.useMemo(() => {
  return new GoogleSheetsService(apiKey);
}, [apiKey]);


  const { data: rawData, isLoading, error } = useQuery({
    queryKey: ['dashboard-data', dashboardName, config.spreadsheetId, config.sheetName],
    queryFn: async () => {
      const sheetData = await googleSheetsService.getSheetData(config.spreadsheetId, config.sheetName);
      return googleSheetsService.parseSheetData(sheetData);
    },
    refetchInterval: config.refreshInterval * 1000,
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
    };

    filteredData.forEach(row => {
      total.reuniao_agendada += Number(row['Reunião Agendada']) || 0;
      total.reuniao_realizada += Number(row['Reunião Realizada']) || 0;
      total.quantidade_de_ligacao += Number(row['Quantidade de Ligação']) || 0;
      total.valor_ganho += Number(row['Ganho']) || 0;
    });

    return total;
  }, [filteredData]);

  const chartData = React.useMemo(() => {
    const vendorMetrics = googleSheetsService.getVendorMetrics(filteredData);

    const sort = (arr: any[]) => arr.sort((a, b) => b.value - a.value);

    return {
      reunioesAgendadas: sort(vendorMetrics.map(v => ({ name: v.responsavel, value: v.reuniao_agendada }))),
      reunioesRealizadas: sort(vendorMetrics.map(v => ({ name: v.responsavel, value: v.reuniao_realizada }))),
      ligacoes: sort(vendorMetrics.map(v => ({ name: v.responsavel, value: v.quantidade_de_ligacao }))),
      valorGanho: sort(vendorMetrics.map(v => ({ name: v.responsavel, value: v.valor_ganho }))),
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
    return <p className="p-8 text-center text-gray-600">Carregando dados da planilha...</p>;
  }

  if (error) {
    return <p className="p-8 text-center text-red-500">Erro ao carregar dados da planilha.</p>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Solyd Imob</h1>
          <p className="text-gray-600">Acompanhamento de performance</p>
        </div>

        {/* Filtros */}
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


        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard title="Reunião Agendada" value={metrics.reuniao_agendada} />
          <MetricCard title="Reunião Realizada" value={metrics.reuniao_realizada} />
          <MetricCard title="Ligações" value={metrics.quantidade_de_ligacao} />
          <MetricCard title="Ganho" value={metrics.valor_ganho} format="currency" />
        </div>


        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10">
          <BarChart data={chartData.ligacoes} xAxisKey="name" yAxisKey="value" title="Ligações" color="#f59e0b" />
          <BarChart data={chartData.reunioesAgendadas} xAxisKey="name" yAxisKey="value" title="Reuniões Agendadas" color="#3b82f6" />
          <BarChart data={chartData.reunioesRealizadas} xAxisKey="name" yAxisKey="value" title="Reuniões Realizadas" color="#10b981" />
          <BarChart data={chartData.valorGanho} xAxisKey="name" yAxisKey="value" title="Ganho" color="#ef4444" format="currency" />
        </div>
      </div>
    </div>
  );
};
