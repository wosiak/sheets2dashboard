// Dados de exemplo para vendas
export const mockSalesData = [
  { id: '1', data: '01/08/2025', vendedor: 'Gustavo', leads: 5, vendas: 2, valor: 15000, status: 'Ativo' },
  { id: '2', data: '01/08/2025', vendedor: 'Sabrina', leads: 3, vendas: 1, valor: 8000, status: 'Ativo' },
  { id: '3', data: '02/08/2025', vendedor: 'Gustavo', leads: 7, vendas: 3, valor: 22000, status: 'Ativo' },
  { id: '4', data: '02/08/2025', vendedor: 'Sabrina', leads: 4, vendas: 2, valor: 12000, status: 'Ativo' },
  { id: '5', data: '03/08/2025', vendedor: 'Gustavo', leads: 6, vendas: 2, valor: 18000, status: 'Ativo' },
  { id: '6', data: '03/08/2025', vendedor: 'Sabrina', leads: 5, vendas: 3, valor: 15000, status: 'Ativo' },
];

// Dados de exemplo para financeiro
export const mockFinancialData = [
  { id: '1', mes: 'Janeiro', receita: 150000, custos: 80000, lucro: 70000, categoria: 'Vendas' },
  { id: '2', mes: 'Fevereiro', receita: 180000, custos: 90000, lucro: 90000, categoria: 'Vendas' },
  { id: '3', mes: 'Março', receita: 200000, custos: 100000, lucro: 100000, categoria: 'Vendas' },
  { id: '4', mes: 'Abril', receita: 220000, custos: 110000, lucro: 110000, categoria: 'Vendas' },
];

// Dados de exemplo para marketing
export const mockMarketingData = [
  { id: '1', canal: 'Google Ads', leads: 150, conversao: 12, custo: 5000, roi: 2.4 },
  { id: '2', canal: 'Facebook', leads: 200, conversao: 8, custo: 3000, roi: 1.8 },
  { id: '3', canal: 'LinkedIn', leads: 80, conversao: 15, custo: 2000, roi: 3.2 },
  { id: '4', canal: 'Email', leads: 120, conversao: 10, custo: 1000, roi: 4.1 },
];

// Função para obter dados mock baseado no dashboard
export const getMockDataForDashboard = (sheetName: string) => {
  console.log('🎭 Retornando dados de exemplo para:', sheetName);
  
  switch (sheetName.toLowerCase()) {
    case 'agosto2025':
    case 'agosto':
      return mockSalesData;
    case 'sheet1':
      return mockFinancialData;
    default:
      return mockSalesData;
  }
};
