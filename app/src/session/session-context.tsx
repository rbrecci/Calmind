import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

// Papéis que o app atende. O `admin` do schema.sql usa só o painel web.
export type Role = 'patient' | 'psychologist';

type SessionValue = {
  role: Role | null;
  signIn: (role: Role) => void;
  signOut: () => void;
};

const SessionContext = createContext<SessionValue | null>(null);

// Sessão mínima, só em memória: o papel virá do /me quando o módulo de API existir.
// O token no armazenamento seguro (RNF-07) entra numa etapa própria, não aqui.
export function SessionProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);

  const signIn = useCallback((next: Role) => setRole(next), []);
  const signOut = useCallback(() => setRole(null), []);

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
