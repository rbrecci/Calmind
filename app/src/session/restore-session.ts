import { setAuthToken } from '../api/auth-token.ts';
import { ApiError, type Api, type Role } from '../api/types.ts';

// Onde o token mora entre uma abertura do app e outra. A implementação real, em
// token-storage.ts, usa o armazenamento seguro do aparelho (RNF-07).
export type TokenStorage = {
  load(): Promise<string | null>;
  save(token: string): Promise<void>;
  clear(): Promise<void>;
};

// Ao abrir o app: se há token guardado, pergunta ao servidor quem é o dono e devolve o papel.
// Devolve null quando é preciso pedir login de novo.
export async function restoreSession(storage: TokenStorage, api: Api): Promise<Role | null> {
  const token = await storage.load();
  if (!token) return null;

  setAuthToken(token);
  try {
    const user = await api.me();
    // O admin usa só o painel web; o app não tem tela para ele, então o token não serve aqui.
    if (user.role !== 'admin') return user.role;
  } catch (error) {
    // Sem rede ou erro do servidor: não dá para saber se o token ainda vale. Ele continua
    // guardado e o app pede login agora; na próxima abertura tenta de novo.
    if (!(error instanceof ApiError) || error.status !== 401) {
      setAuthToken(null);
      return null;
    }
  }

  // Token expirado, revogado ou de perfil que o app não atende: apagar.
  setAuthToken(null);
  await storage.clear();
  return null;
}
