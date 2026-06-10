if (typeof module !== 'undefined' && module.exports) {
  global.Config = require('./config');
}
const Engine = {
  // Parser de números robusto para tratar padrões brasileiros e americanos
  parseCellNumber(val) {
    if (val === null || val === undefined) return 0;
    let str = String(val).trim();
    if (str === '') return 0;
    
    // Remover R$, espaços e caracteres estranhos
    str = str.replace(/R\$\s*/gi, '').replace(/\s/g, '');
    
    // Tratar sufixo de Milhões (Ex: 1,2M ou 1.2M)
    if (str.toUpperCase().endsWith('M')) {
      let numPart = str.substring(0, str.length - 1).replace(',', '.');
      return (parseFloat(numPart) * 1000000) || 0;
    }
    
    // Tratar sufixo de Milhares (Ex: 500k ou 500K)
    if (str.toUpperCase().endsWith('K')) {
      let numPart = str.substring(0, str.length - 1).replace(',', '.');
      return (parseFloat(numPart) * 1000) || 0;
    }
    
    const hasComma = str.includes(',');
    const hasDot = str.includes('.');
    
    if (hasComma && hasDot) {
      if (str.indexOf(',') > str.indexOf('.')) {
        // Padrão brasileiro: 1.250,50 -> remover ponto, trocar vírgula por ponto
        str = str.replace(/\./g, '').replace(',', '.');
      } else {
        // Padrão americano: 1,250.50 -> remover vírgula
        str = str.replace(/,/g, '');
      }
    } else if (hasComma) {
      // Somente vírgula: tratar como decimal (ex: 0,05 ou 1500,50)
      str = str.replace(',', '.');
    }
    
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  },

  // Parser de datas flexível
  parseSheetDate(dateStr) {
    if (!dateStr) return null;
    const str = String(dateStr).trim();
    if (str === '') return null;
    
    // YYYY-MM-DD
    if (str.includes('-')) {
      const parts = str.split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      }
    }
    // DD/MM/YYYY
    if (str.includes('/')) {
      const parts = str.split('/');
      if (parts.length === 3) {
        return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      }
    }
    
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  },

  // Formata um objeto Date local para string YYYY-MM-DD
  formatLocalDate(date) {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  // Calcula dias de sobreposição entre dois intervalos [s1, e1] e [s2, e2]
  getOverlapDays(s1, e1, s2, e2) {
    const start = new Date(Math.max(s1.getTime(), s2.getTime()));
    const end = new Date(Math.min(e1.getTime(), e2.getTime()));
    
    // Zera horas para contar dias do calendário em UTC de forma estrita
    const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
    const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
    
    if (startUtc > endUtc) return 0;
    return Math.round((endUtc - startUtc) / 86400000) + 1;
  },

  // Retorna os limites (data de início e fim) de um mês de 2026 pelo nome
  getMonthLimits(monthName) {
    const monthIndex = Config.MESES_NOMES.indexOf(monthName);
    if (monthIndex === -1) return null;
    return {
      start: new Date(Config.ANO_BASE, monthIndex, 1, 0, 0, 0),
      end: new Date(Config.ANO_BASE, monthIndex + 1, 0, 23, 59, 59)
    };
  },

  // Executa os cálculos matemáticos para o dashboard
  calcularDashboard({ startDateStr, endDateStr, groupBy = 'auto', rawData, isComparison = false }) {
    if (!rawData) {
      return this.emptyDashboardResult();
    }

    const startParts = startDateStr.split('-');
    const startDate = new Date(parseInt(startParts[0], 10), parseInt(startParts[1], 10) - 1, parseInt(startParts[2], 10), 0, 0, 0, 0);

    const endParts = endDateStr.split('-');
    const endDate = new Date(parseInt(endParts[0], 10), parseInt(endParts[1], 10) - 1, parseInt(endParts[2], 10), 23, 59, 59, 999);
    
    // 1. Taxa de Comissão (B4)
    const commRate = this.parseCellNumber(rawData.commission?.[0]?.[0]) || Config.COMMISSION_DEFAULT;

    // 2. Processar Movimento Diário (A8:G372)
    const diarioParsed = [];
    const diarioRaw = rawData.diario || [];
    
    diarioRaw.forEach(row => {
      if (!row || row.length < 7) return;
      const date = this.parseSheetDate(row[0]);
      if (!date) return;
      
      diarioParsed.push({
        date,
        leadsAlto: this.parseCellNumber(row[1]),
        leadsMedio: this.parseCellNumber(row[2]),
        agendAlto: this.parseCellNumber(row[3]),
        agendMedio: this.parseCellNumber(row[4]),
        reunAlto: this.parseCellNumber(row[5]),
        reunMedio: this.parseCellNumber(row[6])
      });
    });

    // Filtrar diário pelo período
    const diarioFiltrado = diarioParsed.filter(d => d.date >= startDate && d.date <= endDate);

    // Somar movimento diário
    let leadsAlto = 0, leadsMedio = 0;
    let agendAlto = 0, agendMedio = 0;
    let reunAlto = 0, reunMedio = 0;

    diarioFiltrado.forEach(d => {
      leadsAlto += d.leadsAlto;
      leadsMedio += d.leadsMedio;
      agendAlto += d.agendAlto;
      agendMedio += d.agendMedio;
      reunAlto += d.reunAlto;
      reunMedio += d.reunMedio;
    });

    const leadsTotal = leadsAlto + leadsMedio;
    const agendTotal = agendAlto + agendMedio;
    const reunTotal = reunAlto + reunMedio;

    // 3. Processar Vendas (A376:D475)
    const vendasParsed = [];
    const vendasRaw = rawData.vendas || [];
    
    vendasRaw.forEach((row, idx) => {
      if (!row || row.length < 4) return;
      const date = this.parseSheetDate(row[0]);
      const sdrName = String(row[1] || '').trim();
      const segmento = String(row[2] || '').trim(); // 'Alto' ou 'Médio'
      const valor = this.parseCellNumber(row[3]);
      
      // Ignorar linhas em branco
      if (!date || sdrName === '' || segmento === '' || valor === 0) return;

      vendasParsed.push({
        line: Config.VENDAS_START_ROW + idx, // Linha física real na planilha
        date,
        sdr: sdrName,
        segmento,
        valor
      });
    });

    // Filtrar vendas pelo período
    const vendasFiltradas = vendasParsed.filter(v => v.date >= startDate && v.date <= endDate);

    let vendasCountAlto = 0, vendasCountMedio = 0;
    let valorVendidoAlto = 0, valorVendidoMedio = 0;
    const sdrSalesCount = {}; // SDR -> count de vendas no período

    vendasFiltradas.forEach(v => {
      // Incrementar contador de SDR
      sdrSalesCount[v.sdr] = (sdrSalesCount[v.sdr] || 0) + 1;

      if (v.segmento === 'Alto') {
        vendasCountAlto++;
        valorVendidoAlto += v.valor;
      } else if (v.segmento === 'Médio') {
        vendasCountMedio++;
        valorVendidoMedio += v.valor;
      }
    });

    const vendasTotal = vendasCountAlto + vendasCountMedio;
    const valorVendidoTotal = valorVendidoAlto + valorVendidoMedio;
    
    const comissaoAlto = valorVendidoAlto * commRate;
    const comissaoMedio = valorVendidoMedio * commRate;
    const comissaoTotal = valorVendidoTotal * commRate;

    // 4. Processar Custos Mensais (A479:F490) com Proporcionalidade
    let invAltoTotal = 0;
    let invMedioTotal = 0;
    let contratacaoTotal = 0;
    let telefoniaTotal = 0;
    let ferramentasTotal = 0;

    const custosRaw = rawData.custos || [];
    custosRaw.forEach((row) => {
      if (!row || row.length < 6) return;
      const mesNome = String(row[0]).trim();
      const limits = this.getMonthLimits(mesNome);
      if (!limits) return;

      const diasNoMes = limits.end.getDate();
      const overlapDays = this.getOverlapDays(limits.start, limits.end, startDate, endDate);

      if (overlapDays > 0) {
        const proporcao = overlapDays / diasNoMes;
        
        invAltoTotal += proporcao * this.parseCellNumber(row[1]);
        invMedioTotal += proporcao * this.parseCellNumber(row[2]);
        contratacaoTotal += proporcao * this.parseCellNumber(row[3]);
        telefoniaTotal += proporcao * this.parseCellNumber(row[4]);
        ferramentasTotal += proporcao * this.parseCellNumber(row[5]);
      }
    });

    const totalAnuncios = invAltoTotal + invMedioTotal;
    const totalCustos = totalAnuncios + contratacaoTotal + telefoniaTotal + ferramentasTotal;

    // 5. Métricas Gerais e por Segmento
    const custoPorLeadAlto = leadsAlto > 0 ? invAltoTotal / leadsAlto : 0;
    const custoPorLeadMedio = leadsMedio > 0 ? invMedioTotal / leadsMedio : 0;
    const custoPorLeadTotal = leadsTotal > 0 ? totalAnuncios / leadsTotal : 0;

    const custoPorReuniaoAlto = reunAlto > 0 ? invAltoTotal / reunAlto : 0;
    const custoPorReuniaoMedio = reunMedio > 0 ? invMedioTotal / reunMedio : 0;
    const custoPorReuniaoTotal = reunTotal > 0 ? totalAnuncios / reunTotal : 0;

    const ticketMedioAlto = vendasCountAlto > 0 ? valorVendidoAlto / vendasCountAlto : 0;
    const ticketMedioMedio = vendasCountMedio > 0 ? valorVendidoMedio / vendasCountMedio : 0;
    const ticketMedioTotal = vendasTotal > 0 ? valorVendidoTotal / vendasTotal : 0;

    const agendPorVendaAlto = vendasCountAlto > 0 ? agendAlto / vendasCountAlto : 0;
    const agendPorVendaMedio = vendasCountMedio > 0 ? agendMedio / vendasCountMedio : 0;
    const agendPorVendaTotal = vendasTotal > 0 ? agendTotal / vendasTotal : 0;

    const reunioesPorVendaAlto = vendasCountAlto > 0 ? reunAlto / vendasCountAlto : 0;
    const reunioesPorVendaMedio = vendasCountMedio > 0 ? reunMedio / vendasCountMedio : 0;
    const reunioesPorVendaTotal = vendasTotal > 0 ? reunTotal / vendasTotal : 0;

    const roiAlto = invAltoTotal > 0 ? comissaoAlto / invAltoTotal : 0;
    const roiMedio = invMedioTotal > 0 ? comissaoMedio / invMedioTotal : 0;
    const roiTotal = totalAnuncios > 0 ? comissaoTotal / totalAnuncios : 0;

    // 6. Roster de Operadores (AD:AE) - Join com SDRs
    const rosterMap = {};
    const rosterRaw = rawData.roster || [];
    rosterRaw.forEach(row => {
      if (!row || row.length < 2) return;
      const sdrName = String(row[0] || '').trim();
      const status = String(row[1] || 'Ativo').trim();
      if (sdrName !== '') {
        rosterMap[sdrName.toLowerCase()] = status;
      }
    });

    // 7. SDRs (bloco SDR U:Y)
    const sdrsPerformanceRaw = rawData.sdrPerformance || [];
    const sdrsMap = {}; // nome -> { leadsRecebidos, leadsAgendados, reunioes }

    sdrsPerformanceRaw.forEach(row => {
      if (!row || row.length < 5) return;
      const mesNome = String(row[0]).trim();
      const sdrName = String(row[1]).trim();
      
      if (sdrName === '' || mesNome === '') return;

      const limits = this.getMonthLimits(mesNome);
      if (!limits) return;

      const diasNoMes = limits.end.getDate();
      const overlapDays = this.getOverlapDays(limits.start, limits.end, startDate, endDate);

      if (overlapDays > 0) {
        const proporcao = overlapDays / diasNoMes;
        
        if (!sdrsMap[sdrName]) {
          sdrsMap[sdrName] = {
            leadsRecebidos: 0,
            leadsAgendados: 0,
            reunioes: 0
          };
        }
        
        sdrsMap[sdrName].leadsRecebidos += proporcao * this.parseCellNumber(row[2]);
        sdrsMap[sdrName].leadsAgendados += proporcao * this.parseCellNumber(row[3]);
        sdrsMap[sdrName].reunioes += proporcao * this.parseCellNumber(row[4]);
      }
    });

    // Incluir SDRs presentes nas vendas mas ausentes de SDR Performance no período
    vendasFiltradas.forEach(v => {
      if (!sdrsMap[v.sdr]) {
        sdrsMap[v.sdr] = {
          leadsRecebidos: 0,
          leadsAgendados: 0,
          reunioes: 0
        };
      }
    });

    const sdrsList = Object.keys(sdrsMap).map(name => {
      const perf = sdrsMap[name];
      const salesCount = sdrSalesCount[name] || 0;
      
      const custoLeadEnviado = perf.leadsRecebidos * custoPorLeadTotal;
      const custoPorReuniao = perf.reunioes > 0 ? custoLeadEnviado / perf.reunioes : 0;
      const taxaAgendamento = perf.leadsRecebidos > 0 ? perf.leadsAgendados / perf.leadsRecebidos : 0;

      // Join com o roster
      const status = rosterMap[name.toLowerCase()] || '—';

      return {
        sdr: name,
        status: status,
        leadsRecebidos: Math.round(perf.leadsRecebidos),
        leadsAgendados: Math.round(perf.leadsAgendados),
        reunioes: Math.round(perf.reunioes),
        vendas: salesCount,
        custoLeadEnviado,
        custoPorReuniao,
        taxaAgendamento
      };
    });

    // 7. Agrupamento Temporal para Gráfico (Serie Temporal)
    let finalGroupBy = groupBy;
    const startUtc = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endUtc = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    const totalDays = Math.round((endUtc - startUtc) / 86400000) + 1;

    if (groupBy === 'auto') {
      if (totalDays <= 31) {
        finalGroupBy = 'day';
      } else if (totalDays <= 180) {
        finalGroupBy = 'week';
      } else {
        finalGroupBy = 'month';
      }
    }

    const serieTemporal = this.gerarSerieTemporal(diarioFiltrado, startDate, endDate, finalGroupBy);

    // 8. Funil
    const funil = {
      leads: leadsTotal,
      agendamentos: agendTotal,
      reunioes: reunTotal,
      vendas: vendasTotal,
      taxaLeadAgend: leadsTotal > 0 ? agendTotal / leadsTotal : 0,
      taxaAgendReuniao: agendTotal > 0 ? reunTotal / agendTotal : 0,
      taxaReuniaoVenda: reunTotal > 0 ? vendasTotal / reunTotal : 0
    };

    // 9. Custos detalhados
    const custos = {
      anunciosAlto: invAltoTotal,
      anunciosMedio: invMedioTotal,
      contratacao: contratacaoTotal,
      telefonia: telefoniaTotal,
      ferramentas: ferramentasTotal,
      total: totalCustos
    };

    // 10. Resultados
    const resultado = {
      investido: totalCustos,
      comissaoRecebida: comissaoTotal,
      resultadoLiquido: comissaoTotal - totalCustos
    };

    // 11. Comparação com Período Anterior
    let leadsAnterior = 0;
    let variacaoLeads = 0;
    let periodoAnteriorLabel = '-';

    if (!isComparison) {
      const milisegundosPeriodo = endDate.getTime() - startDate.getTime();
      const endAnterior = new Date(startDate.getTime() - 86400000); // 1 dia antes da data de início
      const startAnterior = new Date(endAnterior.getTime() - milisegundosPeriodo);

      // Formatar datas para chamada recursiva
      const startAnteriorStr = this.formatLocalDate(startAnterior);
      const endAnteriorStr = this.formatLocalDate(endAnterior);

      const resultAnterior = this.calcularDashboard({
        startDateStr: startAnteriorStr,
        endDateStr: endAnteriorStr,
        groupBy: finalGroupBy,
        rawData,
        isComparison: true
      });

      leadsAnterior = resultAnterior.funil.leads;
      variacaoLeads = leadsAnterior > 0 ? (leadsTotal - leadsAnterior) / leadsAnterior : 0;
      periodoAnteriorLabel = `${startAnterior.getDate()}/${startAnterior.getMonth()+1} a ${endAnterior.getDate()}/${endAnterior.getMonth()+1}`;
    }

    return {
      meta: {
        startDate: startDateStr,
        endDate: endDateStr,
        commRate,
        groupBy: finalGroupBy,
        totalDays
      },
      funil,
      segmentos: {
        alto: {
          leads: leadsAlto,
          agendamentos: agendAlto,
          reunioes: reunAlto,
          vendas: vendasCountAlto,
          valorVendido: valorVendidoAlto,
          comissao: comissaoAlto,
          custoPorLead: custoPorLeadAlto,
          custoPorReuniao: custoPorReuniaoAlto,
          ticketMedio: ticketMedioAlto,
          agendPorVenda: agendPorVendaAlto,
          reunioesPorVenda: reunioesPorVendaAlto,
          roi: roiAlto
        },
        medio: {
          leads: leadsMedio,
          agendamentos: agendMedio,
          reunioes: reunMedio,
          vendas: vendasCountMedio,
          valorVendido: valorVendidoMedio,
          comissao: comissaoMedio,
          custoPorLead: custoPorLeadMedio,
          custoPorReuniao: custoPorReuniaoMedio,
          ticketMedio: ticketMedioMedio,
          agendPorVenda: agendPorVendaMedio,
          reunioesPorVenda: reunioesPorVendaMedio,
          roi: roiMedio
        },
        total: {
          leads: leadsTotal,
          agendamentos: agendTotal,
          reunioes: reunTotal,
          vendas: vendasTotal,
          valorVendido: valorVendidoTotal,
          comissao: comissaoTotal,
          custoPorLead: custoPorLeadTotal,
          custoPorReuniao: custoPorReuniaoTotal,
          ticketMedio: ticketMedioTotal,
          agendPorVenda: agendPorVendaTotal,
          reunioesPorVenda: reunioesPorVendaTotal,
          roi: roiTotal
        }
      },
      custos,
      resultado,
      vendas: vendasFiltradas, // Passa as vendas detalhadas para renderizar na tabela do dashboard
      sdrs: sdrsList,
      serieTemporal,
      comparacao: {
        periodoAnteriorLabel,
        leadsAnterior,
        variacaoLeads
      }
    };
  },

  // Agrupamento temporal do gráfico
  gerarSerieTemporal(diarioList, startDate, endDate, groupBy) {
    const labels = [];
    const leadsAlto = [];
    const leadsMedio = [];
    const leadsTotal = [];

    // Gerar chaves agrupadoras e intervalos
    if (groupBy === 'day') {
      const cur = new Date(startDate.getTime());
      while (cur <= endDate) {
        const dateStr = this.formatLocalDate(cur);
        const label = `${String(cur.getDate()).padStart(2, '0')}/${String(cur.getMonth() + 1).padStart(2, '0')}`;
        
        // Achar entrada
        const entry = diarioList.find(d => this.formatLocalDate(d.date) === dateStr);
        labels.push(label);
        leadsAlto.push(entry ? entry.leadsAlto : 0);
        leadsMedio.push(entry ? entry.leadsMedio : 0);
        leadsTotal.push(entry ? (entry.leadsAlto + entry.leadsMedio) : 0);
        
        cur.setDate(cur.getDate() + 1);
      }
    } 
    
    else if (groupBy === 'week') {
      // Dividir em intervalos de semanas (segunda a domingo ou a cada 7 dias)
      const cur = new Date(startDate.getTime());
      let weekIndex = 1;
      
      while (cur <= endDate) {
        const nextWeek = new Date(cur.getTime() + 6 * 86400000);
        const actualEnd = nextWeek > endDate ? endDate : nextWeek;
        
        const label = `Sem ${weekIndex++}`;
        
        // Sum values in this range
        let sumAlto = 0, sumMedio = 0;
        diarioList.forEach(d => {
          if (d.date >= cur && d.date <= actualEnd) {
            sumAlto += d.leadsAlto;
            sumMedio += d.leadsMedio;
          }
        });

        labels.push(label);
        leadsAlto.push(sumAlto);
        leadsMedio.push(sumMedio);
        leadsTotal.push(sumAlto + sumMedio);

        cur.setDate(cur.getDate() + 7);
      }
    } 
    
    else if (groupBy === 'month') {
      const cur = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      const endLimit = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
      
      const sigMeses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

      while (cur <= endLimit) {
        const m = cur.getMonth();
        const y = cur.getFullYear();
        const label = `${sigMeses[m]}/${String(y).substring(2)}`;
        
        const mStart = new Date(y, m, 1, 0, 0, 0);
        const mEnd = new Date(y, m + 1, 0, 23, 59, 59);
        
        // Limitar overlap com o filtro
        const curStart = mStart < startDate ? startDate : mStart;
        const curEnd = mEnd > endDate ? endDate : mEnd;

        let sumAlto = 0, sumMedio = 0;
        diarioList.forEach(d => {
          if (d.date >= curStart && d.date <= curEnd) {
            sumAlto += d.leadsAlto;
            sumMedio += d.leadsMedio;
          }
        });

        labels.push(label);
        leadsAlto.push(sumAlto);
        leadsMedio.push(sumMedio);
        leadsTotal.push(sumAlto + sumMedio);

        cur.setMonth(cur.getMonth() + 1);
      }
    }

    // Gerar séries acumuladas
    const leadsAltoAcc = [];
    const leadsMedioAcc = [];
    const leadsTotalAcc = [];

    let accAlto = 0, accMedio = 0, accTot = 0;
    for (let i = 0; i < labels.length; i++) {
      accAlto += leadsAlto[i];
      accMedio += leadsMedio[i];
      accTot += leadsTotal[i];
      
      leadsAltoAcc.push(accAlto);
      leadsMedioAcc.push(accMedio);
      leadsTotalAcc.push(accTot);
    }

    return {
      labels,
      leadsAlto,
      leadsMedio,
      leadsTotal,
      leadsAltoAcc,
      leadsMedioAcc,
      leadsTotalAcc
    };
  },

  // Retorna um objeto de resultado zerado para tratar dados não carregados
  emptyDashboardResult() {
    return {
      meta: { commRate: Config.COMMISSION_DEFAULT, totalDays: 0, groupBy: 'day' },
      funil: { leads: 0, agendamentos: 0, reunioes: 0, vendas: 0, taxaLeadAgend: 0, taxaAgendReuniao: 0, taxaReuniaoVenda: 0 },
      segmentos: {
        alto: this.emptySegmentResult(),
        medio: this.emptySegmentResult(),
        total: this.emptySegmentResult()
      },
      custos: { anunciosAlto: 0, anunciosMedio: 0, contratacao: 0, telefonia: 0, ferramentas: 0, total: 0 },
      resultado: { investido: 0, comissaoRecebida: 0, resultadoLiquido: 0 },
      vendas: [],
      sdrs: [],
      serieTemporal: { labels: [], leadsAlto: [], leadsMedio: [], leadsTotal: [], leadsAltoAcc: [], leadsMedioAcc: [], leadsTotalAcc: [] },
      comparacao: { periodoAnteriorLabel: '-', leadsAnterior: 0, variacaoLeads: 0 }
    };
  },

  emptySegmentResult() {
    return {
      leads: 0, agendamentos: 0, reunioes: 0, vendas: 0, valorVendido: 0, comissao: 0,
      custoPorLead: 0, custoPorReuniao: 0, ticketMedio: 0, agendPorVenda: 0, reunioesPorVenda: 0, roi: 0
    };
  }
};

// Exportação universal para Node.js e Navegador
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Engine;
} else {
  window.Engine = Engine;
}
