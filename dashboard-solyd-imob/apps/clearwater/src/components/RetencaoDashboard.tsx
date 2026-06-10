import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GoogleSheetsService } from '../services/googleSheetsService';
import { FilterBar } from './FilterBar';
import { MetricCard } from './MetricCard';

interface RetencaoData {
  DATA: string;
  'NOVO CONTATO': string;
  'OPORTUNIDADE': string;
  'COTAÇÃO': string;
  'VITALÍCIO': string;
  'SEGURO VIDA': string;
  'DESCARTADO': string;
  'CUSTOM SUCCESS': string;
  'NOVA PROPOSTA': string;
  'EM ANÁLISE': string;
  'IMPLANTADA': string;
}

const RetencaoDashboard = () => {
  console.log('🚀 RetencaoDashboard - Componente inicializado');
  
  const [data, setData] = useState<RetencaoData[]>([]);
  const [filteredData, setFilteredData] = useState<RetencaoData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'hoje' | 'ontem' | 'semana' | 'mes' | 'custom'>('ontem');
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const googleSheetsService = new GoogleSheetsService(import.meta.env.VITE_GOOGLE_SHEETS_API_KEY);

  useEffect(() => {
    console.log('🔄 RetencaoDashboard - useEffect inicial executado');
    fetchData();
  }, []);

  useEffect(() => {
    if (data.length > 0) {
      console.log('🔄 RetencaoDashboard - useEffect de filtro executado');
      filterData();
    }
  }, [data, selectedPeriod, selectedMonth, selectedYear]);

  const fetchData = async () => {
    try {
      console.log('📊 Buscando dados da planilha Retenção...');
      setLoading(true);
      setError(null);

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/1GUkqFhUTVLFVNiYIp3aBnAKerjZF26CkIwKwSlfs4Xw/values/2025!A:K?key=${import.meta.env.VITE_GOOGLE_SHEETS_API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Dados da planilha Retenção carregados com sucesso');

      if (!result.values || result.values.length === 0) {
        setData([]);
        setLoading(false);
        return;
      }

      const headers = result.values[0];
      const rows = result.values.slice(1);

      const parsedData: RetencaoData[] = rows.map((row: any[]) => {
        const obj: any = {};
        headers.forEach((header: string, index: number) => {
          obj[header] = row[index] || '';
        });
        return obj as RetencaoData;
      });

      console.log('📊 Dados Retenção processados:', parsedData.length, 'registros');
      setData(parsedData);
    } catch (err) {
      console.error('❌ Erro ao buscar dados Retenção:', err);
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
        novoContato: 0,
        oportunidade: 0,
        cotacao: 0,
        vitalicio: 0,
        seguroVida: 0,
        descartado: 0,
        customSuccess: 0,
        novaProposta: 0,
        emAnalise: 0,
        implantada: 0,
      };
    }

    const novoContato = filteredData.reduce((sum, row) => {
      const value = parseInt(row['NOVO CONTATO'] || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    const oportunidade = filteredData.reduce((sum, row) => {
      const value = parseInt(row['OPORTUNIDADE'] || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    const cotacao = filteredData.reduce((sum, row) => {
      const value = parseInt(row['COTAÇÃO'] || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    const vitalicio = filteredData.reduce((sum, row) => {
      const value = parseInt(row['VITALÍCIO'] || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    const seguroVida = filteredData.reduce((sum, row) => {
      const value = parseInt(row['SEGURO VIDA'] || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    const descartado = filteredData.reduce((sum, row) => {
      const value = parseInt(row['DESCARTADO'] || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    const customSuccess = filteredData.reduce((sum, row) => {
      const value = parseInt(row['CUSTOM SUCCESS'] || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    const novaProposta = filteredData.reduce((sum, row) => {
      const value = parseInt(row['NOVA PROPOSTA'] || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    const emAnalise = filteredData.reduce((sum, row) => {
      const value = parseInt(row['EM ANÁLISE'] || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    const implantada = filteredData.reduce((sum, row) => {
      const value = parseInt(row['IMPLANTADA'] || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    return {
      novoContato,
      oportunidade,
      cotacao,
      vitalicio,
      seguroVida,
      descartado,
      customSuccess,
      novaProposta,
      emAnalise,
      implantada,
    };
  };

  const prepareChartData = () => {
    if (filteredData.length === 0) {
      return [
        { 
          data: 'Sem dados', 
          novoContato: 0, 
          oportunidade: 0,
          cotacao: 0,
          vitalicio: 0,
          seguroVida: 0,
          descartado: 0,
          customSuccess: 0,
          novaProposta: 0,
          emAnalise: 0,
          implantada: 0
        }
      ];
    }

    return filteredData.map(row => ({
      data: row.DATA,
      novoContato: parseInt(row['NOVO CONTATO'] || '0') || 0,
      oportunidade: parseInt(row['OPORTUNIDADE'] || '0') || 0,
      cotacao: parseInt(row['COTAÇÃO'] || '0') || 0,
      vitalicio: parseInt(row['VITALÍCIO'] || '0') || 0,
      seguroVida: parseInt(row['SEGURO VIDA'] || '0') || 0,
      descartado: parseInt(row['DESCARTADO'] || '0') || 0,
      customSuccess: parseInt(row['CUSTOM SUCCESS'] || '0') || 0,
      novaProposta: parseInt(row['NOVA PROPOSTA'] || '0') || 0,
      emAnalise: parseInt(row['EM ANÁLISE'] || '0') || 0,
      implantada: parseInt(row['IMPLANTADA'] || '0') || 0,
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
            <p className="mt-4 text-gray-600">Carregando dados Retenção...</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Retenção</h1>
          <p className="text-gray-600">Dashboard de Retenção e Reativação de Clientes</p>
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <MetricCard
            title="NOVO CONTATO"
            value={metrics.novoContato}
          />
          <MetricCard
            title="OPORTUNIDADE"
            value={metrics.oportunidade}
          />
          <MetricCard
            title="COTAÇÃO"
            value={metrics.cotacao}
          />
          <MetricCard
            title="VITALÍCIO"
            value={metrics.vitalicio}
          />
          <MetricCard
            title="SEGURO VIDA"
            value={metrics.seguroVida}
          />
          <MetricCard
            title="DESCARTADO"
            value={metrics.descartado}
          />
          <MetricCard
            title="CUSTOM SUCCESS"
            value={metrics.customSuccess}
          />
          <MetricCard
            title="NOVA PROPOSTA"
            value={metrics.novaProposta}
          />
          <MetricCard
            title="EM ANÁLISE"
            value={metrics.emAnalise}
          />
          <MetricCard
            title="IMPLANTADA"
            value={metrics.implantada}
          />
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Novo Contato */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Novo Contato por Dia</h3>
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
                  formatter={(value: any) => [Math.round(value), 'Novo Contato']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Bar dataKey="novoContato" fill="#3B82F6" />
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

          {/* Cotação */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cotação por Dia</h3>
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
                  formatter={(value: any) => [Math.round(value), 'Cotação']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Bar dataKey="cotacao" fill="#06B6D4" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Vitalício */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Vitalício por Dia</h3>
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
                  formatter={(value: any) => [Math.round(value), 'Vitalício']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Bar dataKey="vitalicio" fill="#84CC16" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Seguro Vida */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Seguro Vida por Dia</h3>
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
                  formatter={(value: any) => [Math.round(value), 'Seguro Vida']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Bar dataKey="seguroVida" fill="#7C3AED" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Descartado */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Descartado por Dia</h3>
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
                  formatter={(value: any) => [Math.round(value), 'Descartado']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Bar dataKey="descartado" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Custom Success */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom Success por Dia</h3>
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
                  formatter={(value: any) => [Math.round(value), 'Custom Success']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Bar dataKey="customSuccess" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Nova Proposta */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Nova Proposta por Dia</h3>
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
                  formatter={(value: any) => [Math.round(value), 'Nova Proposta']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Bar dataKey="novaProposta" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Em Análise */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Em Análise por Dia</h3>
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
                  formatter={(value: any) => [Math.round(value), 'Em Análise']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Bar dataKey="emAnalise" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Implantada */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Implantada por Dia</h3>
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
                  formatter={(value: any) => [Math.round(value), 'Implantada']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Bar dataKey="implantada" fill="#059669" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RetencaoDashboard;
