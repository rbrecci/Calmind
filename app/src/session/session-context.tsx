import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { api, ApiError, setAuthToken, type LoginInput, type Role, type User } from '@/api';
import { restoreSession, sessionUser, type SessionUser } from '@/session/restore-session';
import { secureTokenStorage } from '@/session/token-storage';

type SessionValue = {
  role: Role | null;
  // Nome e foto de quem está logado, para o avatar do cabeçalho, e a capa da tela de perfil.
  // null sem sessão ou sem imagem.
  name: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  // true até o app saber se há uma sessão guardada para restaurar.
  isLoading: boolean;
  signIn: (credentials: LoginInput) => Promise<void>;
  signOut: () => Promise<void>;
  // Troca de foto ou capa devolve o usuário inteiro: com ele, o cabeçalho muda na hora.
  updateUser: (user: User) => void;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    restoreSession(secureTokenStorage, api)
      .then((restored) => {
        if (!cancelled) setUser(restored);
      })
      .catch(() => {
        // Falha ao ler o armazenamento: segue sem sessão, o usuário entra de novo.
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (credentials: LoginInput) => {
    const { token } = await api.login(credentials);
    setAuthToken(token);

    try {
      // O papel manda na navegação, e quem informa o papel é o /me, nunca a tela.
      const user = sessionUser(await api.me());
      if (!user) {
        // O admin usa só o painel web; o app não tem árvore de telas para ele.
        throw new ApiError(403, 'Este perfil acessa a plataforma pelo painel web.');
      }

      try {
        await secureTokenStorage.save(token);
      } catch {
        // Sem como guardar no aparelho, a sessão vale só até fechar o app; não bloqueia o login.
      }
      setUser(user);
    } catch (error) {
      setAuthToken(null);
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // Se o servidor não confirmar, o aparelho sai do mesmo jeito: o token local some abaixo.
    }
    setAuthToken(null);
    try {
      await secureTokenStorage.clear();
    } catch {
      // Token que não pôde ser apagado já não vale: o logout acima o revogou no servidor.
    }
    setUser(null);
  }, []);

  const updateUser = useCallback((next: User) => {
    const updated = sessionUser(next);
    // Sem sessão aberta não há o que atualizar: a resposta chegou depois de sair da conta.
    setUser((current) => current && updated);
  }, []);

  const value = useMemo(
    () => ({
      role: user?.role ?? null, name: user?.name ?? null, avatarUrl: user?.avatarUrl ?? null, coverUrl: user?.coverUrl ?? null,
      isLoading, signIn, signOut, updateUser,
    }),
    [user, isLoading, signIn, signOut, updateUser],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (value === null) {
    throw new Error('useSession precisa estar dentro de <SessionProvider>.');
  }
  return value;
}
