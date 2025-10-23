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
      const rangeParam = range || `${sheetName}!A:J`; // Lê até a coluna J
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
    
    const dataRows = rawData.slice(1);
    console.log('📊 Número de linhas de dados:', dataRows.length);

    const parsedData = dataRows.map((row, index) => {
      const rowData: any = {};

      headers.forEach((header, colIndex) => {
        if (header && header.trim()) {
          const value = row[colIndex] || '';

          if (typeof value === 'string' && value.trim()) {
            if (!isNaN(Number(value))) {
              rowData[header.trim()] = Number(value);
            } else {
              rowData[header.trim()] = value;
            }
          } else {
            rowData[header.trim()] = value;
          }
        }
      });

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

    return parsedData;
  }

  // Outras funções continuam iguais...

  // Função para parsear datas no formato brasileiro
  private parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;

    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const year = parseInt(parts[2]);

      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }

    return null;
  }

  private formatDateForComparison(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  filterDataByPeriod(data: any[], period: 'hoje' | 'ontem' | 'semana' | 'mes' | 'custom', customMonth?: string, customYear?: string): any[] {
    if (!data.length) return [];

    const today = new Date();
    const brasiliaTime = new Date(today.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const todayStr = this.formatDateForComparison(brasiliaTime);

    console.log('📅 Filtrando dados por período:', period, 'Data de hoje (Brasília):', todayStr);

    const filteredData = data.filter(row => {
      const rawDate = row['Data'] || row['DATA'];
if (!rawDate) return false;

const rowDate = this.parseDate(rawDate);

      if (!rowDate) return false;

      const rowDateStr = this.formatDateForComparison(rowDate);

      switch (period) {
        case 'hoje':
          return rowDateStr === todayStr;
        case 'ontem':
          const yesterday = new Date(brasiliaTime);
          yesterday.setDate(yesterday.getDate() - 1);
          return rowDateStr === this.formatDateForComparison(yesterday);
        case 'semana':
          const weekAgo = new Date(brasiliaTime);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return rowDate >= weekAgo;
        case 'mes':
          return rowDate.getMonth() === brasiliaTime.getMonth() &&
                 rowDate.getFullYear() === brasiliaTime.getFullYear();
        case 'custom':
          if (!customMonth || !customYear) return false;
          const m = parseInt(customMonth) - 1;
          const y = parseInt(customYear);
          return rowDate.getMonth() === m && rowDate.getFullYear() === y;
        default:
          return true;
      }
    });

    console.log('✅ Dados filtrados por período:', { period, count: filteredData.length });
    return filteredData;
  }

 // Função para obter métricas agregadas por responsável
getVendorMetrics(data: any[]): any[] {
  console.log('🔍 Iniciando cálculo de métricas por responsável...');
  console.log('📊 Total de registros para processar:', data.length);

  const vendorMetrics: Record<string, any> = {};

  data.forEach((row, index) => {
    const responsavel = row['Responsável'];
    if (!responsavel) {
      console.log('⚠️ Registro sem Responsável:', row);
      return;
    }

    if (!vendorMetrics[responsavel]) {
      vendorMetrics[responsavel] = {
        responsavel,
        reuniao_agendada: 0,
        reuniao_realizada: 0,
        quantidade_de_ligacao: 0,
        valor_ganho: 0,
      };
    }

    vendorMetrics[responsavel].reuniao_agendada += Number(row['Reunião Agendada']) || 0;
    vendorMetrics[responsavel].reuniao_realizada += Number(row['Reunião Realizada']) || 0;
    vendorMetrics[responsavel].quantidade_de_ligacao += Number(row['Quantidade de Ligação']) || 0;
    vendorMetrics[responsavel].valor_ganho += Number(row['Ganho']) || 0;

    if (index < 3) {
      console.log(`📋 Registro ${index + 1} de ${responsavel}:`, {
        reuniao_agendada: vendorMetrics[responsavel].reuniao_agendada,
        valor_ganho: vendorMetrics[responsavel].valor_ganho,
      });
    }
  });

  const result = Object.values(vendorMetrics);
  console.log('📊 Métricas por responsável calculadas:', result.length, 'itens');
  return result;
}
}

// Instância padrão do serviço
export const googleSheetsService = new GoogleSheetsService(
  import.meta.env.VITE_GOOGLE_SHEETS_API_KEY || ''
);
