// Tipos do contrato (docs/api/contrato-api.md). Campos em inglês, como na API (RNF-52).

// Papéis que o app atende. O `admin` do schema.sql usa só o painel web.
export type Role = 'patient' | 'psychologist';
export type UserRole = Role | 'admin';

export type User = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
};

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  role: Role;
  birth_date?: string;
  phone?: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_relationship?: string;
};

export type PatientTask = {
  id: number;
  bond_id: number;
  title: string;
  description: string | null;
  due_date: string | null;
  status: 'pending' | 'completed';
  completed_at: string | null;
  created_at: string;
};

export type PatientTaskList = {
  data: PatientTask[];
  meta: { total: number; page: number; per_page: number };
};

export type LoginInput = {
  email: string;
  password: string;
};

// Contrato 2.3: `errors` só existe em erro de validação (422).
export type FieldErrors = Record<string, string[]>;

export class ApiError extends Error {
  status: number;
  errors?: FieldErrors;

  constructor(status: number, message: string, errors?: FieldErrors) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

// Tudo que as telas podem pedir à API. A implementação real (http.ts) e a de mock (mock.ts)
// cumprem este mesmo formato, e é por isso que nenhuma tela sabe qual das duas está ativa.
export type Api = {
  register(input: RegisterInput): Promise<User>; // POST /auth/register
  login(input: LoginInput): Promise<{ token: string }>; // POST /auth/login
  logout(): Promise<void>; // POST /auth/logout
  me(): Promise<User>; // GET /me
  patientTasks(): Promise<PatientTaskList>; // GET /patient/tasks
  completePatientTask(id: number): Promise<PatientTask>; // POST /patient/tasks/{id}/complete
};
