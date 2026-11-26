import { useCallback, useEffect, useRef, useState } from 'react';

import { api, type ImageKind } from '@/api';
import { useSession } from '@/session/session-context';
import { pickImage } from './pick-image';
import { createProfileImageEditor, type ProfileImageState } from './profile-image';

// Foto e capa de quem está logado. O usuário que a API devolve vai direto para a sessão, e é
// dela que o cabeçalho e as telas de perfil leem: a troca aparece na hora em todo lugar.
export function useProfileImages() {
  const { avatarUrl, coverUrl, updateUser } = useSession();
  const [state, setState] = useState<ProfileImageState>({ busy: null, error: null });
  const editorRef = useRef<ReturnType<typeof createProfileImageEditor> | null>(null);
  // Criado no efeito, como o useResource: a tela que sai descarta o editor, e a resposta que
  // chegar depois não mexe no estado dela.
  useEffect(() => {
    const editor = createProfileImageEditor({
      pick: pickImage,
      upload: (kind, image) => api.uploadProfileImage(kind, image),
      remove: (kind) => api.removeProfileImage(kind),
      onUser: updateUser,
    }, setState);
    editorRef.current = editor;
    return () => { editor.dispose(); editorRef.current = null; };
  }, [updateUser]);
  const change = useCallback((kind: ImageKind) => { void editorRef.current?.change(kind); }, []);
  const remove = useCallback((kind: ImageKind) => { void editorRef.current?.remove(kind); }, []);
  return { avatarUrl, coverUrl, ...state, change, remove };
}
