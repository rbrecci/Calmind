import { request } from '../http.ts';
import { createPatientHttp } from './http.ts';
import { createPatientMock } from './mock.ts';
import type { PatientScenario } from './types.ts';

const scenarioValue = process.env.EXPO_PUBLIC_MOCK_SCENARIO;
const scenario: PatientScenario = scenarioValue === 'sem-vinculo' || scenarioValue === 'vinculo-pendente'
  ? scenarioValue : 'com-vinculo';

export const patientApi = process.env.EXPO_PUBLIC_USE_MOCK === 'true'
  ? createPatientMock({ scenario }) : createPatientHttp(request);
export type { PatientApi } from './types.ts';
