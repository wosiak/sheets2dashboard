const Config = {
  ANO_BASE: 2026,
  COMMISSION_DEFAULT: 0.05,
  
  SHEET_NAME: 'Marketing',
  
  // Bloco 1: Movimento Diário (Colunas A:G, dados a partir da linha 2)
  DIARIO_START_ROW: 2,
  DIARIO_END_ROW: 366,
  COLUMNS_DIARIO: {
    data: 'A',
    leadsAlto: 'B',
    leadsMedio: 'C',
    agendAlto: 'D',
    agendMedio: 'E',
    reunAlto: 'F',
    reunMedio: 'G'
  },
  
  // Bloco 2: Vendas (Colunas I:L, dados a partir da linha 2, sem tamanho fixo - append)
  VENDAS_START_ROW: 2,
  COLUMNS_VENDAS: {
    data: 'I',
    sdr: 'J',
    segmento: 'K',
    valorImovel: 'L'
  },
  
  // Bloco 3: Custos Mensais (Colunas N:S, dados a partir da linha 2 - Janeiro na linha 2, Dezembro na linha 13)
  CUSTOS_START_ROW: 2,
  CUSTOS_END_ROW: 13,
  COLUMNS_CUSTOS: {
    mes: 'N',
    invAlto: 'O',
    invMedio: 'P',
    contratacao: 'Q',
    telefonia: 'R',
    ferramentas: 'S'
  },
  
  // Bloco 4: Performance SDR Mensal (Colunas U:Y, lookup por Mês+Operador, sem tamanho fixo)
  SDR_START_ROW: 2,
  COLUMNS_SDR: {
    mes: 'U',
    sdr: 'V',
    leadsRecebidos: 'W',
    leadsAgendados: 'X',
    reunioes: 'Y'
  },

  // Bloco 5: Configuração (Coluna AB)
  CONFIG_CELL: 'AB2',
  
  // Bloco 6: Operadores / Roster (Colunas AD:AE, dados a partir da linha 2)
  ROSTER_START_ROW: 2,
  COLUMNS_ROSTER: {
    sdr: 'AD',
    status: 'AE'
  },
  
  // Lista de meses em português
  MESES_NOMES: [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ],

  // Mapeamento de data YYYY-MM-DD para linha do dia (Movimento Diário)
  linhaDoDia(dateStr) {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return this.DIARIO_START_ROW;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    
    const base = new Date(2025, 11, 31); // 31/12/2025 é a linha 2 da planilha
    const target = new Date(year, month, day);
    
    // Data em UTC para evitar discrepâncias de fuso horário
    const baseUtc = Date.UTC(base.getFullYear(), base.getMonth(), base.getDate());
    const targetUtc = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
    
    const diff = Math.round((targetUtc - baseUtc) / 86400000);
    return this.DIARIO_START_ROW + diff;
  },
  
  // Mapeamento de data YYYY-MM para linha do mês (Custos Mensais)
  linhaDoMesCusto(monthStr) {
    const parts = monthStr.split('-');
    if (parts.length !== 2) return this.CUSTOS_START_ROW;
    const monthIndex = parseInt(parts[1], 10) - 1; // 0 a 11
    return this.CUSTOS_START_ROW + monthIndex;
  }
};

// Exportação universal para Node.js e Navegador
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Config;
} else if (typeof window !== 'undefined') {
  window.Config = Config;
} else {
  globalThis.Config = Config;
}
