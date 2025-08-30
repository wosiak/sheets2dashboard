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
      const rangeParam = range || `${sheetName}!A:I`; // Lê apenas até a coluna I
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
          
          // Converte valores numéricos
          if (typeof value === 'string' && value.trim() && !isNaN(Number(value))) {
            rowData[header.trim()] = Number(value);
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
  filterDataByPeriod(data: any[], period: 'hoje' | 'ontem' | 'semana' | 'mes'): any[] {
    if (!data.length) return [];
    
    // Usa fuso horário de Brasília - funciona independentemente do dia
    const today = new Date();
    const brasiliaTime = new Date(today.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
    const todayStr = this.formatDateForComparison(brasiliaTime);
    
    // Log apenas para debug (pode ser removido depois)
    console.log('📅 Filtrando dados por período:', period, 'Data de hoje (Brasília):', todayStr);
    console.log('📊 Total de registros para filtrar:', data.length);
    
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
          follow_up: 0
        };
      }
      
      // Soma valores numéricos apenas das colunas A-I
      const leads = Number(row.LEADS) || 0;
      const cotacaoDiaria = Number(row['COTAÇÃO DIÁRIA']) || 0;
      const ligacaoDiaria = Number(row['LIGAÇÃO DIÁRIA']) || 0;
      const followUp = Number(row['FOLLOW UP']) || 0;
      
      vendorMetrics[vendor].leads += leads;
      vendorMetrics[vendor].cotacao_diaria += cotacaoDiaria;
      vendorMetrics[vendor].ligacao_diaria += ligacaoDiaria;
      vendorMetrics[vendor].follow_up += followUp;
      
      // Log dos primeiros registros para debug
      if (index < 3) {
        console.log(`📋 Registro ${index + 1}:`, {
          vendor,
          leads,
          cotacaoDiaria,
          ligacaoDiaria,
          followUp
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
