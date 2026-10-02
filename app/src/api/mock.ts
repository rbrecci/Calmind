import { getAuthToken } from './auth-token.ts';
import { ApiError, type Api, type FieldErrors, type User } from './types.ts';

// Mock do contrato (docs/api/contrato-api.md): devolve o mesmo formato, os mesmos códigos e as
// mesmas mensagens genéricas da API real. Só dado fictício, em qualquer ambiente (RNF-63).
//
// Contas de teste, as mesmas da coleção do Postman:
//   paciente@calmind.test   / senha-de-teste-123   (patient)
//   psicologo@calmind.test  / senha-de-teste-123   (psychologist)
//   admin@plataforma.local  / admin-de-teste-123   (admin, usa só o painel web)

type StoredUser = User & { password: string };

const SEED_USERS: StoredUser[] = [
  { id: 1, name: 'Paciente de Teste', email: 'paciente@calmind.test', password: 'senha-de-teste-123', role: 'patient' },
  { id: 2, name: 'Psicóloga de Teste', email: 'psicologo@calmind.test', password: 'senha-de-teste-123', role: 'psychologist' },
  { id: 3, name: 'Administrador', email: 'admin@plataforma.local', password: 'admin-de-teste-123', role: 'admin' },
];

const REQUIRED = 'Este campo é obrigatório.';

function validationError(errors: FieldErrors): ApiError {
  return new ApiError(422, 'Os dados informados são inválidos.', errors);
}

function missingFields(input: Record<string, string>): FieldErrors {
  const errors: FieldErrors = {};
  for (const [field, value] of Object.entries(input)) {
    if (!value || value.trim() === '') errors[field] = [REQUIRED];
  }
  return errors;
}

function publicUser({ password: _password, ...user }: StoredUser): User {
  return user;
}

export function createMockApi({ delayMs = 0 }: { delayMs?: number } = {}): Api {
  const users: StoredUser[] = SEED_USERS.map((user) => ({ ...user }));
  const sessions = new Map<string, number>(); // token -> id do usuário
  let nextUserId = users.length + 1;
  let nextTokenNumber = 1;

  const wait = () => new Promise<void>((resolve) => setTimeout(resolve, delayMs));
  const normalizeEmail = (email: string) => email.trim().toLowerCase();

  // Contrato 2.3: 401 para sem token, token inválido ou expirado.
  function authenticate(): { token: string; user: StoredUser } {
    const token = getAuthToken();
    const userId = token ? sessions.get(token) : undefined;
    const user = users.find((candidate) => candidate.id === userId);
    if (!token || !user) {
      throw new ApiError(401, 'Sessão inválida ou expirada. Entre novamente.');
    }
    return { token, user };
  }

  return {
    async register(input) {
      await wait();
      const errors = missingFields({ name: input.name, email: input.email, password: input.password });
      if (Object.keys(errors).length > 0) throw validationError(errors);

      const email = normalizeEmail(input.email);
      if (users.some((user) => user.email === email)) {
        // Não devolve dado da conta que já existe, só diz que o e-mail não serve.
        throw validationError({ email: ['Este e-mail não pode ser usado.'] });
      }

      const user: StoredUser = {
        id: nextUserId++,
        name: input.name.trim(),
        email,
        password: input.password,
        role: input.role,
      };
      users.push(user);
      return publicUser(user);
    },

    async login(input) {
      await wait();
      const errors = missingFields({ email: input.email, password: input.password });
      if (Object.keys(errors).length > 0) throw validationError(errors);

      const user = users.find((candidate) => candidate.email === normalizeEmail(input.email));
      // Mesma mensagem para e-mail desconhecido e senha errada: não confirma que a conta existe.
      if (!user || user.password !== input.password) {
        throw new ApiError(401, 'E-mail ou senha inválidos.');
      }

      const token = `mock-token-${nextTokenNumber++}`;
      sessions.set(token, user.id);
      return { token };
    },

    async logout() {
      await wait();
      sessions.delete(authenticate().token);
    },

    async me() {
      await wait();
      return publicUser(authenticate().user);
    },
  };
}

export const mockApi = createMockApi({ delayMs: 250 });
