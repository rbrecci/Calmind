export type ConsentGateState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; accepted: boolean };

export function decideConsentGate(state: ConsentGateState): 'loading' | 'error' | 'consent' | 'allow' {
  if (state.status !== 'ready') return state.status;
  return state.accepted ? 'allow' : 'consent';
}
