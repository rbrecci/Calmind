import type { CatalogPsychologist, PatientTask } from '../types.ts';

export type PageQuery = { page?: number; per_page?: number };
export type Page<T> = { data: T[]; meta: { total: number; page: number; per_page: number } };
export type ConsentTerm = {
  id: number; type: 'general'; version: string; body: string;
  effective_from: string; accepted: boolean;
};
export type ConsentAcceptance = {
  id: number; consent_term_id: number; type: 'general'; version: string;
  accepted_at: string; revoked_at: string | null;
};
export type BondStatus = 'active' | 'pending' | 'ended';
export type BondResult = {
  id: number; status: BondStatus; origin: 'catalog' | 'invitation';
  psychologist_id: number; patient_user_id: number;
  requested_at: string; responded_at: string | null; ended_at: string | null;
};
export type PatientBond = Omit<BondResult, 'psychologist_id' | 'patient_user_id'> & {
  psychologist: { id: number; name: string; crp: string }; unread_messages: number;
};
export type Visibility = 'shared' | 'private';
export type PatientReport = {
  id: number; body: string; visibility: Visibility; unpublished_at: string | null;
  created_at: string; used_in_analysis: boolean;
};
export type Message = {
  id: number; bond_id: number; sender_user_id: number; mine: boolean;
  body: string; sent_at: string; read_at: string | null;
};
export type Appointment = {
  id: number; bond_id: number; scheduled_at: string;
  status: 'scheduled' | 'rescheduled' | 'cancelled' | 'done';
  modality: 'online' | 'presencial' | null; notes: string | null; created_at: string;
  psychologist: { id: number; name: string };
};
export type PatientNotification = {
  id: number; type: string; resource_id: number; created_at: string; read_at: string | null;
};
export type PatientScenario = 'com-vinculo' | 'sem-vinculo' | 'vinculo-pendente';
export type PatientApi = {
  currentConsent(): Promise<ConsentTerm>;
  acceptConsent(id: number): Promise<ConsentAcceptance>;
  bonds(query?: PageQuery): Promise<Page<PatientBond>>;
  redeemInvitation(code: string): Promise<BondResult>;
  requestBond(psychologistId: number): Promise<BondResult>;
  endBond(id: number): Promise<BondResult>;
  catalogPsychologists(query?: PageQuery): Promise<Page<CatalogPsychologist>>;
  reports(query?: PageQuery): Promise<Page<PatientReport>>;
  createReport(input: { body: string; visibility?: Visibility }): Promise<PatientReport>;
  changeVisibility(id: number, visibility: Visibility): Promise<PatientReport>;
  unpublishReport(id: number): Promise<PatientReport>;
  tasks(query?: PageQuery): Promise<Page<PatientTask>>;
  completeTask(id: number): Promise<PatientTask>;
  messages(bondId: number, query?: PageQuery & { after_id?: number }): Promise<Page<Message>>;
  sendMessage(bondId: number, body: string): Promise<Message>;
  readMessages(bondId: number): Promise<{ read: number }>;
  appointments(query?: PageQuery & { from?: string; to?: string }): Promise<Page<Appointment>>;
  notifications(query?: PageQuery & { unread?: boolean }): Promise<Page<PatientNotification>>;
  readNotification(id: number): Promise<PatientNotification>;
  readAllNotifications(): Promise<{ read: number }>;
};
