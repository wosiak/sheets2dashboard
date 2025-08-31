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
  'FOLLOW UP': string;
  'FECHAMENTO': string;
  'VITALÍCIO': string;
  'PLANO DE SAÚDE': string;
  'PLANO ODONTO': string;
  'SEGURO VIDA': string;
  'SEM INTERESSE': string;
  'REATIVADO': string;
}

const RetencaoDashboard = () => {
  console.log('🚀 RetencaoDashboard - Componente inicializado');
  
  const [data, setData] = useState<RetencaoData[]>([]);
  const [filteredData, setFilteredData] = useState<RetencaoData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'hoje' | 'ontem' | 'semana' | 'mes'>('ontem');
  const [selectedVendor, setSelectedVendor] = useState<string>('');
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
  }, [data, selectedPeriod]);

  const fetchData = async () => {
    try {
      console.log('📊 Buscando dados da planilha Retenção...');
      setLoading(true);
      setError(null);

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/1GUkqFhUTVLFVNiYIp3aBnAKerjZF26CkIwKwSlfs4Xw/values/2025!A:L?key=${import.meta.env.VITE_GOOGLE_SHEETS_API_KEY}`
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
    
    const filtered = googleSheetsService.filterDataByPeriod(data, selectedPeriod);
    console.log('✅ Dados filtrados por período:', { period: selectedPeriod, count: filtered.length });
    setFilteredData(filtered);
  };

  const calculateMetrics = () => {
    if (filteredData.length === 0) {
      return {
        novoContato: 0,
        oportunidade: 0,
        cotacao: 0,
        followUp: 0,
        fechamento: 0,
        vitalicio: 0,
        planoSaude: 0,
        planoOdonto: 0,
        seguroVida: 0,
        semInteresse: 0,
        reativado: 0,
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

    const followUp = filteredData.reduce((sum, row) => {
      const value = parseInt(row['FOLLOW UP'] || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    const fechamento = filteredData.reduce((sum, row) => {
      const value = parseInt(row['FECHAMENTO'] || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    const vitalicio = filteredData.reduce((sum, row) => {
      const value = parseInt(row['VITALÍCIO'] || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    const planoSaude = filteredData.reduce((sum, row) => {
      const value = parseInt(row['PLANO DE SAÚDE'] || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    const planoOdonto = filteredData.reduce((sum, row) => {
      const value = parseInt(row['PLANO ODONTO'] || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    const seguroVida = filteredData.reduce((sum, row) => {
      const value = parseInt(row['SEGURO VIDA'] || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    const semInteresse = filteredData.reduce((sum, row) => {
      const value = parseInt(row['SEM INTERESSE'] || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    const reativado = filteredData.reduce((sum, row) => {
      const value = parseInt(row['REATIVADO'] || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    return {
      novoContato,
      oportunidade,
      cotacao,
      followUp,
      fechamento,
      vitalicio,
      planoSaude,
      planoOdonto,
      seguroVida,
      semInteresse,
      reativado,
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
          followUp: 0,
          fechamento: 0, 
          vitalicio: 0,
          planoSaude: 0,
          planoOdonto: 0,
          seguroVida: 0,
          semInteresse: 0, 
          reativado: 0 
        }
      ];
    }

    return filteredData.map(row => ({
      data: row.DATA,
      novoContato: parseInt(row['NOVO CONTATO'] || '0') || 0,
      oportunidade: parseInt(row['OPORTUNIDADE'] || '0') || 0,
      cotacao: parseInt(row['COTAÇÃO'] || '0') || 0,
      followUp: parseInt(row['FOLLOW UP'] || '0') || 0,
      fechamento: parseInt(row['FECHAMENTO'] || '0') || 0,
      vitalicio: parseInt(row['VITALÍCIO'] || '0') || 0,
      planoSaude: parseInt(row['PLANO DE SAÚDE'] || '0') || 0,
      planoOdonto: parseInt(row['PLANO ODONTO'] || '0') || 0,
      seguroVida: parseInt(row['SEGURO VIDA'] || '0') || 0,
      semInteresse: parseInt(row['SEM INTERESSE'] || '0') || 0,
      reativado: parseInt(row['REATIVADO'] || '0') || 0,
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
        />

        {/* Métricas */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
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
            title="FOLLOW UP"
            value={metrics.followUp}
          />
          <MetricCard
            title="FECHAMENTO"
            value={metrics.fechamento}
          />
          <MetricCard
            title="VITALÍCIO"
            value={metrics.vitalicio}
          />
          <MetricCard
            title="PLANO SAÚDE"
            value={metrics.planoSaude}
          />
          <MetricCard
            title="PLANO ODONTO"
            value={metrics.planoOdonto}
          />
          <MetricCard
            title="SEGURO VIDA"
            value={metrics.seguroVida}
          />
          <MetricCard
            title="SEM INTERESSE"
            value={metrics.semInteresse}
          />
          <MetricCard
            title="REATIVADO"
            value={metrics.reativado}
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

          {/* Follow Up */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Follow Up por Dia</h3>
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
                  formatter={(value: any) => [Math.round(value), 'Follow Up']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Bar dataKey="followUp" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Fechamento */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Fechamento por Dia</h3>
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
                  formatter={(value: any) => [Math.round(value), 'Fechamento']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Bar dataKey="fechamento" fill="#10B981" />
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

          {/* Plano de Saúde */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Plano de Saúde por Dia</h3>
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
                  formatter={(value: any) => [Math.round(value), 'Plano de Saúde']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Bar dataKey="planoSaude" fill="#059669" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Plano Odonto */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Plano Odonto por Dia</h3>
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
                  formatter={(value: any) => [Math.round(value), 'Plano Odonto']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Bar dataKey="planoOdonto" fill="#0D9488" />
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

          {/* Sem Interesse */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sem Interesse por Dia</h3>
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
                  formatter={(value: any) => [Math.round(value), 'Sem Interesse']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Bar dataKey="semInteresse" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Reativado */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reativado por Dia</h3>
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
                  formatter={(value: any) => [Math.round(value), 'Reativado']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Bar dataKey="reativado" fill="#DC2626" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RetencaoDashboard;
