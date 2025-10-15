import { googleSheetsService } from './googleSheetsService';

export interface AdmData {
  DATA: string;
  'ATIVIDADE DIÁRIA': number;
  'NOVA PROPOSTA': number;
  'PEND ASSINATURA': number;
  'EM ANÁLISE': number;
  PENDÊNCIA: number;
  'ENTREVISTA MÉDICA': number;
  BOLETO: number;
  IMPLANTADA: number;
  DESISTIU: number;
  'ERRO DE VENDAS': number;
  DECLINADA: number;
}

export interface AdmMetrics {
  atividade_diaria: number;
  nova_proposta: number;
  em_analise: number;
  implantada: number;
  pend_assinatura: number;
  pendencia: number;
  entrevista_medica: number;
  boleto: number;
  desistiu: number;
  erro_vendas: number;
  declinada: number;
}

export class AdmService {
  async getAdmData(spreadsheetId: string, sheetName: string): Promise<AdmData[]> {
    try {
      console.log('📊 Buscando dados da planilha ADM...');
      
      // Busca dados da planilha
      const rawData = await googleSheetsService.getSheetData(spreadsheetId, sheetName, `${sheetName}!A:L`);
      
      if (!rawData || rawData.length < 2) {
        console.log('⚠️ Dados insuficientes da planilha ADM');
        return [];
      }
      
      // Primeira linha são os headers
      const headers = rawData[0];
      console.log('📋 Headers da planilha ADM:', headers);
      
      // Processa as linhas de dados (começando da linha 2)
      const processedData: AdmData[] = [];
      
      for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (row.length === 0 || !row[0]) continue; // Pula linhas vazias
        
        const dataRow: any = {};
        
        // Mapeia cada coluna
        headers.forEach((header: string, index: number) => {
          if (header && row[index] !== undefined) {
            const value = row[index];
            // Converte para número se possível
            if (header !== 'DATA') {
              dataRow[header] = Number(value) || 0;
            } else {
              dataRow[header] = value;
            }
          }
        });
        
        // Só adiciona se tiver data
        if (dataRow.DATA) {
          processedData.push(dataRow as AdmData);
        }
      }
      
      console.log('✅ Dados ADM processados:', processedData.length, 'registros');
      console.log('📊 Exemplo de dados:', processedData.slice(0, 3));
      
      return processedData;
    } catch (error) {
      console.error('❌ Erro ao buscar dados ADM:', error);
      return [];
    }
  }
  
  // Filtra dados por período
  filterDataByPeriod(data: AdmData[], period: 'hoje' | 'ontem' | 'semana' | 'mes'): AdmData[] {
    if (!data.length) return [];
    
    // Usa fuso horário de Brasília
    const today = new Date();
    const brasiliaTime = new Date(today.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
    const todayStr = this.formatDateForComparison(brasiliaTime);
    
    console.log('📅 Filtrando dados ADM por período:', period, 'Data de hoje (Brasília):', todayStr);
    
    const filteredData = data.filter(row => {
      if (!row.DATA) return false;
      
      const rowDate = this.parseDate(row.DATA);
      if (!rowDate) return false;
      
      const rowDateStr = this.formatDateForComparison(rowDate);
      
      switch (period) {
        case 'hoje':
          return rowDateStr === todayStr;
          
        case 'ontem':
          const yesterday = new Date(brasiliaTime);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = this.formatDateForComparison(yesterday);
          return rowDateStr === yesterdayStr;
          
        case 'semana':
          const weekAgo = new Date(brasiliaTime);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return rowDate >= weekAgo;
          
        case 'mes':
          return rowDate.getMonth() === brasiliaTime.getMonth() && rowDate.getFullYear() === brasiliaTime.getFullYear();
          
        default:
          return true;
      }
    });
    
    console.log('✅ Dados ADM filtrados por período:', { period, count: filteredData.length });
    return filteredData;
  }
  
  // Calcula métricas agregadas
  calculateMetrics(data: AdmData[]): AdmMetrics {
    const metrics: AdmMetrics = {
      atividade_diaria: 0,
      nova_proposta: 0,
      em_analise: 0,
      implantada: 0,
      pend_assinatura: 0,
      pendencia: 0,
      entrevista_medica: 0,
      boleto: 0,
      desistiu: 0,
      erro_vendas: 0,
      declinada: 0
    };
    
    data.forEach(row => {
      metrics.atividade_diaria += row['ATIVIDADE DIÁRIA'] || 0;
      metrics.nova_proposta += row['NOVA PROPOSTA'] || 0;
      metrics.em_analise += row['EM ANÁLISE'] || 0;
      metrics.implantada += row['IMPLANTADA'] || 0;
      metrics.pend_assinatura += row['PEND ASSINATURA'] || 0;
      metrics.pendencia += row['PENDÊNCIA'] || 0;
      metrics.entrevista_medica += row['ENTREVISTA MÉDICA'] || 0;
      metrics.boleto += row['BOLETO'] || 0;
      metrics.desistiu += row['DESISTIU'] || 0;
      metrics.erro_vendas += row['ERRO DE VENDAS'] || 0;
      metrics.declinada += row['DECLINADA'] || 0;
    });
    
    console.log('📊 Métricas ADM calculadas:', metrics);
    return metrics;
  }
  
  // Gera dados para gráficos
  generateChartData(data: AdmData[]): Record<string, any[]> {
    const chartData: Record<string, any[]> = {};
    
    if (data.length === 0) {
      // Gráficos vazios
      chartData.atividadeDiaria = [];
      chartData.novaProposta = [];
      chartData.emAnalise = [];
      chartData.implantada = [];
      return chartData;
    }
    
    // Ordena por data
    const sortedData = data.sort((a, b) => {
      const dateA = this.parseDate(a.DATA);
      const dateB = this.parseDate(b.DATA);
      if (!dateA || !dateB) return 0;
      return dateA.getTime() - dateB.getTime();
    });
    
    // Dados para gráficos de barras
    chartData.atividadeDiaria = sortedData.map(row => ({
      name: row.DATA,
      value: row['ATIVIDADE DIÁRIA'] || 0
    }));
    
    chartData.novaProposta = sortedData.map(row => ({
      name: row.DATA,
      value: row['NOVA PROPOSTA'] || 0
    }));
    
    chartData.emAnalise = sortedData.map(row => ({
      name: row.DATA,
      value: row['EM ANÁLISE'] || 0
    }));
    
    chartData.implantada = sortedData.map(row => ({
      name: row.DATA,
      value: row['IMPLANTADA'] || 0
    }));
    
    console.log('📈 Dados para gráficos ADM gerados:', Object.keys(chartData));
    return chartData;
  }
  
  // Função para parsear datas no formato brasileiro
  private parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    
    // Formato: DD/MM ou DD/MM/YYYY
    const parts = dateStr.split('/');
    if (parts.length >= 2) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // Mês começa em 0
      
      if (!isNaN(day) && !isNaN(month)) {
        // Se não tem ano, assume o ano atual
        const year = parts.length === 3 ? parseInt(parts[2]) : new Date().getFullYear();
        if (!isNaN(year)) {
          return new Date(year, month, day);
        }
      }
    }
    
    return null;
  }
  
  // Função para formatar data para comparação
  private formatDateForComparison(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
}

// Instância padrão do serviço
export const admService = new AdmService();
