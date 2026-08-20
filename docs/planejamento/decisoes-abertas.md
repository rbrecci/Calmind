# Decisões abertas

**TCC · Técnico em Desenvolvimento de Sistemas · SENAI-SP · 4º termo**
**Calmind** — Saúde Mental & Acolhimento
Revisão de 20/08/2026.

> Substitui o antigo `decisoes-pendentes.md`, que foi removido na limpeza de 20/08/2026 porque estava 85% resolvido e dizia que MER e wireframes ainda não tinham começado. Este arquivo carrega só o que continua em aberto de verdade.
>
> Regra: quando uma decisão fechar, ela sai daqui e entra no documento que ela afeta. Item fechado que continua nesta lista é ruído.

---

## 1. Trava agora, antes do marco M2 de 28/08

| # | Decisão | Quem decide | Consequência de não decidir |
|---|---------|-------------|------------------------------|
| DA-01 | **Onde o app encontra o backend em desenvolvimento** — LAN com IP fixo, servidor de teste ou túnel. Era a D6 do `arranque-react-native.md` | Grupo, na segunda | O celular físico não enxerga o `localhost` do notebook. Sem isso, a prova 2 do spike não roda e a semana 1 não anda |
| DA-02 | **Identificador do pacote do app**, no formato `com.<grupo>.calmind` | Grupo | Trava o primeiro APK assinado, que é a prova 4 do spike |
| DA-03 | **Liberar tráfego sem TLS no build de desenvolvimento** | Quem montar o app | Android 9+ bloqueia `http://` por padrão. O sintoma é erro de rede genérico, que parece bug de código e come um dia |

## 2. Trava a Sprint 2

| # | Decisão | Quem decide | Prazo |
|---|---------|-------------|-------|
| DA-04 | **Provedor e modelo de IA, e onde a chave fica.** Era a DP-11 | Grupo | Antes da semana 8 |
| DA-05 | **Board do Scrum**: ferramenta e quem mantém. O repositório já está resolvido | Scrum Master | Semana 1 |
| DA-06 | **Formato da data na API**: o Laravel serializa em UTC com `Z`, o `contrato-api.md` §2.4 pede offset `-03:00`. Os dois são ISO 8601, mas a coleção do Postman testa um só | Backend | Antes do primeiro endpoint |
| DA-07 | **Formato do `meta` nas listas**: o `paginate()` do Laravel devolve `current_page`, `last_page` e outros; o contrato §2.5 escreveu `{total, page, per_page}` | Backend | Antes do primeiro endpoint de lista |
| DA-08 | **Prazo de expiração e revogação do código de convite.** São as assunções A-02, A-03 e A-09 do `documento-requisitos.md`, hoje tratadas como parâmetro de configuração | Grupo | Antes de implementar RF-06 |

## 3. Trava a Sprint 3

| # | Decisão | Quem decide | Prazo |
|---|---------|-------------|-------|
| DA-09 | **Ferramenta e template do documento ABNT.** Era a DP-17 | Nicoly e Isabela | Até o fim da Sprint 2 |
| DA-10 | **Quando o manual do usuário começa.** Era a DP-18. Manual escrito no fim custa o dobro | Nicoly e Isabela | Definir na semana 6 |

## 4. Decisões de produto que a pesquisa de campo vai responder

Estas não são decisões de mesa: já têm pergunta no `../pesquisa/roteiro-entrevistas.md` e serão respondidas pelas 4 entrevistas.

| # | Questão | Onde é perguntada |
|---|---------|-------------------|
| DA-11 | **Critérios de busca do catálogo.** É a assunção A-01, a mais antiga em aberto do projeto | P-36 com as psicólogas, C-07 com os pacientes |
| DA-12 | **O que o sistema faz diante de conteúdo de risco num relato.** Hoje nenhum RF cobre isso | P-12 e P-13 |
| DA-13 | **Teto de frequência de notificação e sigilo do texto na tela de bloqueio** | C-30 e C-31 |

## 5. A decisão que ninguém tomou e ninguém percebeu

| # | Questão | Por que é grave |
|---|---------|-----------------|
| DA-14 | **O Calmind atende menor de idade?** | Não existe ator "responsável legal" em nenhum documento, e não existe frase dizendo que o produto atende só maiores de 18. Se atender menor, mexe em vínculo, consentimento e sigilo, que são três dos quatro compromissos do produto. "Ainda não decidimos" é a pior das três respostas possíveis numa banca |

## 6. Perguntas que dependem do professor

| # | Pergunta | Situação |
|---|----------|----------|
| DA-15 | Data exata da apresentação final | Perguntar em aula |
| DA-16 | Existe versão 2026 do escopo, com pesos de nota? O rodapé do PDF diz 2024 | Perguntar em aula |
| DA-17 | Formato exato da entrega da Sprint 1: PDF único, repositório ou board | Perguntar em aula |

---

## 7. Fechadas, para não reabrir por engano

| Decisão | Fechada em | Onde vive agora |
|---------|-----------|-----------------|
| Plataforma de cada aplicativo: app mobile, painel web | 19/08/2026 | `arranque-react-native.md` D1 |
| Stack: React Native, Laravel, MySQL, Blade e Bootstrap | 19/08/2026 | `README.md`, seção Stack |
| Um repositório só, com backend, app e docs separados | 19/08/2026 | `arranque-react-native.md` D3 |
| Idioma do código: inglês nos identificadores | 19/08/2026 | `arranque-react-native.md` D4 |
| Autenticação por token em toda requisição | 19/08/2026 | `../api/contrato-api.md` §2.2 |
| Nome e slogan: Calmind — Saúde Mental & Acolhimento | 20/08/2026 | `arranque-react-native.md` D2 |
| Modelo de identidade, banco relacional, isolamento do relato privado | 19/08/2026 | `../diagramas/modelo-de-dados.md` |
| Inventário de telas e fidelidade do protótipo | 19/08/2026 | `../prototipo/wireframes.html` |
| Formalização da pesquisa de campo | 20/08/2026 | `../pesquisa/roteiro-entrevistas.md` |
| Papéis do Scrum e divisão de trabalho | 19/08/2026 | `README.md`, seção Equipe |
| Datas reais das três sprints | 18/08/2026 | `cronograma.md` |
