import { ApiError, type ImageKind, type ImageUpload, type User } from '../api/types.ts';

// Imagem escolhida, com o tamanho quando o seletor informa. O servidor recusa acima de 2048 KB.
export type PickedImage = ImageUpload & { size?: number };
export const MAX_IMAGE_BYTES = 2048 * 1024;

// `busy` diz qual das duas imagens está indo ou saindo, para só o botão dela mostrar "Aguarde".
export type ProfileImageState = { busy: ImageKind | null; error: string | null };

type Actions = {
  pick(kind: ImageKind): Promise<PickedImage | null>;
  upload(kind: ImageKind, image: ImageUpload): Promise<User>;
  remove(kind: ImageKind): Promise<User>;
  // Recebe o usuário que a API devolve, com as URLs novas, para a sessão e a tela trocarem na hora.
  onUser(user: User): void;
};

function imageError(error: unknown): string {
  if (!(error instanceof ApiError)) return 'Não foi possível trocar a imagem. Tente de novo.';
  return error.errors?.image?.[0] ?? error.message;
}

// Troca e remoção da foto e da capa, fora do React para dar para testar. A tela guarda o estado
// que `notify` entrega; `dispose` é a tela saindo, e a resposta que chegar depois não mexe nela.
export function createProfileImageEditor(actions: Actions, notify: (state: ProfileImageState) => void) {
  let busy = false;
  let disposed = false;
  const show = (state: ProfileImageState) => { if (!disposed) notify(state); };

  async function run(kind: ImageKind, send: () => Promise<User>) {
    show({ busy: kind, error: null });
    try {
      // A sessão recebe o usuário mesmo com a tela fechada: a troca já aconteceu no servidor.
      actions.onUser(await send());
      show({ busy: null, error: null });
    } catch (error) {
      show({ busy: null, error: imageError(error) });
    }
  }

  return {
    async change(kind: ImageKind) {
      if (busy) return;
      busy = true;
      try {
        let image: PickedImage | null;
        try {
          image = await actions.pick(kind);
        } catch {
          show({ busy: null, error: 'Não foi possível abrir suas fotos. Tente de novo.' });
          return;
        }
        if (!image) return;
        if (image.size !== undefined && image.size > MAX_IMAGE_BYTES) {
          show({ busy: null, error: 'A imagem passou de 2 MB. Escolha outra ou recorte uma parte menor.' });
          return;
        }
        await run(kind, () => actions.upload(kind, image));
      } finally {
        busy = false;
      }
    },
    async remove(kind: ImageKind) {
      if (busy) return;
      busy = true;
      try {
        await run(kind, () => actions.remove(kind));
      } finally {
        busy = false;
      }
    },
    dispose() { disposed = true; },
  };
}
