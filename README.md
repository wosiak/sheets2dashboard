# 📊 BI Dashboard - Planilhas em Tempo Real

Dashboard de Business Intelligence que conecta com Google Sheets e exibe dados em tempo real com gráficos interativos.

## 🚀 Funcionalidades

- **Conexão com Google Sheets** - Dados em tempo real
- **Filtros por Período** - Hoje, Ontem, Semana, Mês
- **Filtros por Vendedor** - Visualização individual ou geral
- **Gráficos Interativos** - Leads, Cotações, Follow Up por vendedor
- **Métricas em Tempo Real** - Totais calculados automaticamente
- **Interface Responsiva** - Funciona em desktop e TV
- **Modo TV** - Otimizado para exibição em telas grandes

## 🛠️ Tecnologias

- **React 18** - Framework frontend
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Estilização
- **Recharts** - Gráficos interativos
- **React Query** - Gerenciamento de estado e cache
- **Axios** - Requisições HTTP
- **Google Sheets API** - Integração com planilhas

## 📦 Instalação

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Google Sheets API Key

### Setup Local

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/spreadsheets-bi.git
cd spreadsheets-bi
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env.local
```

Edite o arquivo `.env.local` com suas configurações:
```env
VITE_GOOGLE_SHEETS_API_KEY=sua_api_key_aqui
VITE_SPREADSHEET_VENDAS_ID=id_da_planilha_vendas
VITE_SHEET_VENDAS_NAME=nome_da_aba
```

4. **Execute o projeto**
```bash
npm run dev
```

Acesse: http://localhost:5173

## 🔧 Configuração do Google Sheets

### 1. Criar API Key
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione existente
3. Ative a Google Sheets API
4. Crie credenciais (API Key)
5. Configure restrições de segurança

### 2. Configurar Planilha
1. Compartilhe a planilha publicamente (qualquer pessoa com link pode visualizar)
2. Copie o ID da planilha da URL
3. Configure as variáveis de ambiente

## 📊 Estrutura das Planilhas

O dashboard espera as seguintes colunas (A-I):
- **A:** DATA (formato DD/MM/YYYY)
- **B:** VENDEDOR
- **C:** ATENDIMENTO TEL
- **D:** ATENDIMENTO WATS
- **E:** QUALIFICAÇÃO
- **F:** COTAÇÃO DIÁRIA
- **G:** LIGAÇÃO DIÁRIA
- **H:** FOLLOW UP
- **I:** LEADS

## 🚀 Deploy

### Vercel (Recomendado)
1. Conecte seu repositório GitHub ao Vercel
2. Configure as variáveis de ambiente no painel do Vercel
3. Deploy automático a cada push

### Netlify
1. Conecte seu repositório GitHub ao Netlify
2. Configure as variáveis de ambiente
3. Build command: `npm run build`
4. Publish directory: `dist`

### Render
1. Conecte seu repositório GitHub ao Render
2. Configure como Static Site
3. Build command: `npm run build`
4. Publish directory: `dist`

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── charts/          # Componentes de gráficos
│   ├── Dashboard.tsx    # Dashboard principal
│   ├── FilterBar.tsx    # Filtros
│   └── MetricCard.tsx   # Cards de métricas
├── config/
│   └── dashboards.ts    # Configuração dos dashboards
├── services/
│   └── googleSheetsService.ts  # Serviço Google Sheets
├── types/
│   └── index.ts         # Tipos TypeScript
└── App.tsx              # Componente raiz
```

## 🔒 Segurança

- **API Keys** são armazenadas em variáveis de ambiente
- **Arquivos .env** não são commitados no GitHub
- **Planilhas** devem ser compartilhadas apenas para visualização
- **CORS** configurado para domínios específicos

## 📈 Roadmap

- [ ] Múltiplas planilhas (ADM, RH, Financeiro, etc.)
- [ ] Gráficos de tendência temporal
- [ ] Exportação de relatórios
- [ ] Notificações em tempo real
- [ ] Modo offline com cache
- [ ] Autenticação de usuários

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para dúvidas ou suporte, abra uma issue no GitHub ou entre em contato.

---

**Desenvolvido com ❤️ para dashboards profissionais**
