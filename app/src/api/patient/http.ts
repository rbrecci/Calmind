import type { PatientApi } from './types.ts';

export type PatientRequest = <T>(method: string, path: string, body?: unknown) => Promise<T>;

function queryPath(path: string, query?: object): string {
  const params = Object.entries(query ?? {})
    .filter(([, value]) => value !== undefined && value !== false)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value === true ? '1' : String(value))}`);
  return params.length ? `${path}?${params.join('&')}` : path;
}

export function createPatientHttp(request: PatientRequest): PatientApi {
  return {
    currentConsent: () => request('GET', '/consent-terms/current?type=general'),
    acceptConsent: (id) => request('POST', '/consent-acceptances', { consent_term_id: id }),
    bonds: (query) => request('GET', queryPath('/patient/bonds', query)),
    redeemInvitation: (code) => request('POST', '/patient/bonds/redeem-invitation', { code }),
    requestBond: (id) => request('POST', '/patient/bonds/requests', { psychologist_id: id }),
    endBond: (id) => request('POST', `/bonds/${id}/end`),
    catalogPsychologists: (query) => request('GET', queryPath('/catalog/psychologists', query)),
    reports: (query) => request('GET', queryPath('/patient/reports', query)),
    createReport: (input) => request('POST', '/patient/reports', input),
    changeVisibility: (id, visibility) => request('PATCH', `/patient/reports/${id}`, { visibility }),
    unpublishReport: (id) => request('POST', `/patient/reports/${id}/unpublish`),
    tasks: (query) => request('GET', queryPath('/patient/tasks', query)),
    completeTask: (id) => request('POST', `/patient/tasks/${id}/complete`),
    messages: (id, query) => request('GET', queryPath(`/bonds/${id}/messages`, query)),
    sendMessage: (id, body) => request('POST', `/bonds/${id}/messages`, { body }),
    readMessages: (id) => request('POST', `/bonds/${id}/messages/read`),
    appointments: (query) => request('GET', queryPath('/patient/appointments', query)),
    notifications: (query) => request('GET', queryPath('/notifications', query)),
    readNotification: (id) => request('POST', `/notifications/${id}/read`),
    readAllNotifications: () => request('POST', '/notifications/read-all'),
  };
}
