require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const { google } = require('googleapis');
const Config = require('./config');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;

// Middleware para parsear JSON
app.use(express.json());

// Inicializar Google Sheets API
let sheets = null;
let googleSheetsError = null;
const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID ? process.env.GOOGLE_SPREADSHEET_ID.trim() : null;

try {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    throw new Error('Service account email or private key missing in environment variables.');
  }

  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL.trim();
  const privateKey = process.env.GOOGLE_PRIVATE_KEY
    .trim()
    .replace(/\\n/g, '\n')
    .replace(/^"/, '')
    .replace(/"$/, '')
    .trim();

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: serviceAccountEmail,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  sheets = google.sheets({ version: 'v4', auth });
  console.log('[Sheets Engine] Google Sheets API initialized successfully.');
} catch (err) {
  googleSheetsError = err.message;
  console.warn('[Sheets Engine] Warning: Failed to initialize Google Sheets API:', err.message);
  console.warn('[Sheets Engine] Backend will run in fallback simulation mode using database.json');
}

// Banco de Dados Local (Fallback/Simulação)
const DB_FILE = path.join(process.cwd(), 'database.json');

async function readLocalDb() {
  try {
    const data = await fs.readFile(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('[DB] Error reading local database.json, generating default:', err.message);
    return {
      commission: 0.05,
      diario: {},
      vendas: [],
      custos: {},
      sdrPerformance: [],
      roster: []
    };
  }
}

async function writeLocalDb(db) {
  try {
    await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('[DB] Error writing to local database.json:', err.message);
  }
}

function formatLocalDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Tradução do formato JSON interno para matrizes do Sheets (para compatibilidade com front-end)
function formatLocalDbToSheets(db) {
  const commission = [[(db.commission || Config.COMMISSION_DEFAULT).toString()]];

  const roster = (db.roster || []).map(r => [r.sdr, r.status]);
  while (roster.length < 10) {
    roster.push(['', '']);
  }

  const diario = [];
  const base = new Date(2025, 11, 31); // 31/12/2025 como base (linha 2)
  for (let d = 0; d < 366; d++) {
    const curDate = new Date(base.getTime() + d * 86400000);
    const dateStr = formatLocalDate(curDate);
    const entry = (db.diario && db.diario[dateStr]) || { leadsAlto: 0, leadsMedio: 0, agendAlto: 0, agendMedio: 0, reunAlto: 0, reunMedio: 0 };
    
    const formattedDate = `${String(curDate.getDate()).padStart(2, '0')}/${String(curDate.getMonth() + 1).padStart(2, '0')}/${curDate.getFullYear()}`;
    diario.push([
      formattedDate,
      entry.leadsAlto.toString(),
      entry.leadsMedio.toString(),
      entry.agendAlto.toString(),
      entry.agendMedio.toString(),
      entry.reunAlto.toString(),
      entry.reunMedio.toString()
    ]);
  }

  const vendas = (db.vendas || []).map(v => {
    if (!v.data) return ['', '', '', ''];
    const pts = v.data.split('-');
    const formattedDate = `${pts[2]}/${pts[1]}/${pts[0]}`;
    return [formattedDate, v.sdr, v.segmento, v.valor.toString()];
  });
  while (vendas.length < 10) {
    vendas.push(['', '', '', '']);
  }

  const custos = Config.MESES_NOMES.map((nome, i) => {
    const key = `${Config.ANO_BASE}-${String(i + 1).padStart(2, '0')}`;
    const c = (db.custos && db.custos[key]) || { invAlto: 0, invMedio: 0, contratacao: 0, telefonia: 0, ferramentas: 0 };
    return [
      nome,
      c.invAlto.toString(),
      c.invMedio.toString(),
      c.contratacao.toString(),
      c.telefonia.toString(),
      c.ferramentas.toString()
    ];
  });

  const sdrPerformance = (db.sdrPerformance || []).map(s => [
    s.mes,
    s.sdr,
    s.leadsRecebidos.toString(),
    s.leadsAgendados.toString(),
    s.reunioes.toString()
  ]);
  while (sdrPerformance.length < 5) {
    sdrPerformance.push(['', '', '', '', '']);
  }

  return {
    commission,
    roster,
    diario,
    vendas,
    custos,
    sdrPerformance
  };
}

// ==========================================================================
// ENDPOINTS DA API
// ==========================================================================

// GET /api/status - Status da integração
app.get('/api/status', (req, res) => {
  res.json({
    spreadsheetConnected: !!sheets && !googleSheetsError,
    spreadsheetId: spreadsheetId || null,
    error: googleSheetsError || null
  });
});

// GET /api/data - Carrega todos os dados (Sheets com fallback para database.json)
app.get('/api/data', async (req, res) => {
  if (sheets && !googleSheetsError) {
    try {
      const ranges = [
        `Marketing!${Config.CONFIG_CELL}`,
        `Marketing!AD${Config.ROSTER_START_ROW}:AE100`,
        `Marketing!A${Config.DIARIO_START_ROW}:G366`,
        `Marketing!I${Config.VENDAS_START_ROW}:L1000`,
        `Marketing!N${Config.CUSTOS_START_ROW}:S${Config.CUSTOS_END_ROW}`,
        `Marketing!U${Config.SDR_START_ROW}:Y500`
      ];

      const response = await sheets.spreadsheets.values.batchGet({
        spreadsheetId,
        ranges,
      });

      const valueRanges = response.data.valueRanges || [];

      return res.json({
        commission: valueRanges[0]?.values || [[Config.COMMISSION_DEFAULT.toString()]],
        roster: valueRanges[1]?.values || [],
        diario: valueRanges[2]?.values || [],
        vendas: valueRanges[3]?.values || [],
        custos: valueRanges[4]?.values || [],
        sdrPerformance: valueRanges[5]?.values || []
      });
    } catch (err) {
      console.error('[Sheets API] Error during batchGet. Falling back to local db.', err.message);
    }
  }

  const db = await readLocalDb();
  const formatted = formatLocalDbToSheets(db);
  res.json(formatted);
});

function handleSheetsError(res, err, actionDescription) {
  const errorDetails = {
    message: err.message,
    code: err.code || err.status || null,
    response: err.response?.data || null,
    stack: err.stack
  };
  console.error(`[Sheets API Error] Failed to ${actionDescription}:`, JSON.stringify(errorDetails, null, 2));
  return res.status(500).json({
    error: true,
    message: `Erro ao ${actionDescription}: ${err.message}`,
    details: errorDetails
  });
}

// POST /api/daily - Atualiza movimento diário
app.post('/api/daily', async (req, res) => {
  const data = req.body;
  if (sheets && !googleSheetsError) {
    try {
      const line = Config.linhaDoDia(data.dateStr);
      const range = `Marketing!B${line}:G${line}`;
      const values = [[
        Number(data.leadsAlto),
        Number(data.leadsMedio),
        Number(data.agendAlto),
        Number(data.agendMedio),
        Number(data.reunAlto),
        Number(data.reunMedio)
      ]];

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values },
      });
      return res.json({ success: true });
    } catch (err) {
      return handleSheetsError(res, err, 'salvar movimento diário');
    }
  }

  const db = await readLocalDb();
  db.diario[data.dateStr] = {
    leadsAlto: Number(data.leadsAlto),
    leadsMedio: Number(data.leadsMedio),
    agendAlto: Number(data.agendAlto),
    agendMedio: Number(data.agendMedio),
    reunAlto: Number(data.reunAlto),
    reunMedio: Number(data.reunMedio)
  };
  await writeLocalDb(db);
  res.json({ success: true, local: true });
});

// POST /api/costs - Atualiza custos mensais
app.post('/api/costs', async (req, res) => {
  const data = req.body;
  if (sheets && !googleSheetsError) {
    try {
      const line = Config.linhaDoMesCusto(data.monthStr);
      const range = `Marketing!O${line}:S${line}`;
      const values = [[
        Number(data.invAlto),
        Number(data.invMedio),
        Number(data.contratacao),
        Number(data.telefonia),
        Number(data.ferramentas)
      ]];

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values },
      });
      return res.json({ success: true });
    } catch (err) {
      return handleSheetsError(res, err, 'salvar custos mensais');
    }
  }

  const db = await readLocalDb();
  db.custos[data.monthStr] = {
    invAlto: Number(data.invAlto),
    invMedio: Number(data.invMedio),
    contratacao: Number(data.contratacao),
    telefonia: Number(data.telefonia),
    ferramentas: Number(data.ferramentas)
  };
  await writeLocalDb(db);
  res.json({ success: true, local: true });
});

// POST /api/commission - Atualiza taxa de comissão
app.post('/api/commission', async (req, res) => {
  const { commission } = req.body;
  if (sheets && !googleSheetsError) {
    try {
      const range = `Marketing!${Config.CONFIG_CELL}`;
      const values = [[Number(commission)]];

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values },
      });
      return res.json({ success: true });
    } catch (err) {
      return handleSheetsError(res, err, 'salvar taxa de comissão');
    }
  }

  const db = await readLocalDb();
  db.commission = Number(commission);
  await writeLocalDb(db);
  res.json({ success: true, local: true });
});

// POST /api/sales - CRUD de Vendas
app.post('/api/sales', async (req, res) => {
  const { idOrRowIndex, saleData, action } = req.body;
  
  const formatDateBr = (dStr) => {
    const pts = dStr.split('-');
    return `${pts[2]}/${pts[1]}/${pts[0]}`;
  };

  if (sheets && !googleSheetsError) {
    try {
      if (action === 'add') {
        const readUrl = `Marketing!I${Config.VENDAS_START_ROW}:I1000`;
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: readUrl,
        });
        const rows = response.data.values || [];

        let targetRow = Config.VENDAS_START_ROW + rows.length;
        for (let i = 0; i < rows.length; i++) {
          if (!rows[i] || !rows[i][0] || rows[i][0].trim() === '') {
            targetRow = Config.VENDAS_START_ROW + i;
            break;
          }
        }

        const range = `Marketing!I${targetRow}:L${targetRow}`;
        const values = [[
          formatDateBr(saleData.dateStr),
          saleData.sdr,
          saleData.segmento,
          Number(saleData.valor)
        ]];

        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values },
        });
        return res.json({ success: true });
      } else if (action === 'edit') {
        const range = `Marketing!I${idOrRowIndex}:L${idOrRowIndex}`;
        const values = [[
          formatDateBr(saleData.dateStr),
          saleData.sdr,
          saleData.segmento,
          Number(saleData.valor)
        ]];

        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values },
        });
        return res.json({ success: true });
      } else if (action === 'delete') {
        const range = `Marketing!I${idOrRowIndex}:L${idOrRowIndex}`;
        await sheets.spreadsheets.values.clear({
          spreadsheetId,
          range,
        });
        return res.json({ success: true });
      }
    } catch (err) {
      return handleSheetsError(res, err, 'salvar venda');
    }
  }

  const db = await readLocalDb();
  if (action === 'add') {
    db.vendas.push({
      data: saleData.dateStr,
      sdr: saleData.sdr,
      segmento: saleData.segmento,
      valor: Number(saleData.valor)
    });
  } else if (action === 'edit') {
    const idx = Number(idOrRowIndex) - Config.VENDAS_START_ROW;
    if (idx >= 0 && idx < db.vendas.length) {
      db.vendas[idx] = {
        data: saleData.dateStr,
        sdr: saleData.sdr,
        segmento: saleData.segmento,
        valor: Number(saleData.valor)
      };
    }
  } else if (action === 'delete') {
    const idx = Number(idOrRowIndex) - Config.VENDAS_START_ROW;
    if (idx >= 0 && idx < db.vendas.length) {
      db.vendas[idx] = { data: '', sdr: '', segmento: '', valor: 0 };
    }
  }
  await writeLocalDb(db);
  res.json({ success: true, local: true });
});

// POST /api/operators - CRUD de Operadores (Roster)
app.post('/api/operators', async (req, res) => {
  const { idOrRowIndex, opData, action } = req.body;

  if (sheets && !googleSheetsError) {
    try {
      if (action === 'add') {
        const readUrl = `Marketing!AD${Config.ROSTER_START_ROW}:AD100`;
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: readUrl,
        });
        const rows = response.data.values || [];

        let targetRow = Config.ROSTER_START_ROW + rows.length;
        for (let i = 0; i < rows.length; i++) {
          if (!rows[i] || !rows[i][0] || rows[i][0].trim() === '') {
            targetRow = Config.ROSTER_START_ROW + i;
            break;
          }
        }

        const range = `Marketing!AD${targetRow}:AE${targetRow}`;
        const values = [[opData.sdr, 'Ativo']];

        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values },
        });
        return res.json({ success: true });
      } else if (action === 'edit_status') {
        const range = `Marketing!AE${idOrRowIndex}`;
        const values = [[opData.status]];

        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values },
        });
        return res.json({ success: true });
      } else if (action === 'delete') {
        const range = `Marketing!AD${idOrRowIndex}:AE${idOrRowIndex}`;
        await sheets.spreadsheets.values.clear({
          spreadsheetId,
          range,
        });
        return res.json({ success: true });
      }
    } catch (err) {
      return handleSheetsError(res, err, 'salvar operador');
    }
  }

  const db = await readLocalDb();
  if (action === 'add') {
    db.roster.push({ sdr: opData.sdr, status: 'Ativo' });
  } else if (action === 'edit_status') {
    const idx = Number(idOrRowIndex) - Config.ROSTER_START_ROW;
    if (idx >= 0 && idx < db.roster.length) {
      db.roster[idx].status = opData.status;
    }
  } else if (action === 'delete') {
    const idx = Number(idOrRowIndex) - Config.ROSTER_START_ROW;
    if (idx >= 0 && idx < db.roster.length) {
      db.roster[idx] = { sdr: '', status: '' };
    }
  }
  await writeLocalDb(db);
  res.json({ success: true, local: true });
});

// POST /api/sdr-performance - SDR Performance
app.post('/api/sdr-performance', async (req, res) => {
  const data = req.body;

  if (sheets && !googleSheetsError) {
    try {
      const readUrl = `Marketing!U${Config.SDR_START_ROW}:V500`;
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: readUrl,
      });
      const rows = response.data.values || [];

      let targetRow = -1;
      let firstEmptyRow = -1;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row && row[0] === data.monthName && row[1] === data.sdr) {
          targetRow = Config.SDR_START_ROW + i;
          break;
        }
        if (firstEmptyRow === -1 && (!row || !row[0] || row[0].trim() === '')) {
          firstEmptyRow = Config.SDR_START_ROW + i;
        }
      }

      if (targetRow === -1) {
        targetRow = firstEmptyRow !== -1 ? firstEmptyRow : Config.SDR_START_ROW + rows.length;
      }

      const range = `Marketing!U${targetRow}:Y${targetRow}`;
      const values = [[
        data.monthName,
        data.sdr,
        Number(data.leadsRecebidos),
        Number(data.leadsAgendados),
        Number(data.reunioes)
      ]];

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values },
      });
      return res.json({ success: true });
    } catch (err) {
      return handleSheetsError(res, err, 'salvar performance de SDR');
    }
  }

  const db = await readLocalDb();
  const idx = db.sdrPerformance.findIndex(s => s.mes === data.monthName && s.sdr === data.sdr);
  const newPerf = {
    mes: data.monthName,
    sdr: data.sdr,
    leadsRecebidos: Number(data.leadsRecebidos),
    leadsAgendados: Number(data.leadsAgendados),
    reunioes: Number(data.reunioes)
  };

  if (idx !== -1) {
    db.sdrPerformance[idx] = newPerf;
  } else {
    db.sdrPerformance.push(newPerf);
  }
  await writeLocalDb(db);
  res.json({ success: true, local: true });
});

// Servir a aplicação React construída (minafit)
const minafitDistPath = path.join(process.cwd(), 'apps', 'minafit', 'dist');
app.use(express.static(minafitDistPath));

// Servir arquivos estáticos do diretório raiz
app.use(express.static(process.cwd()));

// Rotas explícitas para as telas de marketing (compatibilidade Vercel cleanUrls)
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'dashboard.html'));
});

app.get('/formulario', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'formulario.html'));
});

app.get('/styles.css', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'styles.css'));
});

app.get('/sheets-api.js', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'sheets-api.js'));
});

app.get('/engine.js', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'engine.js'));
});

app.get('/config.js', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'config.js'));
});

app.get('/auth.js', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'auth.js'));
});

// Encaminhar todas as outras requisições para a index.html do React (ou fallback da raiz)
app.get('*', async (req, res) => {
  try {
    const reactIndex = path.join(minafitDistPath, 'index.html');
    await fs.access(reactIndex);
    return res.sendFile(reactIndex);
  } catch (err) {
    try {
      const rootIndex = path.join(process.cwd(), 'index.html');
      await fs.access(rootIndex);
      return res.sendFile(rootIndex);
    } catch (e) {
      return res.status(404).send('Servidor ativo. Para carregar o dashboard de vendas, compile o projeto React rodando "npm run build" na pasta do app.');
    }
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  Servidor Solyd Imob Ativo: http://localhost:${PORT}`);
    console.log(`  Pressione Ctrl+C para encerrar.`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
