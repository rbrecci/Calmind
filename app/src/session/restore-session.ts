import { setAuthToken } from '../api/auth-token.ts';
import { ApiError, type Api, type Role, type User } from '../api/types.ts';

// Onde o token mora entre uma abertura do app e outra. A implementação real, em
// token-storage.ts, usa o armazenamento seguro do aparelho (RNF-07).
export type TokenStorage = {
  load(): Promise<string | null>;
  save(token: string): Promise<void>;
  clear(): Promise<void>;
};

// Quem está logado: o papel escolhe a árvore de telas; nome e foto vão para o avatar do cabeçalho,
// e a capa para a tela de perfil.
export type SessionUser = { role: Role; name: string; avatarUrl: string | null; coverUrl: string | null };

// O admin usa só o painel web; o app não tem tela para ele, então ele não vira sessão.
export function sessionUser(user: User): SessionUser | null {
  if (user.role === 'admin') return null;
  return { role: user.role, name: user.name, avatarUrl: user.avatar_url ?? null, coverUrl: user.cover_url ?? null };
}

// Ao abrir o app: se há token guardado, pergunta ao servidor quem é o dono e devolve papel e nome.
// Devolve null quando é preciso pedir login de novo.
export async function restoreSession(storage: TokenStorage, api: Api): Promise<SessionUser | null> {
  const token = await storage.load();
  if (!token) return null;

  setAuthToken(token);
  try {
    // Admin vira null e cai no apagar abaixo: o token dele não serve no app.
    const user = sessionUser(await api.me());
    if (user) return user;
  } catch (error) {
    // Sem rede ou erro do servidor: não dá para saber se o token ainda vale. Ele continua
    // guardado e o app pede login agora; na próxima abertura tenta de novo.
    // O 403 do /me é conta suspensa: o token não volta a valer e cai no apagar abaixo.
    if (!(error instanceof ApiError) || (error.status !== 401 && error.status !== 403)) {
      setAuthToken(null);
      return null;
    }
  }

  // Token expirado, revogado, de conta suspensa ou de perfil que o app não atende: apagar.
  setAuthToken(null);
  await storage.clear();
  return null;
}
