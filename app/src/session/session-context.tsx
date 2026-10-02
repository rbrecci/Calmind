import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { api, ApiError, setAuthToken, type LoginInput, type Role } from '@/api';

type SessionValue = {
  role: Role | null;
  signIn: (credentials: LoginInput) => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

// Sessão só em memória: o token no armazenamento seguro (RNF-07) entra numa etapa própria.
export function SessionProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);

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
    setRole(null);
  }, []);

  const value = useMemo(() => ({ role, signIn, signOut }), [role, signIn, signOut]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (value === null) {
    throw new Error('useSession precisa estar dentro de <SessionProvider>.');
  }
  return value;
}
