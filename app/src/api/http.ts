import { getAuthToken } from './auth-token.ts';
import {
  ApiError, type Api, type CatalogList, type FieldErrors, type ImageUpload, type PatientTask, type PatientTaskList, type User,
} from './types.ts';

// Lida a cada chamada, e não no topo do arquivo, para o app abrir com USE_MOCK=true sem precisar de URL.
function apiUrl(path: string): string {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new Error('EXPO_PUBLIC_API_URL não definida. Veja app/.env.example.');
  }
  return `${baseUrl}${path}`;
}

// Cabeçalhos de quem pede uma imagem de rota autenticada (foto e capa). O aviso do ngrok vai junto
// porque, sem ele, o túnel responde uma página HTML no lugar da imagem.
export function imageHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  headers['ngrok-skip-browser-warning'] = '1';
  return headers;
}

export async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const url = apiUrl(path);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  return send<T>(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
}

// Envio de imagem em multipart, no campo `image`. Sem Content-Type: quem o escreve, com o
// boundary, é o próprio fetch.
export async function uploadImage<T>(path: string, image: ImageUpload): Promise<T> {
  const url = apiUrl(path);
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const body = new FormData();
  if (image.file) body.append('image', image.file, image.name);
  else {
    // React Native aceita URI local, enquanto o DOM tipa esta parte como Blob.
    body.append('image', { uri: image.uri, name: image.name, type: image.mimeType } as unknown as Blob);
  }
  return send<T>(url, { method: 'POST', headers, body });
}

async function send<T>(url: string, init: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    // Falha de rede: o fetch nem chegou a ter resposta, então não há status HTTP.
    throw new ApiError(0, 'Sem conexão com o servidor. Verifique sua internet.');
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const error = (payload ?? {}) as { message?: string; errors?: FieldErrors };
    throw new ApiError(
      response.status,
      error.message ?? 'Não foi possível concluir a ação. Tente novamente.',
      error.errors,
    );
  }

  return payload as T;
}

export const httpApi: Api = {
  register: (input) => request<{ user: User }>('POST', '/auth/register', input).then((r) => r.user),
  login: (input) => request<{ token: string }>('POST', '/auth/login', input),
  logout: () => request<unknown>('POST', '/auth/logout').then(() => undefined),
  me: () => request<User>('GET', '/me'),
  patientTasks: () => request<PatientTaskList>('GET', '/patient/tasks'),
  completePatientTask: (id) => request<PatientTask>('POST', `/patient/tasks/${id}/complete`),
  catalogPsychologists: () => request<CatalogList>('GET', '/catalog/psychologists'),
  uploadProfileImage: (kind, image) => uploadImage<User>(`/me/${kind}`, image),
  removeProfileImage: (kind) => request<User>('DELETE', `/me/${kind}`),
};
