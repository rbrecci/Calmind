// Guarda o token da sessão para o cliente HTTP e o mock lerem.
// Só em memória: o armazenamento seguro (Keychain/Keystore, RNF-07) entra numa etapa própria
// e passa a chamar setAuthToken ao abrir o app.
let authToken: string | null = null;

export function getAuthToken(): string | null {
  return authToken;
}

export function setAuthToken(token: string | null): void {
  authToken = token;
}
