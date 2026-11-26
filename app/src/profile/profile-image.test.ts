import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { ApiError, type User } from '../api/types.ts';
import { createProfileImageEditor, MAX_IMAGE_BYTES, type PickedImage, type ProfileImageState } from './profile-image.ts';

const USER: User = { id: 7, name: 'Pessoa Fictícia', email: 'ficticia@calmind.test', role: 'patient', avatar_url: null, cover_url: null };
const IMAGE: PickedImage = { uri: 'file:///foto.jpg', name: 'foto.jpg', mimeType: 'image/jpeg', size: 300 * 1024 };

function setup(overrides: Partial<Parameters<typeof createProfileImageEditor>[0]> = {}) {
  const states: ProfileImageState[] = [];
  const users: User[] = [];
  const calls: string[] = [];
  const editor = createProfileImageEditor({
    pick: async (kind) => { calls.push(`pick:${kind}`); return IMAGE; },
    upload: async (kind) => { calls.push(`upload:${kind}`); return { ...USER, [`${kind}_url`]: `http://api.teste/users/7/${kind}?v=1` }; },
    remove: async (kind) => { calls.push(`remove:${kind}`); return USER; },
    onUser: (user) => users.push(user),
    ...overrides,
  }, (state) => states.push(state));
  return { editor, states, users, calls };
}

describe('createProfileImageEditor', () => {
  test('trocar a foto envia a escolhida e entrega o usuário novo para a sessão', async () => {
    const { editor, states, users, calls } = setup();

    await editor.change('avatar');

    assert.deepEqual(calls, ['pick:avatar', 'upload:avatar']);
    assert.equal(users[0].avatar_url, 'http://api.teste/users/7/avatar?v=1');
    assert.deepEqual(states, [{ busy: 'avatar', error: null }, { busy: null, error: null }]);
  });

  test('desistir no seletor não envia nada nem mexe no estado', async () => {
    const { editor, states, users, calls } = setup({ pick: async () => null });

    await editor.change('cover');

    assert.deepEqual(calls, []);
    assert.deepEqual(users, []);
    assert.deepEqual(states, []);
  });

  test('imagem acima de 2 MB para antes do envio, com o motivo', async () => {
    const { editor, states, calls } = setup({ pick: async () => ({ ...IMAGE, size: MAX_IMAGE_BYTES + 1 }) });

    await editor.change('cover');

    assert.deepEqual(calls, []);
    assert.deepEqual(states, [{ busy: null, error: 'A imagem passou de 2 MB. Escolha outra ou recorte uma parte menor.' }]);
  });

  test('erro de validação mostra a mensagem do campo image', async () => {
    const { editor, states, users } = setup({
      upload: async () => { throw new ApiError(422, 'Os dados informados são inválidos.', { image: ['O arquivo precisa ser JPEG, PNG ou WebP.'] }); },
    });

    await editor.change('avatar');

    assert.deepEqual(users, []);
    assert.deepEqual(states.at(-1), { busy: null, error: 'O arquivo precisa ser JPEG, PNG ou WebP.' });
  });

  test('erro sem resposta da API não mostra detalhe interno', async () => {
    const { editor, states } = setup({ upload: async () => { throw new TypeError('Cannot read properties of undefined'); } });

    await editor.change('avatar');

    assert.deepEqual(states.at(-1), { busy: null, error: 'Não foi possível trocar a imagem. Tente de novo.' });
  });

  // Investigação do "Aguarde..." que parecia preso depois do DELETE: todo caminho que mostra
  // `busy` termina mostrando `busy: null`, inclusive quando quem recebe o usuário falha.
  test('falha ao entregar o usuário também tira o carregando', async () => {
    const { editor, states } = setup({ onUser: () => { throw new Error('sessão indisponível'); } });

    await editor.remove('cover');

    assert.deepEqual(states.at(-1), { busy: null, error: 'Não foi possível trocar a imagem. Tente de novo.' });
  });

  test('remover a capa entrega o usuário sem ela', async () => {
    const { editor, states, users, calls } = setup();

    await editor.remove('cover');

    assert.deepEqual(calls, ['remove:cover']);
    assert.equal(users[0].cover_url, null);
    assert.deepEqual(states, [{ busy: 'cover', error: null }, { busy: null, error: null }]);
  });

  test('um segundo toque durante o envio é ignorado', async () => {
    let finish!: (user: User) => void;
    const { editor, calls } = setup({
      upload: (kind) => { calls.push(`upload:${kind}`); return new Promise<User>((resolve) => { finish = resolve; }); },
    });

    const first = editor.change('avatar');
    await new Promise((resolve) => setImmediate(resolve));
    await editor.remove('avatar');
    await editor.change('cover');
    finish(USER);
    await first;

    assert.deepEqual(calls, ['pick:avatar', 'upload:avatar']);
  });

  test('depois de descartado, a resposta que chega não mexe na tela', async () => {
    let finish!: (user: User) => void;
    const { editor, states, users } = setup({ upload: () => new Promise<User>((resolve) => { finish = resolve; }) });

    const pending = editor.change('avatar');
    await new Promise((resolve) => setImmediate(resolve));
    editor.dispose();
    finish(USER);
    await pending;

    // A sessão recebe o usuário mesmo assim: a foto foi trocada no servidor.
    assert.equal(users.length, 1);
    assert.deepEqual(states, [{ busy: 'avatar', error: null }]);
  });
});
