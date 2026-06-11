// Este arquivo foi esvaziado pois a autenticação foi migrada para o Backend usando Conta de Serviço.
// Todas as credenciais e chamadas do Google API são resolvidas diretamente no servidor.
const Auth = {
  isAuthorized() { return true; },
  hasCredentials() { return true; },
  getClientId() { return ''; },
  getSpreadsheetId() { return ''; },
  saveCredentials() {},
  setupTokenClient(callback) { if (callback) callback(true); },
  login() {},
  logout() {}
};
window.Auth = Auth;
