import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { api, ApiError, setAuthToken, type LoginInput, type Role } from '@/api';
import { restoreSession } from '@/session/restore-session';
import { secureTokenStorage } from '@/session/token-storage';

type SessionValue = {
  role: Role | null;
  // true até o app saber se há uma sessão guardada para restaurar.
  isLoading: boolean;
  signIn: (credentials: LoginInput) => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    restoreSession(secureTokenStorage, api)
      .then((restored) => {
        if (!cancelled) setRole(restored);
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
      const user = await api.me();
      if (user.role === 'admin') {
        // O admin usa só o painel web; o app não tem árvore de telas para ele.
        throw new ApiError(403, 'Este perfil acessa a plataforma pelo painel web.');
      }

      try {
        await secureTokenStorage.save(token);
      } catch {
        // Sem como guardar no aparelho, a sessão vale só até fechar o app; não bloqueia o login.
      }
      setRole(user.role);
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
    setRole(null);
  }, []);

  const value = useMemo(
    () => ({ role, isLoading, signIn, signOut }),
    [role, isLoading, signIn, signOut],
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
