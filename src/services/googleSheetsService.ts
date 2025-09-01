import axios from 'axios';

const GOOGLE_SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

export class GoogleSheetsService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    console.log('🔑 GoogleSheetsService inicializado com API Key:', apiKey ? '✅ Configurada' : '❌ Não configurada');
  }

  async getSheetData(spreadsheetId: string, sheetName: string, range?: string): Promise<any[][]> {
    try {
      const rangeParam = range || `${sheetName}!A:I`; // Lê até a coluna I (FATURAMENTO)
      console.log('📊 Tentando buscar dados da planilha:', { spreadsheetId, sheetName, range: rangeParam });
      
      const url = `${GOOGLE_SHEETS_API_BASE}/${spreadsheetId}/values/${rangeParam}?key=${this.apiKey}`;
      console.log('🌐 URL da requisição:', url.replace(this.apiKey, '***API_KEY_HIDDEN***'));
      
      const response = await axios.get(url);
      console.log('✅ Resposta da API recebida:', { 
        status: response.status, 
        hasData: !!response.data.values, 
        rowsCount: response.data.values?.length || 0 
      });
      
      if (!response.data.values) {
        throw new Error('Nenhum dado encontrado na planilha');
      }

      console.log('📋 Dados brutos da planilha:', response.data.values.slice(0, 3));
      return response.data.values;
    } catch (error: any) {
      console.error('❌ Erro ao buscar dados da planilha:', { 
        message: error.message, 
        status: error.response?.status, 
        data: error.response?.data 
      });
      throw new Error(`Falha ao conectar com Google Sheets: ${error.message}`);
    }
  }

  parseSheetData(rawData: any[][]): any[] {
    console.log('🔄 Iniciando parse dos dados da planilha...');
    
    if (!rawData || rawData.length < 2) {
      console.log('⚠️ Dados insuficientes para parse');
      return [];
    }

    const headers = rawData[0];
    console.log('📋 Headers encontrados:', headers);
    
    const dataRows = rawData.slice(1); // Remove o header
    console.log('📊 Número de linhas de dados:', dataRows.length);

    const parsedData = dataRows.map((row, index) => {
      const rowData: any = {};
      
      headers.forEach((header, colIndex) => {
        if (header && header.trim()) { // Só processa colunas com nome
          const value = row[colIndex] || '';
          
          // Ignora a coluna I (VENDEDOR duplicado) - usa apenas a coluna B
          if (colIndex === 8 && header === 'VENDEDOR') {
            console.log('⚠️ Ignorando coluna I (VENDEDOR duplicado)');
            return;
          }
          
          // Converte valores numéricos
          if (typeof value === 'string' && value.trim()) {
            // Trata valores monetários brasileiros (vírgula como separador decimal)
            if (header === 'FATURAMENTO') {
              console.log(`💰 Valor FATURAMENTO encontrado: "${value}"`);
              // Tenta converter diretamente primeiro
              if (!isNaN(Number(value))) {
                rowData[header.trim()] = Number(value);
                console.log(`💰 Conversão direta: ${value} -> ${Number(value)}`);
              } else if (value.includes(',')) {
                // Se tem vírgula, tenta converter formato brasileiro
                const cleanValue = value.replace(/\./g, '').replace(',', '.');
                if (!isNaN(Number(cleanValue))) {
                  rowData[header.trim()] = Number(cleanValue);
                  console.log(`💰 Conversão brasileira: ${value} -> ${Number(cleanValue)}`);
                } else {
                  rowData[header.trim()] = 0;
                  console.log(`💰 Conversão falhou, definindo como 0: ${value}`);
                }
              } else {
                rowData[header.trim()] = 0;
                console.log(`💰 Valor não numérico, definindo como 0: ${value}`);
              }
            } else if (!isNaN(Number(value))) {
              rowData[header.trim()] = Number(value);
            } else {
              rowData[header.trim()] = value;
            }
          } else {
            rowData[header.trim()] = value;
          }
        }
      });
      
      // Log detalhado para as primeiras linhas
      if (index < 5) {
        console.log(`📋 Linha ${index + 1} parseada:`, rowData);
      }
      
      return rowData;
    });

    console.log('✅ Dados parseados com sucesso:', { 
      totalRows: parsedData.length, 
      sampleRow: parsedData[0] || 'Nenhum dado', 
      columns: Object.keys(parsedData[0] || {}) 
    });
    
    // Log específico para dados de ontem (29/08/2025)
    const dadosOntem = parsedData.filter(row => row.DATA === '29/08/2025');
    console.log('📅 Dados de ontem (29/08/2025):', dadosOntem.length, 'registros');
    if (dadosOntem.length > 0) {
      console.log('📊 Exemplo de dados de ontem:', dadosOntem.slice(0, 3));
    }
    
    return parsedData;
  }

  // Função para filtrar dados por período
  filterDataByPeriod(data: any[], period: 'hoje' | 'ontem' | 'semana' | 'mes' | 'custom', customMonth?: string, customYear?: string): any[] {
    if (!data.length) return [];
    
    // Usa fuso horário de Brasília - funciona independentemente do dia
    const today = new Date();
    const brasiliaTime = new Date(today.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
    const todayStr = this.formatDateForComparison(brasiliaTime);
    
    // Log apenas para debug (pode ser removido depois)
    console.log('📅 Filtrando dados por período:', period, 'Data de hoje (Brasília):', todayStr);
    console.log('📊 Total de registros para filtrar:', data.length);
    
    // Log das primeiras datas para debug
    console.log('📅 Primeiras 5 datas encontradas:');
    data.slice(0, 5).forEach((row, index) => {
      console.log(`  ${index + 1}. DATA: "${row.DATA}"`);
    });
    
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
          const currentMonth = brasiliaTime.getMonth();
          const currentYear = brasiliaTime.getFullYear();
          const isInCurrentMonth = rowDate.getMonth() === currentMonth && rowDate.getFullYear() === currentYear;
          console.log(`📅 Verificando mês: ${rowDateStr} (mês ${rowDate.getMonth()}, ano ${rowDate.getFullYear()}) vs atual (mês ${currentMonth}, ano ${currentYear}) = ${isInCurrentMonth}`);
          return isInCurrentMonth;
          
        case 'custom':
          if (!customMonth || !customYear) return false;
          const targetMonth = parseInt(customMonth) - 1; // Mês começa em 0
          const targetYear = parseInt(customYear);
          const isInCustomMonth = rowDate.getMonth() === targetMonth && rowDate.getFullYear() === targetYear;
          console.log(`📅 Verificando mês customizado: ${rowDateStr} (mês ${rowDate.getMonth()}, ano ${rowDate.getFullYear()}) vs selecionado (mês ${targetMonth}, ano ${targetYear}) = ${isInCustomMonth}`);
          return isInCustomMonth;
          
        default:
          return true;
      }
    });
    
    console.log('✅ Dados filtrados por período:', { period, count: filteredData.length });
    return filteredData;
  }

  // Função para parsear datas no formato brasileiro
  private parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    
    // Formato: DD/MM/YYYY
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // Mês começa em 0
      const year = parseInt(parts[2]);
      
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day);
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

  // Função para obter métricas agregadas por vendedor
  getVendorMetrics(data: any[]): any[] {
    console.log('🔍 Iniciando cálculo de métricas por vendedor...');
    console.log('📊 Total de registros para processar:', data.length);
    
    // Log específico para debug da coluna FATURAMENTO
    console.log('💰 Debug coluna FATURAMENTO:');
    data.slice(0, 5).forEach((row, index) => {
      console.log(`📋 Linha ${index + 1}:`, {
        vendedor: row.VENDEDOR,
        faturamento: row.FATURAMENTO,
        faturamentoType: typeof row.FATURAMENTO,
        faturamentoRaw: row.FATURAMENTO
      });
    });
    
    const vendorMetrics: Record<string, any> = {};
    
    data.forEach((row, index) => {
      const vendor = row.VENDEDOR;
      if (!vendor) {
        console.log('⚠️ Registro sem vendedor:', row);
        return;
      }
      
      if (!vendorMetrics[vendor]) {
        vendorMetrics[vendor] = {
          vendedor: vendor,
          leads: 0,
          cotacao_diaria: 0,
          ligacao_diaria: 0,
          follow_up: 0,
          contratos: 0,
          faturamento: 0
        };
      }
      
      // Soma valores numéricos das colunas A-H
      const leads = Number(row.LEADS) || 0;
      const cotacaoDiaria = Number(row['COTAÇÃO DIÁRIA']) || 0;
      const ligacaoDiaria = Number(row['LIGAÇÃO DIÁRIA']) || 0;
      const followUp = Number(row['FOLLOW UP']) || 0;
      const contratos = Number(row['CONTRATOS - DIÁRIO']) || 0;
      const faturamento = Number(row.FATURAMENTO) || 0;
      
      // Log específico para faturamento
      if (faturamento > 0) {
        console.log(`💰 Faturamento encontrado para ${vendor}: R$ ${faturamento.toFixed(2)}`);
      }
      
      vendorMetrics[vendor].leads += leads;
      vendorMetrics[vendor].cotacao_diaria += cotacaoDiaria;
      vendorMetrics[vendor].ligacao_diaria += ligacaoDiaria;
      vendorMetrics[vendor].follow_up += followUp;
      vendorMetrics[vendor].contratos += contratos;
      vendorMetrics[vendor].faturamento += faturamento;
      
      // Log dos primeiros registros para debug
      if (index < 3) {
        console.log(`📋 Registro ${index + 1}:`, {
          vendor,
          leads,
          cotacaoDiaria,
          ligacaoDiaria,
          followUp,
          contratos,
          faturamento
        });
      }
    });
    
    const result = Object.values(vendorMetrics);
    console.log('📊 Métricas por vendedor calculadas:', result.length, 'vendedores');
    console.log('👥 Vendedores encontrados:', Object.keys(vendorMetrics));
    console.log('📈 Exemplo de métricas:', result.slice(0, 2));
    
    return result;
  }
}

// Instância padrão do serviço
export const googleSheetsService = new GoogleSheetsService(
  import.meta.env.VITE_GOOGLE_SHEETS_API_KEY || ''
);
