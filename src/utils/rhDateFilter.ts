// Função de filtro customizada para RH que funciona com diferentes formatos de data
export const filterDataByPeriodCustom = (data: any[], period: 'hoje' | 'ontem' | 'semana' | 'mes'): any[] => {
  if (!data.length) return [];
  
  // Usa fuso horário de Brasília para hoje e ontem
  const today = new Date();
  const brasiliaTime = new Date(today.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
  
  console.log('📅 Filtrando dados RH por período:', period);
  console.log('📊 Total de registros para filtrar:', data.length);
  console.log('🌍 Data atual (Brasília):', brasiliaTime.toLocaleDateString('pt-BR'));
  
  // Encontra a data mais recente na planilha para usar como referência para semana e mês
  let latestDate: Date | null = null;
  let latestDateStr = '';
  
  data.forEach(row => {
    if (!row.DATA || row.DATA.trim() === '') return;
    
    const parts = row.DATA.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const year = parseInt(parts[2]);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        const date = new Date(year, month, day);
        if (!latestDate || date > latestDate) {
          latestDate = date;
          latestDateStr = row.DATA;
        }
      }
    }
  });
  
  if (!latestDate) {
    console.log('⚠️ Nenhuma data válida encontrada na planilha');
    return [];
  }
  
  console.log('📅 Data mais recente na planilha:', latestDateStr);
  
  const filteredData = data.filter(row => {
    if (!row.DATA || row.DATA.trim() === '') return false;
    
    // Parse da data no formato DD/MM/YYYY
    const parts = row.DATA.split('/');
    if (parts.length !== 3) return false;
    
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const year = parseInt(parts[2]);
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
    
    const rowDate = new Date(year, month, day);
    rowDate.setHours(0, 0, 0, 0);
    
    // Usa Brasília para hoje e ontem, planilha para semana e mês
    const todayNormalized = new Date(brasiliaTime);
    todayNormalized.setHours(0, 0, 0, 0);
    
    const latestNormalized = new Date(latestDate);
    latestNormalized.setHours(0, 0, 0, 0);
    
    // Log para debug
    console.log(`🔍 Comparando: ${row.DATA} (${rowDate.toLocaleDateString('pt-BR')}) com período: ${period}`);
    console.log(`🌍 Data atual (Brasília): ${todayNormalized.toLocaleDateString('pt-BR')}`);
    console.log(`📅 Data mais recente (planilha): ${latestDateStr} (${latestNormalized.toLocaleDateString('pt-BR')})`);
    
    switch (period) {
      case 'hoje':
        const isToday = rowDate.getTime() === todayNormalized.getTime();
        console.log(`  ✅ Hoje (Brasília): ${isToday}`);
        return isToday;
        
      case 'ontem':
        const yesterday = new Date(todayNormalized);
        yesterday.setDate(yesterday.getDate() - 1);
        const isYesterday = rowDate.getTime() === yesterday.getTime();
        console.log(`  ✅ Ontem (Brasília, ${yesterday.toLocaleDateString('pt-BR')}): ${isYesterday}`);
        return isYesterday;
        
      case 'semana':
        const weekAgo = new Date(latestNormalized);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const isInWeek = rowDate >= weekAgo && rowDate <= latestNormalized;
        console.log(`  ✅ Semana (planilha, ${weekAgo.toLocaleDateString('pt-BR')} a ${latestNormalized.toLocaleDateString('pt-BR')}): ${isInWeek}`);
        return isInWeek;
        
      case 'mes':
        const isInMonth = rowDate.getMonth() === latestDate.getMonth() && 
                         rowDate.getFullYear() === latestDate.getFullYear();
        console.log(`  ✅ Mês (planilha, ${latestDate.getMonth() + 1}/${latestDate.getFullYear()}): ${isInMonth}`);
        return isInMonth;
        
      default:
        return true;
    }
  });
  
  console.log('✅ Dados RH filtrados por período:', { period, count: filteredData.length });
  return filteredData;
};
