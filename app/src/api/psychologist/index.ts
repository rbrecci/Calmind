import { request } from '../http.ts';
import { createPsychologistHttp } from './http.ts';
import { createPsychologistMock } from './mock.ts';

const useMock = process.env.EXPO_PUBLIC_USE_MOCK === 'true';
export const psychologistApi = useMock
  ? createPsychologistMock({ scenario: process.env.EXPO_PUBLIC_MOCK_SCENARIO })
  : createPsychologistHttp(request);
export type { PsychologistApi } from './types.ts';
