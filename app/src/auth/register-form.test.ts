import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { ApiError } from '../api/types.ts';
import { authErrorMessage, buildRegisterInput, isMinor, toIsoDate, validateRegisterForm, type RegisterForm } from './register-form.ts';

const TODAY = new Date('2026-10-23T12:00:00Z');

const ADULT: RegisterForm = {
  role: 'patient',
  name: 'Paciente Fictício',
  email: 'teste@calmind.test',
  birthDate: '14/03/2001',
  password: 'abc12345',
  confirmPassword: 'abc12345',
  guardianName: '',
  guardianPhone: '',
  guardianRelationship: '',
};

describe('toIsoDate', () => {
  test('converte DD/MM/AAAA para o formato do contrato', () => {
    assert.equal(toIsoDate('14/03/2001'), '2001-03-14');
  });

  test('devolve o texto limpo quando não é DD/MM/AAAA', () => {
    assert.equal(toIsoDate(' 2001-03-14 '), '2001-03-14');
  });
});

describe('isMinor', () => {
  test('é verdadeiro de 12 a 17 anos', () => {
    assert.equal(isMinor('23/10/2014', TODAY), true);
    assert.equal(isMinor('24/10/2008', TODAY), true);
  });

  test('é falso aos 18 anos completos hoje e abaixo de 12', () => {
    assert.equal(isMinor('23/10/2008', TODAY), false);
    assert.equal(isMinor('24/10/2014', TODAY), false);
  });

  test('é falso para data ilegível, sem derrubar a tela', () => {
    assert.equal(isMinor('', TODAY), false);
    assert.equal(isMinor('31/02/2010', TODAY), false);
  });
});

describe('validateRegisterForm', () => {
  test('cadastro de adulto completo não tem erro', () => {
    assert.deepEqual(validateRegisterForm(ADULT, TODAY), {});
  });

  test('aponta cada campo obrigatório vazio', () => {
    const errors = validateRegisterForm({ ...ADULT, name: ' ', email: '', birthDate: '', password: '', confirmPassword: '' }, TODAY);

    assert.deepEqual(Object.keys(errors).sort(), ['birth_date', 'email', 'name', 'password']);
    assert.deepEqual(errors.name, ['Este campo é obrigatório.']);
  });

  test('recusa e-mail sem formato de e-mail', () => {
    assert.deepEqual(validateRegisterForm({ ...ADULT, email: 'sem-arroba' }, TODAY).email, ['Informe um e-mail válido.']);
  });

  test('recusa senha curta', () => {
    const errors = validateRegisterForm({ ...ADULT, password: 'abc123', confirmPassword: 'abc123' }, TODAY);

    assert.deepEqual(errors.password, ['A senha deve ter pelo menos 8 caracteres.']);
  });

  test('recusa confirmação de senha diferente', () => {
    const errors = validateRegisterForm({ ...ADULT, confirmPassword: 'outra-senha' }, TODAY);

    assert.deepEqual(errors.confirm_password, ['As senhas não conferem.']);
  });

  test('recusa data de nascimento fora do formato DD/MM/AAAA', () => {
    assert.deepEqual(validateRegisterForm({ ...ADULT, birthDate: '14-03-2001' }, TODAY).birth_date, ['Informe a data no formato DD/MM/AAAA.']);
    assert.deepEqual(validateRegisterForm({ ...ADULT, birthDate: '31/02/2001' }, TODAY).birth_date, ['Informe a data no formato DD/MM/AAAA.']);
  });

  test('paciente menor de idade precisa dos três dados do responsável', () => {
    const errors = validateRegisterForm({ ...ADULT, birthDate: '10/05/2011' }, TODAY);

    assert.deepEqual(Object.keys(errors).sort(), ['guardian_name', 'guardian_phone', 'guardian_relationship']);
  });

  test('psicólogo não precisa de data de nascimento nem de responsável', () => {
    assert.deepEqual(validateRegisterForm({ ...ADULT, role: 'psychologist', birthDate: '' }, TODAY), {});
  });
});

describe('buildRegisterInput', () => {
  test('paciente adulto manda a data em ISO e nada de responsável', () => {
    assert.deepEqual(buildRegisterInput({ ...ADULT, guardianName: 'sobra' }, TODAY), {
      name: 'Paciente Fictício',
      email: 'teste@calmind.test',
      password: 'abc12345',
      role: 'patient',
      birth_date: '2001-03-14',
    });
  });

  test('paciente menor manda os dados do responsável', () => {
    const input = buildRegisterInput(
      { ...ADULT, birthDate: '10/05/2011', guardianName: 'Mãe Fictícia', guardianPhone: '(11) 90000-0000', guardianRelationship: 'mãe' },
      TODAY,
    );

    assert.equal(input.birth_date, '2011-05-10');
    assert.equal(input.guardian_name, 'Mãe Fictícia');
    assert.equal(input.guardian_phone, '(11) 90000-0000');
    assert.equal(input.guardian_relationship, 'mãe');
  });

  test('psicólogo não manda data de nascimento', () => {
    const input = buildRegisterInput({ ...ADULT, role: 'psychologist' }, TODAY);

    assert.equal('birth_date' in input, false);
  });
});

describe('authErrorMessage', () => {
  test('login com 401 usa o texto da tela 02, sem dizer qual campo errou', () => {
    assert.equal(
      authErrorMessage('login', new ApiError(401, 'E-mail ou senha inválidos.')),
      'Não foi possível entrar. Confira o e-mail e a senha e tente de novo.',
    );
  });

  test('cadastro com 422 manda olhar os campos marcados', () => {
    assert.equal(
      authErrorMessage('register', new ApiError(422, 'Os dados informados são inválidos.', { email: ['Este e-mail não pode ser usado.'] })),
      'Confira os campos destacados e tente de novo.',
    );
  });

  test('conflito 409 mostra a mensagem que a API mandou', () => {
    assert.equal(authErrorMessage('register', new ApiError(409, 'Esta conta já está em uso.')), 'Esta conta já está em uso.');
  });

  test('sem rede mostra a mensagem do cliente HTTP', () => {
    const message = 'Sem conexão com o servidor. Verifique sua internet.';

    assert.equal(authErrorMessage('login', new ApiError(0, message)), message);
  });

  test('erro desconhecido vira mensagem genérica de cada fluxo', () => {
    assert.equal(authErrorMessage('login', new TypeError('x')), 'Não foi possível entrar. Tente novamente.');
    assert.equal(authErrorMessage('register', new TypeError('x')), 'Não foi possível criar a conta. Tente novamente.');
  });
});
