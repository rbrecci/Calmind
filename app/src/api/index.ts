import { httpApi } from './http.ts';
import { mockApi } from './mock.ts';
import type { Api } from './types.ts';

// A chave liga/desliga: as telas importam `api` daqui e nunca sabem qual está ativa.
// O Expo só embute no app variáveis que começam com EXPO_PUBLIC_.
const useMock = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

export const api: Api = useMock ? mockApi : httpApi;

export { setAuthToken } from './auth-token.ts';
export { ApiError } from './types.ts';
export type { FieldErrors, LoginInput, RegisterInput, Role, User, UserRole } from './types.ts';
