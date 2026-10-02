# Regras invioláveis

**Cole este arquivo no contexto da sua ferramenta de IA antes de pedir código.** Ele é curto de
propósito.

Cada item aqui vem de um requisito do [`../documento-requisitos.md`](../documento-requisitos.md),
de uma restrição legal ou de uma decisão fechada do grupo. Nenhum é preferência de estilo. Quebrar
qualquer um destes é item de revisão de Pull Request, e PR que quebra um volta.

---

## Privacidade e o coração do produto

**1. Nenhuma rota sob `/psychologist` ou `/admin` consulta a tabela `reports`.** Todas leem a view
`shared_reports`, definida em [`../diagramas/schema.sql`](../diagramas/schema.sql). O relato
privado não aparece ali nem no conteúdo, nem na contagem. É o RNF-08, e é o teste mais importante
do projeto inteiro. A mesma regra vale para a rotina que monta o pacote enviado ao serviço de IA,
na Sprint 3.

**2. Relato privado pedido pelo psicólogo responde 404, nunca 403.** O 403 confirmaria que existe
alguma coisa ali. O CA-23.5 exige que nem a existência seja perceptível. O mesmo vale para relato
de paciente sem vínculo ativo e para recurso de outro paciente.

**3. `meta.total` conta apenas o que aquele perfil pode ver.** Um total que somasse relatos
privados denunciaria a existência deles e quebraria o CA-23.2. Vale para toda agregação, não só
para contagem de lista.

**4. A escolha entre relato compartilhado e privado aparece no momento da postagem, visível sem
rolagem, com o padrão em compartilhado.** RNF-37 e DEC-13. É o requisito mais característico do
produto e a banca vai olhar para ele.

**5. Consentimento registrado antes de qualquer dado clínico.** Nenhum relato, mensagem ou
registro de medicação pode ser gravado antes do aceite existir na base. RNF-12 e LGPD art. 11.

## Formato da API, igual em todo endpoint

**6. Erro sempre neste formato**, com `errors` só em erro de validação:

```json
{ "message": "Mensagem em portugues, para o usuario ler", "errors": { "email": ["Este campo e obrigatorio."] } }
```

A mensagem nunca expõe nome de tabela, trecho de exceção nem detalhe interno. RNF-10 e RNF-40.

**7. Data sempre ISO 8601 com offset:** `2026-10-02T21:30:00-03:00`. Nunca UTC com `Z`, nunca
`02/10/2026`. Formatar para o usuário é trabalho da tela. Decisão **DA-06**, fechada em
02/10/2026: o contrato manda e o Laravel se ajusta a ele.

**8. Lista sempre com `{data, meta}`, e `meta` é exatamente `{total, page, per_page}`.** Nunca
`current_page`, `last_page`, `links` ou `path`. Decisão **DA-07**, fechada em 02/10/2026.

**9. Toda rota começa com `/api/v1`.** O app instalado no celular não atualiza junto com o
servidor: um app antigo continuará chamando `v1` depois de o `v2` existir. RNF-58.

## Segurança

**10. `reports.body` e `messages.body` são cifrados em repouso**, com cast `encrypted` na Model.
RNF-02, verificado lendo o banco por fora da aplicação. A view `shared_reports` repassa o campo e
funciona normalmente, mas **a Model que lê a view também precisa do cast**, senão volta texto
cifrado para a tela.

**11. Senha nunca sai, nunca aparece em log, nunca volta em resposta.** Armazenada de forma
irreversível. RNF-07. O token aparece em exatamente um lugar: o corpo da resposta do login.

**12. Segredo nenhum entra no repositório.** Chave, senha de banco, chave de API: tudo em `.env`,
que está no `.gitignore`. O `.env.example` vai versionado, com os valores vazios. RNF-56, cuja
verificação é varredura do repositório com resultado esperado **zero**.

**13. O token fica no armazenamento seguro do aparelho** — Keystore no Android, Keychain no iOS.
Nunca em `AsyncStorage`, que é texto puro e violaria o RNF-07.

**14. A URL da API vem de variável de ambiente, nunca fixa no código.** APK apontando para o IP do
notebook de alguém funciona na casa dessa pessoa e morre no dia da apresentação.

**15. Toda entrada do usuário é validada antes de uso.** FormRequest no backend, sem exceção.
RNF-10.

## Regras de negócio que vivem no banco, não no código

**16. No máximo 1 vínculo ativo por paciente.** Garantido pela coluna gerada `active_patient_id` e
pelo índice único `uq_one_active_bond_per_patient`, não por `if` no Controller. É o que faz a regra
sobreviver a duas requisições simultâneas. RF-12, DEC-03 e RNF-50. Segundo vínculo ativo responde
**409**.

**17. Código de convite: 8 caracteres, alfabeto sem `0/O` e sem `1/I/l`, aleatório e não derivável
de dado do psicólogo, uso único, expira em 7 dias, revogável a qualquer momento pelo emissor.**
RNF-05 e RF-08. Decisão **DA-08**, fechada em 02/10/2026. O prazo é parâmetro de configuração, não
número solto no meio do código.

**18. Validação de convite é limitada por tentativa:** 5 por 15 minutos, com bloqueio temporário
ao exceder. RNF-06.

**19. A trilha de auditoria é somente de inclusão.** A aplicação nunca altera nem apaga linha de
`audit_logs`. Tentativa negada também entra, com `result = 'denied'`. CA-17.3, CA-05.2 e CA-23.5.

## Os quatro compromissos que o produto não quebra

Estes definem o produto. Não são detalhe de implementação.

**20. A IA nunca age sozinha.** A análise só roda por ação explícita do psicólogo — nunca por
agendamento, gatilho automático ou iniciativa do serviço. Nada vai ao prontuário sem confirmação
dele. RNF-30 e RNF-31. Sprint 3, mas nenhuma estrutura criada agora pode abrir essa porta.

**21. A plataforma não prescreve.** O vocabulário é **"registrar medicação em uso"** e **"lembrete
de adesão"**. Em nenhum ponto, nem em comentário de código, nem em texto de tela, aparece
"prescrever" ou "atribuir remédio". RNF-36 e RNF-26.

**22. Sem preço, sem nota, sem estrela, sem ranking, sem ordenação por reputação** — em nenhuma
tela, em nenhum campo do contrato, em nenhuma coluna do banco, nem na landing page. Não é
preferência do grupo: é restrição do Conselho Federal de Psicologia. RNF-21 e RNF-23. Requisição
pedindo ordenação por preço é **recusada**, não ignorada.

**23. O perfil público do psicólogo é escrito pelo próprio profissional.** Nunca gerado pela
plataforma, nunca por serviço de IA. Perfil publicado exibe nome completo, sigla do conselho e
número de registro, de forma não ocultável. RNF-20 e RNF-22, art. 20 do Código de Ética.

## Arquitetura e código

**24. Regra de negócio vive só no Laravel.** O app e o painel Blade apenas chamam. Quem decide se
um relato é privado, se um vínculo pode existir ou se a análise pode rodar é o servidor. RNF-57
proíbe regra duplicada nos clientes, e o motivo é prático: regra em dois lugares vira regra
diferente em dois lugares.

**25. Identificadores em inglês, texto de usuário em português.** Variável, função, tabela, coluna,
campo de API: inglês. Tudo que o usuário lê: português. RNF-52, sem mistura.

**26. As migrations reproduzem o [`../diagramas/schema.sql`](../diagramas/schema.sql), não
divergem dele.** Aquele arquivo é a fonte de verdade do modelo, já foi executado e testado. Se o
modelo precisar mudar, muda lá primeiro, com o DER atualizado junto.

**27. O sistema opera exclusivamente com dados fictícios.** Nenhum dado de paciente real em
nenhum ambiente, em nenhum seeder, em nenhuma captura de tela do documento. RNF-63.

---

## Se você precisar quebrar alguma

Acontece: aparece um caso que a regra não previu. O caminho é **avisar no grupo e registrar a
exceção**, não decidir sozinho no meio do commit. Regra quebrada em silêncio é regra que ninguém
sabe que não vale mais.
