import { getAuthToken } from './auth-token.ts';
import { ApiError, type Api, type FieldErrors, type User } from './types.ts';

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  // Lida aqui, e não no topo do arquivo, para o app abrir com USE_MOCK=true sem precisar de URL.
  const baseUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new Error('EXPO_PUBLIC_API_URL não definida. Veja app/.env.example.');
  }

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
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
};
