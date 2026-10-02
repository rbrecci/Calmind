# app

**React Native.** O aplicativo do paciente e do psicólogo, um app só, com telas por papel.

Projeto **Expo** (SDK 57, TypeScript, `expo-router`), decisão FE-01 fechada em 02/10/2026. Código em `src/`, rotas em `src/app/`.

```bash
npm install
cp .env.example .env    # no PowerShell: Copy-Item .env.example .env
npx expo start
```

## Mock ou API de verdade

Toda chamada à API passa por `src/api/`. A variável `EXPO_PUBLIC_USE_MOCK` do `.env` escolhe a implementação:

| Valor | O que acontece |
|-------|----------------|
| `true` | `src/api/mock.ts`: dados de mentira, no mesmo formato do contrato, sem backend |
| `false` | `src/api/http.ts`: chamada HTTP real na `EXPO_PUBLIC_API_URL` |

As telas importam `api` de `@/api` e nunca chamam `fetch()` direto. As contas de teste do mock estão no topo de `src/api/mock.ts`.

```bash
npm test    # testes do mock (node:test, sem dependência extra)
```

## O que este app é, e o que ele não é

Ele é uma casca: telas, navegação e chamadas HTTP. **Nenhuma regra de negócio vive aqui** — quem decide se um relato é privado, se um vínculo pode existir ou se a análise de IA pode rodar é o Laravel. O RNF-57 proíbe regra duplicada nos clientes, e o motivo é prático: regra em dois lugares vira regra diferente em dois lugares.

## As quatro provas do spike, antes de qualquer tela

Estão em [`../docs/planejamento/arranque-react-native.md`](../docs/planejamento/arranque-react-native.md), seção 6. Resumo: app abre em celular físico, login consome endpoint real, notificação agendada dispara com o app fechado, e um APK gerado é instalado por outra pessoa do grupo.

**Não comecem telas antes das quatro passarem.** Tela bonita sobre fundação que não fecha é retrabalho garantido.

## Três coisas que custam um dia se descobertas tarde

1. **O celular não enxerga o `localhost` do notebook.** Decisão DA-01 em [`../docs/planejamento/decisoes-abertas.md`](../docs/planejamento/decisoes-abertas.md).
2. **Android 9+ bloqueia `http://` sem TLS.** O sintoma é erro de rede genérico, que parece bug de código. Decisão DA-03.
3. **A URL da API não pode ser fixa no código.** APK apontando para o IP do notebook de alguém funciona na casa dessa pessoa e morre no dia da apresentação. Use variável de ambiente.

## Token

Guardado no armazenamento seguro do aparelho, Keystore no Android e Keychain no iOS. Nunca em `AsyncStorage`, que é texto puro e violaria o RNF-07.

O código está em `src/session/`: `token-storage.ts` grava e lê com o `expo-secure-store`, e `restore-session.ts` restaura a sessão ao abrir o app (pergunta o papel ao `/me`; token expirado é apagado, falta de rede não). **Na web o `expo-secure-store` não existe**, então lá o token fica só em memória e a sessão some ao recarregar a página, de propósito.
