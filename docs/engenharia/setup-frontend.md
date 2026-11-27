# Setup do frontend

Expo (SDK 57, TypeScript, `expo-router`) em `app/`: um app só, com telas separadas por papel.

## 1. Rodar

Node 24 e npm 11. Dentro de `app/`:

```bash
npm install
cp .env.example .env    # PowerShell: Copy-Item .env.example .env
npx expo start
```

| Variável | Valor |
|----------|-------|
| `EXPO_PUBLIC_USE_MOCK` | `true` usa dados de mentira, sem backend; `false` chama a API (padrão do `.env.example`) |
| `EXPO_PUBLIC_API_URL` | endereço da API com `/api/v1`. O celular não enxerga o `localhost` do computador |

Testes: `npm test`, `npm run lint` e `npx tsc --noEmit`. APK: [seção 7 do guia](rodar-em-outra-maquina.md#7-gerar-o-apk). Android Studio só é necessário para o build.

## 2. Regras

1. O token fica no armazenamento seguro (Keystore ou Keychain), nunca em `AsyncStorage` (RNF-07).
2. A URL da API vem de variável de ambiente, nunca fixa no código.
3. Navegação separada por papel, escolhida pelo `role` do `/me`.
4. Nenhuma regra de negócio no app (RNF-57).
5. Toda chamada passa por `src/api/`; tela nunca chama `fetch()` direto.
6. O mock devolve exatamente o formato do [contrato](../api/contrato-api.md): lista `{data, meta}`, erro `{message, errors}`, data com offset `-03:00`.
7. Componente, cor e fonte vêm do [design system](../../app/src/design-system/README.md) (RNF-34); a especificação é a [identidade visual](../identidade-visual.md).
8. Alvo de toque de 44 pontos e rótulo de acessibilidade em todo controle (RNF-35).

As telas de referência são o [protótipo de 25/11](../prototipo/telas-25-11/).

## 3. Quando algo não sobe

| Sintoma | Causa provável |
|---------|----------------|
| Erro de rede genérico no celular | URL em `http://`: o APK bloqueia tráfego sem TLS |
| App não acha o backend | URL em `localhost` |
| Data errada na tela | data com `Z` em vez de offset |
| Lista não renderiza | resposta sem o formato `{data, meta}` |
| `ninja: error: manifest 'build.ninja' still dirty` | build a partir de caminho longo: use o guia do APK |
