import { getAuthToken } from '../auth-token.ts';
import { ApiError, type FieldErrors } from '../types.ts';
import type { Profile, PsychologistApi, RegistrationInput } from './types.ts';

type Request = <T>(method: string, path: string, body?: unknown) => Promise<T>;

function query(path: string, params?: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null) search.set(key, String(value));
  }
  return search.size ? `${path}?${search}` : path;
}

export async function submitRegistration(input: RegistrationInput, fetcher: typeof fetch = fetch): Promise<Profile> {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!baseUrl) throw new Error('EXPO_PUBLIC_API_URL não definida. Veja app/.env.example.');
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const body = new FormData();
  body.append('crp_region', input.crp_region);
  body.append('crp_number', input.crp_number);
  if (input.document.file) body.append('document', input.document.file, input.document.name);
  else {
    // React Native aceita URI local, enquanto o DOM tipa esta parte como Blob.
    body.append('document', { uri: input.document.uri, name: input.document.name, type: input.document.mimeType ?? 'application/octet-stream' } as unknown as Blob);
  }
  let response: Response;
  try {
    response = await fetcher(`${baseUrl}/psychologist/registration`, { method: 'POST', headers, body });
  } catch {
    throw new ApiError(0, 'Sem conexão com o servidor. Verifique sua internet.');
  }
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = (payload ?? {}) as { message?: string; errors?: FieldErrors };
    throw new ApiError(response.status, error.message ?? 'Não foi possível concluir a ação. Tente novamente.', error.errors);
  }
  return payload as Profile;
}

export function createPsychologistHttp(request: Request): PsychologistApi {
  return {
    profile: () => request('GET', '/psychologist/profile'),
    updateProfile: (input) => request('PUT', '/psychologist/profile', input),
    publishProfile: () => request('POST', '/psychologist/profile/publish'),
    submitRegistration: (input) => submitRegistration(input),
    patients: (params) => request('GET', query('/psychologist/patients', params)),
    patient: (id) => request('GET', `/psychologist/patients/${id}`),
    bondRequests: (params) => request('GET', query('/psychologist/bond-requests', params)),
    acceptBondRequest: (id) => request('POST', `/psychologist/bond-requests/${id}/accept`),
    rejectBondRequest: (id) => request('POST', `/psychologist/bond-requests/${id}/reject`),
    createInvitation: () => request('POST', '/psychologist/invitations'),
    revokeInvitation: (id) => request('DELETE', `/psychologist/invitations/${id}`),
    endBond: (id) => request('POST', `/bonds/${id}/end`),
    reports: (id, params) => request('GET', query(`/psychologist/patients/${id}/reports`, params)),
    tasks: (params) => request('GET', query('/psychologist/tasks', params)),
    createTask: (input) => request('POST', '/psychologist/tasks', input),
    updateTask: (id, input) => request('PUT', `/psychologist/tasks/${id}`, input),
    archiveTask: (id) => request('DELETE', `/psychologist/tasks/${id}`),
    messages: (id, params) => request('GET', query(`/bonds/${id}/messages`, params)),
    sendMessage: (id, body) => request('POST', `/bonds/${id}/messages`, { body }),
    readMessages: (id) => request('POST', `/bonds/${id}/messages/read`),
    appointments: (params) => request('GET', query('/psychologist/appointments', params)),
    createAppointment: (input) => request('POST', '/psychologist/appointments', input),
    updateAppointment: (id, input) => request('PUT', `/psychologist/appointments/${id}`, input),
    cancelAppointment: (id) => request('POST', `/psychologist/appointments/${id}/cancel`),
    notifications: (params) => request('GET', query('/notifications', params)),
    readNotification: (id) => request('POST', `/notifications/${id}/read`),
    readAllNotifications: () => request('POST', '/notifications/read-all'),
    currentConsent: () => request('GET', '/consent-terms/current?type=general'),
    acceptConsent: (id) => request('POST', '/consent-acceptances', { consent_term_id: id }),
    guardianConsents: (id, params) => request('GET', query(`/psychologist/patients/${id}/guardian-consent`, params)),
    createGuardianConsent: (id, input) => request('POST', `/psychologist/patients/${id}/guardian-consent`, input),
  };
}
