import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GoogleSheetsService } from '../services/googleSheetsService';
import { FilterBar } from './FilterBar';
import { MetricCard } from './MetricCard';

interface CustomSuccessData {
  DATA: string;
  'ATIVIDADE DIÁRIA': string;
  'OPORTUNIDADE': string;
  'INDICAÇÃO': string;
  'ENVIO DE BOLETO': string;
  'NOVO CLIENTE': string;
  '1 CONTATO': string;
  'RELACIONAMENTO': string;
  'SUPORTE': string;
  'INADIMPLENTE': string;
  'INSATISFEITO': string;
  'CANCELADA': string;
  'DESISTIU': string;
  'DUPLICADO': string;
  'RENOVAÇÃO': string;
}

const CustomSuccessDashboard = () => {
  console.log('🚀 CustomSuccessDashboard - Componente inicializado');
  
  const [data, setData] = useState<CustomSuccessData[]>([]);
  const [filteredData, setFilteredData] = useState<CustomSuccessData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'hoje' | 'ontem' | 'semana' | 'mes' | 'custom'>('ontem');
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const googleSheetsService = new GoogleSheetsService(import.meta.env.VITE_GOOGLE_SHEETS_API_KEY);

  useEffect(() => {
    console.log('🔄 CustomSuccessDashboard - useEffect inicial executado');
    fetchData();
  }, []);

  useEffect(() => {
    if (data.length > 0) {
      console.log('🔄 CustomSuccessDashboard - useEffect de filtro executado');
      filterData();
    }
  }, [data, selectedPeriod, selectedMonth, selectedYear]);

  const fetchData = async () => {
    try {
      console.log('📊 Buscando dados da planilha Custom Success...');
      setLoading(true);
      setError(null);

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/1zqBau-zlqhgFb8ifl9X1qcLc-DtJhNw5-NtVcOGk3qc/values/2025!A:L?key=${import.meta.env.VITE_GOOGLE_SHEETS_API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Dados da planilha Custom Success carregados com sucesso');

      if (!result.values || result.values.length === 0) {
        setData([]);
        setLoading(false);
        return;
      }

      const headers = result.values[0];
      const rows = result.values.slice(1);

      const parsedData: CustomSuccessData[] = rows.map((row: any[]) => {
        const obj: any = {};
        headers.forEach((header: string, index: number) => {
          obj[header] = row[index] || '';
        });
        return obj as CustomSuccessData;
      });

      console.log('📊 Dados Custom Success processados:', parsedData.length, 'registros');
      setData(parsedData);
    } catch (err) {
      console.error('❌ Erro ao buscar dados Custom Success:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    console.log('🔑 GoogleSheetsService inicializado com API Key:', import.meta.env.VITE_GOOGLE_SHEETS_API_KEY ? '✅ Configurada' : '❌ Não configurada');
    console.log('📅 Filtrando dados por período:', selectedPeriod);
    
    let filtered;
    if (selectedPeriod === 'custom' && selectedMonth && selectedYear) {
      // Filtro de mês específico
      const targetMonth = parseInt(selectedMonth) - 1; // Mês começa em 0
      const targetYear = parseInt(selectedYear);
      
      filtered = data.filter((row) => {
        if (!row.DATA) return false;
        
        const rowDateParts = row.DATA.split('/');
        if (rowDateParts.length < 2) return false;
        
        const day = parseInt(rowDateParts[0]);
        const month = parseInt(rowDateParts[1]) - 1;
        const year = rowDateParts[2] ? parseInt(rowDateParts[2]) : new Date().getFullYear();
        
        if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
        
        return month === targetMonth && year === targetYear;
      });
    } else {
      // Filtro padrão
      filtered = googleSheetsService.filterDataByPeriod(data, selectedPeriod);
    }
    
    console.log('✅ Dados filtrados por período:', { period: selectedPeriod, count: filtered.length });
    setFilteredData(filtered);
  };

  const calculateMetrics = () => {
    if (filteredData.length === 0) {
      return {
        atividadeDiaria: 0,
        oportunidade: 0,
        indicacao: 0,
        novoCliente: 0,
        primeiroContato: 0,
        relacionamento: 0,
        envioBoleto: 0,
        suporte: 0,
        inadimplente: 0,
        insatisfeito: 0,
        desistiu: 0,
        duplicado: 0,
        renovacao: 0,
        cancelada: 0,
      };
    }

    const atividadeDiaria = filteredData.reduce((sum, row) => {
      const value = parseInt(row['ATIVIDADE DIÁRIA'] || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    const oportunidade = filteredData.reduce((sum, row) => {
      const value = parseInt(row['OPORTUNIDADE'] || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    const indicacao = filteredData.reduce((sum, row) => {
      const value = parseInt(row['INDICAÇÃO'] || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    const novoCliente = filteredData.reduce((sum, row) => {
      const value = parseInt(row['NOVO CLIENTE'] || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    const primeiroContato = filteredData.reduce((sum, row) => {
      const value = parseInt(row['1 CONTATO'] || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    const relacionamento = filteredData.reduce((sum, row) => {
      const value = parseInt(row['RELACIONAMENTO'] || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    const envioBoleto = filteredData.reduce((sum, row) => {
      const value = parseInt(row['ENVIO DE BOLETO'] || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    const suporte = filteredData.reduce((sum, row) => {
      const value = parseInt(row['SUPORTE'] || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    const inadimplente = filteredData.reduce((sum, row) => {
      const value = parseInt(row['INADIMPLENTE'] || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    const insatisfeito = filteredData.reduce((sum, row) => {
      const value = parseInt(row['INSATISFEITO'] || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    const desistiu = filteredData.reduce((sum, row) => {
      const value = parseInt(row['DESISTIU'] || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    const duplicado = filteredData.reduce((sum, row) => {
      const value = parseInt(row['DUPLICADO'] || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    const renovacao = filteredData.reduce((sum, row) => {
      const value = parseInt(row['RENOVAÇÃO'] || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    const cancelada = filteredData.reduce((sum, row) => {
      const value = parseInt(row['CANCELADA'] || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    return {
      atividadeDiaria,
      oportunidade,
      indicacao,
      novoCliente,
      primeiroContato,
      relacionamento,
      envioBoleto,
      suporte,
      inadimplente,
      insatisfeito,
      desistiu,
      duplicado,
      renovacao,
      cancelada,
    };
  };

  const prepareChartData = () => {
    if (filteredData.length === 0) {
      return [
        { 
          data: 'Sem dados', 
          atividadeDiaria: 0, 
          oportunidade: 0,
          indicacao: 0,
          novoCliente: 0,
          primeiroContato: 0,
          relacionamento: 0,
          envioBoleto: 0, 
          suporte: 0, 
          inadimplente: 0,
          insatisfeito: 0,
          desistiu: 0,
          duplicado: 0,
          renovacao: 0,
          cancelada: 0 
        }
      ];
    }

    return filteredData.map(row => ({
      data: row.DATA,
      atividadeDiaria: parseInt(row['ATIVIDADE DIÁRIA'] || '0') || 0,
      oportunidade: parseInt(row['OPORTUNIDADE'] || '0') || 0,
      indicacao: parseInt(row['INDICAÇÃO'] || '0') || 0,
      novoCliente: parseInt(row['NOVO CLIENTE'] || '0') || 0,
      primeiroContato: parseInt(row['1 CONTATO'] || '0') || 0,
      relacionamento: parseInt(row['RELACIONAMENTO'] || '0') || 0,
      envioBoleto: parseInt(row['ENVIO DE BOLETO'] || '0') || 0,
      suporte: parseInt(row['SUPORTE'] || '0') || 0,
      inadimplente: parseInt(row['INADIMPLENTE'] || '0') || 0,
      insatisfeito: parseInt(row['INSATISFEITO'] || '0') || 0,
      desistiu: parseInt(row['DESISTIU'] || '0') || 0,
      duplicado: parseInt(row['DUPLICADO'] || '0') || 0,
      renovacao: parseInt(row['RENOVAÇÃO'] || '0') || 0,
      cancelada: parseInt(row['CANCELADA'] || '0') || 0,
    }));
  };

  const metrics = calculateMetrics();
  const chartData = prepareChartData();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando dados Custom Success...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="text-red-600 text-xl mb-4">❌ Erro ao carregar dados</div>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={fetchData}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Custom Success</h1>
          <p className="text-gray-600">Dashboard de Atividades e Suporte</p>
        </div>

        <FilterBar
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          selectedVendor={selectedVendor}
          onVendorChange={setSelectedVendor}
          vendors={[]}
          totalRecords={filteredData.length}
          showVendorFilter={false}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
        />

        {/* Métricas */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <MetricCard
            title="ATIVIDADE DIÁRIA"
            value={metrics.atividadeDiaria}
          />
          <MetricCard
            title="OPORTUNIDADE"
            value={metrics.oportunidade}
          />
          <MetricCard
            title="INDICAÇÃO"
            value={metrics.indicacao}
          />
          <MetricCard
            title="NOVO CLIENTE"
            value={metrics.novoCliente}
          />
          <MetricCard
            title="1º CONTATO"
            value={metrics.primeiroContato}
          />
          <MetricCard
            title="RELACIONAMENTO"
            value={metrics.relacionamento}
          />
          <MetricCard
            title="ENVIO DE BOLETO"
            value={metrics.envioBoleto}
          />
          <MetricCard
            title="SUPORTE"
            value={metrics.suporte}
          />
          <MetricCard
            title="INADIMPLENTE"
            value={metrics.inadimplente}
          />
          <MetricCard
            title="INSATISFEITO"
            value={metrics.insatisfeito}
          />
          <MetricCard
            title="DESISTIU"
            value={metrics.desistiu}
          />
          <MetricCard
            title="DUPLICADO"
            value={metrics.duplicado}
          />
          <MetricCard
            title="RENOVAÇÃO"
            value={metrics.renovacao}
          />
          <MetricCard
            title="CANCELADA"
            value={metrics.cancelada}
          />
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Atividade Diária */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Atividade Diária por Dia</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="data" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => Math.round(value).toString()}
                />
                <Tooltip 
                  formatter={(value: any) => [Math.round(value), 'Atividade Diária']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Bar dataKey="atividadeDiaria" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Oportunidade */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Oportunidade por Dia</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="data" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => Math.round(value).toString()}
                />
                <Tooltip 
                  formatter={(value: any) => [Math.round(value), 'Oportunidade']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Bar dataKey="oportunidade" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Indicação */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Indicação por Dia</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="data" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => Math.round(value).toString()}
                />
                <Tooltip 
                  formatter={(value: any) => [Math.round(value), 'Indicação']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Bar dataKey="indicacao" fill="#06B6D4" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Novo Cliente */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Novo Cliente por Dia</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="data" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => Math.round(value).toString()}
                />
                <Tooltip 
                  formatter={(value: any) => [Math.round(value), 'Novo Cliente']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Bar dataKey="novoCliente" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 1º Contato */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">1º Contato por Dia</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="data" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => Math.round(value).toString()}
                />
                <Tooltip 
                  formatter={(value: any) => [Math.round(value), '1º Contato']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Bar dataKey="primeiroContato" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Relacionamento */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Relacionamento por Dia</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="data" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => Math.round(value).toString()}
                />
                <Tooltip 
                  formatter={(value: any) => [Math.round(value), 'Relacionamento']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Bar dataKey="relacionamento" fill="#84CC16" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Envio de Boleto */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Envio de Boleto por Dia</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="data" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => Math.round(value).toString()}
                />
                <Tooltip 
                  formatter={(value: any) => [Math.round(value), 'Envio de Boleto']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Bar dataKey="envioBoleto" fill="#059669" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Suporte */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Suporte por Dia</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="data" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => Math.round(value).toString()}
                />
                <Tooltip 
                  formatter={(value: any) => [Math.round(value), 'Suporte']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Bar dataKey="suporte" fill="#F97316" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Inadimplente */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Inadimplente por Dia</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="data" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => Math.round(value).toString()}
                />
                <Tooltip 
                  formatter={(value: any) => [Math.round(value), 'Inadimplente']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Bar dataKey="inadimplente" fill="#DC2626" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Insatisfeito */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Insatisfeito por Dia</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="data" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => Math.round(value).toString()}
                />
                <Tooltip 
                  formatter={(value: any) => [Math.round(value), 'Insatisfeito']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Bar dataKey="insatisfeito" fill="#B91C1C" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Desistiu */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Desistiu por Dia</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="data" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => Math.round(value).toString()}
                />
                <Tooltip 
                  formatter={(value: any) => [Math.round(value), 'Desistiu']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Bar dataKey="desistiu" fill="#6B7280" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Duplicado */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Duplicado por Dia</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="data" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => Math.round(value).toString()}
                />
                <Tooltip 
                  formatter={(value: any) => [Math.round(value), 'Duplicado']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Bar dataKey="duplicado" fill="#7C3AED" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Renovação */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Renovação por Dia</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="data" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => Math.round(value).toString()}
                />
                <Tooltip 
                  formatter={(value: any) => [Math.round(value), 'Renovação']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Bar dataKey="renovacao" fill="#059669" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Cancelada */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cancelada por Dia</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="data" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => Math.round(value).toString()}
                />
                <Tooltip 
                  formatter={(value: any) => [Math.round(value), 'Cancelada']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Bar dataKey="cancelada" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomSuccessDashboard;
