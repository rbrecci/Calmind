import * as SecureStore from 'expo-secure-store';

import type { TokenStorage } from './restore-session.ts';

const KEY = 'calmind.auth_token';

// Keychain no iOS e Keystore no Android (RNF-07). Nunca AsyncStorage, que é texto puro.
// WHEN_UNLOCKED_THIS_DEVICE_ONLY: o token não vai para backup nem para outro aparelho.
const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

// Na web o SecureStore não existe. Lá o token fica só em memória (auth-token.ts) e some ao
// recarregar a página, de propósito: guardar em localStorage violaria o RNF-07.
const isAvailable = () => SecureStore.isAvailableAsync();

export const secureTokenStorage: TokenStorage = {
  async load() {
    if (!(await isAvailable())) return null;
    try {
      return await SecureStore.getItemAsync(KEY, OPTIONS);
    } catch {
      // Valor que não decifra, por exemplo depois de restaurar backup em outro aparelho.
      // Trata como "sem sessão" em vez de travar a abertura do app.
      await SecureStore.deleteItemAsync(KEY, OPTIONS).catch(() => undefined);
      return null;
    }
  },

  async save(token) {
    if (!(await isAvailable())) return;
    await SecureStore.setItemAsync(KEY, token, OPTIONS);
  },

  async clear() {
    if (!(await isAvailable())) return;
    await SecureStore.deleteItemAsync(KEY, OPTIONS);
  },
};
