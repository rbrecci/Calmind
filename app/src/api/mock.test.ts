import assert from 'node:assert/strict';
import { beforeEach, describe, test } from 'node:test';

import { setAuthToken } from './auth-token.ts';
import { createMockApi } from './mock.ts';
import { ApiError } from './types.ts';

const PATIENT = { email: 'paciente@calmind.test', password: 'senha-de-teste-123' };

// Falha se a promessa não rejeitar com ApiError, e devolve o erro para conferir status e corpo.
async function rejection(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (error) {
    assert.ok(error instanceof ApiError, 'esperava ApiError');
    return error;
  }
  assert.fail('esperava que a chamada falhasse');
}

describe('mock da API', () => {
  beforeEach(() => setAuthToken(null));

  describe('login', () => {
    test('devolve um token para credenciais válidas', async () => {
      const { token } = await createMockApi().login(PATIENT);
      assert.ok(token.length > 0);
    });

    // CA do contrato: a mensagem não pode confirmar que a conta existe.
    test('usa a mesma resposta para senha errada e e-mail desconhecido', async () => {
      const api = createMockApi();
      const wrongPassword = await rejection(api.login({ ...PATIENT, password: 'errada' }));
      const unknownEmail = await rejection(api.login({ email: 'ninguem@calmind.test', password: 'qualquer' }));

      assert.equal(wrongPassword.status, 401);
      assert.equal(unknownEmail.status, 401);
      assert.equal(wrongPassword.message, unknownEmail.message);
    });

    test('responde 422 com errors por campo quando falta dado', async () => {
      const error = await rejection(createMockApi().login({ email: '', password: '' }));

      assert.equal(error.status, 422);
      assert.deepEqual(Object.keys(error.errors ?? {}).sort(), ['email', 'password']);
    });
  });

  describe('me', () => {
    test('responde 401 sem token', async () => {
      const error = await rejection(createMockApi().me());
      assert.equal(error.status, 401);
    });

    test('devolve o usuário do token, com o papel e sem a senha', async () => {
      const api = createMockApi();
      setAuthToken((await api.login(PATIENT)).token);

      const user = await api.me();

      assert.equal(user.role, 'patient');
      assert.equal(user.email, PATIENT.email);
      assert.equal('password' in user, false);
    });
  });

  describe('logout', () => {
    test('invalida o token', async () => {
      const api = createMockApi();
      setAuthToken((await api.login(PATIENT)).token);

      await api.logout();

      const error = await rejection(api.me());
      assert.equal(error.status, 401);
    });
  });

  describe('register', () => {
    test('cria a conta com o papel pedido e nunca devolve a senha', async () => {
      const user = await createMockApi().register({
        name: 'Nova Pessoa',
        email: 'nova@calmind.test',
        password: 'senha-de-teste-123',
        role: 'psychologist',
      });

      assert.equal(user.role, 'psychologist');
      assert.equal(typeof user.id, 'number');
      assert.equal('password' in user, false);
    });

    test('a conta criada consegue entrar', async () => {
      const api = createMockApi();
      await api.register({ name: 'Nova Pessoa', email: 'Nova@Calmind.test', password: 'abc12345', role: 'patient', birth_date: '1998-04-12' });

      const { token } = await api.login({ email: 'nova@calmind.test', password: 'abc12345' });
      assert.ok(token.length > 0);
    });

    test('recusa e-mail repetido com 422 e sem vazar dado da conta existente', async () => {
      const error = await rejection(
        createMockApi().register({ name: 'Outro', email: PATIENT.email, password: 'abc12345', role: 'patient', birth_date: '1998-04-12' }),
      );

      assert.equal(error.status, 422);
      assert.ok(error.errors?.email);
      assert.equal(JSON.stringify(error).includes('Paciente de Teste'), false);
    });

    test('exige data de nascimento de paciente', async () => {
      const error = await rejection(createMockApi().register({
        name: 'Nova Pessoa', email: 'nova@calmind.test', password: 'abc12345', role: 'patient', birth_date: '',
      }));
      assert.equal(error.status, 422);
      assert.ok(error.errors?.birth_date);
    });

    test('exige dados do responsável para paciente menor de idade', async () => {
      const error = await rejection(createMockApi().register({
        name: 'Paciente Menor', email: 'menor@calmind.test', password: 'abc12345', role: 'patient', birth_date: '2011-04-12',
      }));
      assert.equal(error.status, 422);
      assert.ok(error.errors?.guardian_name);
      assert.ok(error.errors?.guardian_phone);
      assert.ok(error.errors?.guardian_relationship);
    });
  });

  describe('catálogo de psicólogos', () => {
    test('exige autenticação', async () => {
      const error = await rejection(createMockApi().catalogPsychologists());
      assert.equal(error.status, 401);
    });

    test('só o paciente acessa o catálogo', async () => {
      const api = createMockApi();
      setAuthToken((await api.login({ email: 'psicologo@calmind.test', password: 'senha-de-teste-123' })).token);
      assert.equal((await rejection(api.catalogPsychologists())).status, 403);
    });

    test('lista nome, CRP, abordagem e modalidade, na ordem do nome', async () => {
      const api = createMockApi();
      setAuthToken((await api.login(PATIENT)).token);

      const { data, meta } = await api.catalogPsychologists();

      assert.ok(data.length > 0);
      assert.equal(meta.total, data.length);
      const names = data.map((p) => p.name);
      assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b)));
      for (const item of data) {
        assert.match(item.crp, /^\d{2}\/\d+$/);
        assert.ok(item.approach);
        assert.ok(['online', 'presencial', 'ambos'].includes(item.modality ?? ''));
      }
    });

    // RNF-21 e RNF-23: o formato do contrato é fechado e não tem preço, nota nem ranking.
    test('não expõe preço, nota, estrela nem ranking', async () => {
      const api = createMockApi();
      setAuthToken((await api.login(PATIENT)).token);

      const text = JSON.stringify(await api.catalogPsychologists());

      assert.doesNotMatch(text, /price|preco|preço|rating|nota|stars|estrela|rank/i);
    });
  });

  describe('tarefas do paciente', () => {
    test('exige autenticação para listar', async () => {
      const error = await rejection(createMockApi().patientTasks());
      assert.equal(error.status, 401);
    });

    test('lista e conclui uma tarefa mantendo a mesma data ao repetir', async () => {
      const api = createMockApi();
      setAuthToken((await api.login(PATIENT)).token);
      const first = await api.patientTasks();
      assert.ok(first.data.length > 0);
      const task = first.data[0];
      const completed = await api.completePatientTask(task.id);
      assert.equal(completed.status, 'completed');
      assert.ok(completed.completed_at);
      const again = await api.completePatientTask(task.id);
      assert.equal(again.completed_at, completed.completed_at);
      assert.equal((await api.patientTasks()).data[0].status, 'completed');
    });

    test('não mostra tarefa de outro paciente', async () => {
      const api = createMockApi();
      await api.register({ name: 'Outra Pessoa', email: 'outra@calmind.test', password: 'abc12345', role: 'patient', birth_date: '1998-04-12' });
      setAuthToken((await api.login({ email: 'outra@calmind.test', password: 'abc12345' })).token);
      assert.equal((await api.patientTasks()).data.length, 0);
      assert.equal((await rejection(api.completePatientTask(1))).status, 404);
    });
  });
});
