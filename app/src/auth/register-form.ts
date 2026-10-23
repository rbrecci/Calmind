import { ApiError, type FieldErrors, type RegisterInput, type Role } from '../api/types.ts';

export type RegisterForm = {
  role: Role;
  name: string;
  email: string;
  birthDate: string;
  password: string;
  confirmPassword: string;
  guardianName: string;
  guardianPhone: string;
  guardianRelationship: string;
};

const REQUIRED = 'Este campo é obrigatório.';

export function toIsoDate(value: string): string {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  return match ? `${match[3]}-${match[2]}-${match[1]}` : value.trim();
}

// Anos completos em `today`, ou null se o texto não for uma data real. A regra de idade
// mínima é do servidor (RNF-57); aqui a idade só decide se os campos do responsável aparecem.
function ageOn(value: string, today: Date): number | null {
  const iso = toIsoDate(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const date = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== iso) return null;
  const birthdayPassed = today.getUTCMonth() > date.getUTCMonth()
    || (today.getUTCMonth() === date.getUTCMonth() && today.getUTCDate() >= date.getUTCDate());
  return today.getUTCFullYear() - date.getUTCFullYear() - (birthdayPassed ? 0 : 1);
}

export function isMinor(birthDate: string, today: Date = new Date()): boolean {
  const age = ageOn(birthDate, today);
  return age !== null && age >= 12 && age < 18;
}

export function validateRegisterForm(form: RegisterForm, today: Date = new Date()): FieldErrors {
  const errors: FieldErrors = {};

  if (!form.name.trim()) errors.name = [REQUIRED];
  if (!form.email.trim()) errors.email = [REQUIRED];
  else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = ['Informe um e-mail válido.'];

  if (!form.password) errors.password = [REQUIRED];
  else if (form.password.length < 8) errors.password = ['A senha deve ter pelo menos 8 caracteres.'];
  else if (form.password !== form.confirmPassword) errors.confirm_password = ['As senhas não conferem.'];

  if (form.role === 'patient') {
    if (!form.birthDate.trim()) errors.birth_date = [REQUIRED];
    else if (ageOn(form.birthDate, today) === null) errors.birth_date = ['Informe a data no formato DD/MM/AAAA.'];

    if (isMinor(form.birthDate, today)) {
      if (!form.guardianName.trim()) errors.guardian_name = [REQUIRED];
      if (!form.guardianPhone.trim()) errors.guardian_phone = [REQUIRED];
      if (!form.guardianRelationship.trim()) errors.guardian_relationship = [REQUIRED];
    }
  }

  return errors;
}

export function buildRegisterInput(form: RegisterForm, today: Date = new Date()): RegisterInput {
  const base = { name: form.name, email: form.email, password: form.password, role: form.role };
  if (form.role !== 'patient') return base;

  const patient = { ...base, birth_date: toIsoDate(form.birthDate) };
  if (!isMinor(form.birthDate, today)) return patient;

  return {
    ...patient,
    guardian_name: form.guardianName,
    guardian_phone: form.guardianPhone,
    guardian_relationship: form.guardianRelationship,
  };
}

// 401 no login fica genérico de propósito: não revela se o e-mail existe (contrato 2.3).
// 422 aponta para os campos marcados; os demais códigos trazem mensagem própria da API.
export function authErrorMessage(flow: 'login' | 'register', error: unknown): string {
  if (error instanceof ApiError) {
    if (flow === 'login' && error.status === 401) {
      return 'Não foi possível entrar. Confira o e-mail e a senha e tente de novo.';
    }
    if (error.status === 422) return 'Confira os campos destacados e tente de novo.';
    return error.message;
  }
  return flow === 'login' ? 'Não foi possível entrar. Tente novamente.' : 'Não foi possível criar a conta. Tente novamente.';
}
