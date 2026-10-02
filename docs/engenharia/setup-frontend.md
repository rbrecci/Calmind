# Setup do frontend

**React Native, em `app/`.** O aplicativo do paciente e do psicólogo, um app só, com telas por
papel.

Para o Caio. A fundação do app é dele, sozinho, pelo mesmo motivo do backend: dois assistentes na
mesma fundação produzem duas fundações incompatíveis.

---

## 1. O que precisa estar instalado

| Ferramenta | Versão na máquina do grupo | Como conferir |
|------------|---------------------------|---------------|
| Node | 24.x | `node -v` |
| npm | 11.x | `npm -v` |

Android Studio só é necessário quando o APK entrar, na etapa de build. Para montar tela, não.

---

## 2. A decisão FE-01, que é a primeira desta frente

**Expo ou React Native CLI?** Não está decidido — o `.gitignore` já prevê os dois, com `.expo/` e
`app/android/`. Quem funda o app decide, registra em
[`README.md`](README.md#decis%C3%B5es-que-continuam-abertas) e avisa no grupo.

O que pesa na escolha, sem rodeio: ninguém no grupo tem experiência real com React Native, e a
etapa mais arriscada da frente é justamente a fundação. Expo reduz esse risco de forma
considerável — ambiente que sobe sem Android Studio, notificação local agendada já resolvida
(RF-28, Sprint 3), armazenamento seguro pronto, e build de APK sem configurar Gradle. O CLI dá mais
controle, que este projeto não precisa.

**Decisão fechada em 02/10/2026: Expo.** Projeto em `app/`, SDK 57, TypeScript e `expo-router`
(navegação por arquivos, que facilita separar as árvores de tela por papel). Comandos: `npm install`
e `npx expo start` dentro de `app/`.

Qualquer das duas, o que não muda são as quatro regras abaixo.

---

## 3. As quatro regras da fundação

**1. O token fica no armazenamento seguro do aparelho** — Keystore no Android, Keychain no iOS.
Nunca em `AsyncStorage`, que é texto puro e violaria o RNF-07.

**2. A URL da API vem de variável de ambiente, nunca fixa no código.** APK apontando para o IP do
notebook de alguém funciona na casa dessa pessoa e morre no dia da apresentação.

**3. Navegação separada por papel.** Paciente e psicólogo são o mesmo app com árvores de tela
diferentes, escolhidas pelo `role` que o `/me` devolve. Não é app diferente, e não é tela com
`if` no meio.

**4. Nenhuma regra de negócio aqui.** O app é casca: telas, navegação e chamadas HTTP. Quem decide
se um relato é privado, se um vínculo pode existir ou se a análise pode rodar é o Laravel. O
RNF-57 proíbe regra duplicada nos clientes, e o motivo é prático: regra em dois lugares vira regra
diferente em dois lugares.

---

## 4. A camada de mock

**O frontend começa sem backend**, porque na primeira etapa o backend ainda não existe. Isso é
decisão de 02/10/2026, e tem uma condição que faz toda a diferença:

> **O mock devolve exatamente o formato do contrato.** Não "parecido": exatamente.

Concretamente:

| O que | Formato obrigatório |
|-------|---------------------|
| Lista | `{ "data": [...], "meta": { "total": 0, "page": 1, "per_page": 20 } }` |
| Erro | `{ "message": "...", "errors": { "campo": ["..."] } }` |
| Data | `2026-10-02T21:30:00-03:00`, com offset, nunca `Z` nem `02/10/2026` |
| Token | Cabeçalho `Authorization: Bearer <token>` |

A fonte de verdade é [`../api/contrato-api.md`](../api/contrato-api.md) e a coleção
[`../api/Calmind.postman_collection.json`](../api/Calmind.postman_collection.json), que mostra o
corpo real de cada requisição e resposta. Copie dali, não invente.

### E tudo isso atrás de um módulo só

Um arquivo de cliente de API, com uma chave liga/desliga lida de variável de ambiente:

```
USE_MOCK=true    -> respostas do arquivo de mock
USE_MOCK=false   -> HTTP real contra a API
```

**Nenhuma tela sabe qual dos dois está ativo.** Tela chama `api.login()`, não `fetch()`. É isso que
faz a etapa de primeira conexão ser a troca de uma variável em vez de uma refatoração — e é o maior
ganho de organização desta frente inteira.

Se uma tela chamar `fetch()` direto, a dívida só aparece no dia da integração, que é o pior dia
possível para descobri-la.

---

## 5. O design system vem pronto, não se inventa

O RNF-34 exige **design system único e versionado**, com os mesmos componentes, escala tipográfica,
paleta e padrões de interação. Componente criado fora do conjunto é divergência listada e corrigida
antes do fechamento da sprint.

A fonte de verdade é [`../identidade-visual.md`](../identidade-visual.md), seção 5, e o código está
em `app/src/design-system/tokens.ts`. São 6 famílias com 3 tons cada (`-1`, **base** e `+1`), e o
tom principal de cada família é a **base**:

| Família | `-1` | **Base** | `+1` | Onde |
|---------|------|----------|------|------|
| Primária | `#A858A9` | **`#F07EF2`** | `#DFB3F2` | Lado do **psicólogo** |
| Secundária | `#5BA958` | **`#82F27E`** | `#D6F2C2` | Lado do **paciente** |
| Danger | `#B24040` | **`#FF5C5C`** | `#FF8D8D` | Erro, recusa, ação destrutiva |
| Success | `#5FA2B2` | **`#88E7FF`** | `#ACEEFF` | Confirmação, estado concluído |
| Dark | `#141414` | **`#1C1C1C`** | `#606060` | Texto, ícone, contorno |
| Light | `#989898` | **`#D9D9D9`** | `#E4E4E4` | Borda, divisória, fundo de campo |

As regras que mais pegam em código:

- **Texto sobre cor é sempre `Dark` (base), nunca branco.** Branco reprova o contraste de 4,5:1
  (RNF-35) em todas as cores de lado.
- Fundo majoritariamente branco, e **só tema claro**: a identidade não define paleta escura.
- Primária e secundária entram em botão, linha e detalhe, nunca em grandes áreas de fundo.
- **Telas anteriores ao login não escolhem lado** e usam o Gradiente Verde-Rosa.

**Tipografia:** Quicksand SemiBold nos títulos (H1 40px, H2 34px, H3 28px, H4 24px, H5 18px),
Poppins no texto de corpo. Quicksand cansa em texto corrido, e é por isso que ela não desce para o
corpo.

**Nada de hex solto no meio do componente.** Cor vem de token, sempre — é o que a identidade visual
já exige das telas do Figma e vale igual no código.

---

## 6. As telas, e de onde copiar

As 21 telas estão exportadas em [`../prototipo/telas-pdf/`](../prototipo/telas-pdf/) e o mapa de
navegação em [`../prototipo/fluxo-ux.html`](../prototipo/fluxo-ux.html). Abre no navegador, sem
servidor e sem conta em ferramenta de design.

O escopo da Sprint 2 são os blocos A, B, D, E e F:

| Tela | Arquivo em `telas-pdf/` | Bloco |
|------|------------------------|-------|
| Entrada, login e erro | 01, 02 | A |
| Escolha de perfil | 03 | A |
| Cadastro do paciente | 04 | A |
| Consentimento | 06 | B |
| Como você chegou aqui | 07 | D |
| Código de convite | 08 | D |
| Catálogo | 09 | D |
| Perfil e vínculo | 10 | D |
| Início do paciente | 12 | — |
| **Novo relato** | **14** | **E** |
| Tarefas | 15 | F |

**A tela 14 é a que vale nota.** O marcador de privacidade precisa aparecer **sem rolagem** e já
vir marcado como compartilhado (RNF-37, DEC-13). É o requisito mais característico do produto e a
banca vai olhar para ele.

Telas de chat, agenda, medicação e prontuário ficam para a Sprint 3.

---

## 7. Acessibilidade, que é critério de avaliação

A atividade pede interface "responsiva, intuitiva e acessível", e o RNF-35 dá o número: **alvo de
toque de 44 pontos**. Isso é mais fácil de acertar enquanto o componente está sendo criado do que
de corrigir em vinte telas depois.

Junto com isso, desde o começo: rótulo de acessibilidade em todo controle, contraste conferido na
paleta acima, e texto que cresce sem quebrar o layout.

---

## 8. Quando algo não sobe

| Sintoma | Causa provável |
|---------|----------------|
| Erro de rede genérico no celular | Android 9+ bloqueia `http://` sem TLS — decisão **DA-03**, só importa na integração |
| App não acha o backend | O celular não enxerga o `localhost` do notebook — decisão **DA-01** |
| Data aparece errada na tela | O mock devolveu `Z` em vez de offset `-03:00` — ver seção 4 |
| Lista não renderiza | O mock devolveu array solto em vez de `{data, meta}` — ver seção 4 |
