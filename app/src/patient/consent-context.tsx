import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

import { patientApi } from '@/api/patient';
import type { ConsentTerm } from '@/api/patient/types';
import type { ConsentGateState } from './consent-gate';
import { errorMessage } from './presentation';

type ConsentContextValue = {
  state: ConsentGateState; term: ConsentTerm | null; reload: () => Promise<void>;
  accept: () => Promise<void>;
};
const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConsentGateState>({ status: 'loading' });
  const [term, setTerm] = useState<ConsentTerm | null>(null);
  const sequence = useRef(0);
  const reload = useCallback(async () => {
    const requestId = ++sequence.current;
    setState({ status: 'loading' });
    try {
      const current = await patientApi.currentConsent();
      if (requestId !== sequence.current) return;
      setTerm(current); setState({ status: 'ready', accepted: current.accepted });
    } catch (error) {
      if (requestId === sequence.current) setState({ status: 'error', message: errorMessage(error) });
    }
  }, []);
  useEffect(() => {
    let mounted = true;
    const requestId = ++sequence.current;
    patientApi.currentConsent().then((current) => {
      if (!mounted || requestId !== sequence.current) return;
      setTerm(current); setState({ status: 'ready', accepted: current.accepted });
    }).catch((error) => {
      if (mounted && requestId === sequence.current) setState({ status: 'error', message: errorMessage(error) });
    });
    return () => { mounted = false; };
  }, [reload]);
  async function accept() {
    if (!term) return;
    await patientApi.acceptConsent(term.id);
    await reload();
  }
  return <ConsentContext.Provider value={{ state, term, reload, accept }}>{children}</ConsentContext.Provider>;
}

export function useConsent() {
  const context = useContext(ConsentContext);
  if (!context) throw new Error('ConsentProvider ausente.');
  return context;
}
