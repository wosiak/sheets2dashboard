const API_BASE = (window.location.protocol === 'file:' || !window.location.host)
  ? 'http://localhost:3000'
  : '';

const SheetsAPI = {
  // Helper interno para processar respostas e lançar erros detalhados
  async _handleResponse(response, defaultMsg) {
    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      const detailsMsg = errBody.details?.message || errBody.details?.response?.error?.message || errBody.message;
      const errMsg = detailsMsg ? `${detailsMsg}` : `${defaultMsg} (Status: ${response.status})`;
      const err = new Error(errMsg);
      err.response = errBody;
      throw err;
    }
    return await response.json();
  },

  // Retorna status da conexão com a planilha no backend
  async getBackendStatus() {
    try {
      const response = await fetch(`${API_BASE}/api/status`);
      if (!response.ok) throw new Error('Falha ao obter status do servidor');
      return await response.json();
    } catch (e) {
      console.error('[SheetsAPI] Erro ao buscar status do servidor:', e);
      return { spreadsheetConnected: false, error: e.message };
    }
  },

  // Lê todos os dados da planilha (ou mock no backend)
  async readAllData() {
    console.log('[SheetsAPI] Lendo dados do servidor...');
    const response = await fetch(`${API_BASE}/api/data`);
    if (!response.ok) {
      throw new Error(`Servidor respondeu com status: ${response.status}`);
    }
    return await response.json();
  },

  // Gravar Movimento Diário
  async saveDailyMovement(data) {
    const response = await fetch(`${API_BASE}/api/daily`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return SheetsAPI._handleResponse(response, 'Erro ao salvar movimento diário');
  },

  // Gravar Custos Mensais
  async saveCost(data) {
    const response = await fetch(`${API_BASE}/api/costs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return SheetsAPI._handleResponse(response, 'Erro ao salvar custos mensais');
  },

  // Gravar Comissão
  async saveCommissionRate(commission) {
    const response = await fetch(`${API_BASE}/api/commission`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commission })
    });
    return SheetsAPI._handleResponse(response, 'Erro ao salvar comissão');
  },

  // Gravar Venda (Add, Edit, Delete)
  async saveSale(idOrRowIndex, saleData, action) {
    const response = await fetch(`${API_BASE}/api/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idOrRowIndex, saleData, action })
    });
    return SheetsAPI._handleResponse(response, `Erro ao processar venda (${action})`);
  },

  // Salvar Operador no Roster (AD:AE)
  async saveOperator(idOrRowIndex, opData, action) {
    const response = await fetch(`${API_BASE}/api/operators`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idOrRowIndex, opData, action })
    });
    return SheetsAPI._handleResponse(response, `Erro ao processar operador (${action})`);
  },

  // Salvar SDR Performance Mensal (U:Y)
  async saveSDRPerformance(data) {
    const response = await fetch(`${API_BASE}/api/sdr-performance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return SheetsAPI._handleResponse(response, 'Erro ao salvar performance do SDR');
  }
};

window.SheetsAPI = SheetsAPI;
