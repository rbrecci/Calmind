# app

**React Native.** O aplicativo do paciente e do psicólogo, um app só, com telas por papel.

Entra aqui na semana 1 da Sprint 2 (24/08), junto com o spike. Até lá esta pasta tem só este arquivo.

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
