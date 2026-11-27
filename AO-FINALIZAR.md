# Ao finalizar o desenvolvimento

**Fazer quando o desenvolvimento estiver concluído.** Registrado em 27/11/2026.

## Situação

| Branch | Conteúdo | Estado |
|--------|----------|--------|
| `sprint/1` | Repositório na entrega de 24/09 (`48d48fc`) | Criada |
| `sprint/2` | Repositório na entrega de 23/10 (`90ba5a6`) | Criada |
| `sprint/3` | Entrega final | **Falta criar** |

## Checklist

- [ ] Confirmar que o conteúdo final está concluído: sistema, ABNT, manuais, relatório de testes e slides.
- [ ] Montar a lista de arquivos e a estrutura da `sprint/3` e aprovar antes de criar a branch.
- [ ] Escrever a documentação da entrega final.
- [ ] Criar a `sprint/3` a partir da `main`, com a limpeza em commit por cima do histórico.
- [ ] Conferir links quebrados e se o sistema roda a partir da `sprint/3`.
- [ ] Apagar as branches pessoais (seção abaixo).
- [ ] Apagar este arquivo da `main`.

## Como deve ser a `sprint/3`

**Só arquivos definitivos**, sem nada de fase de desenvolvimento. A documentação é escrita pelo estado final do projeto, não é a atual com arquivos apagados:

- descreve o que o sistema faz, como funciona e como rodar;
- não traz "falta fazer", datas de marco, decisões em aberto nem divisão de tarefas;
- requisitos, identidade visual e diagramas continuam, revisados para o que foi entregue, com o que ficou de fora declarado como evolução futura.

O histórico de commits é preservado, porque a contribuição de cada integrante é avaliada.

### Proposta inicial do que fica e do que sai

| Fica | Sai |
|------|-----|
| `app/`, `backend/`, `landing/`, `proxy/` | `Sprint2.md`, `FinalSprint3.md` e este arquivo |
| `README.md` e `CONTRIBUTING.md` | `docs/planejamento/` |
| Requisitos, identidade visual, modelo de negócio e diagramas | `docs/documento-base-sprint1.md` |
| Contrato da API e coleção do Postman | `docs/api/rodar-newman-sprint2.ps1` |
| Guias de engenharia e hospedagem | Evidências intermediárias em `docs/testes/` |
| ABNT, manuais, slides e relatório de testes final | `docs/prototipo/telas-pdf/`, wireframes e scripts do Figma |
| Protótipo de 25/11 e logo | Roteiros de entrevista e de gravação |

Antes de remover sínteses da pesquisa, log de etapas ou evidências de teste, conferir se o ABNT e o relatório de testes dependem deles.

## Branches pessoais

`Caio`, `Mariana`, `PZ`, `Rafael`, `Ribeiro` e `Zanetti`: não mexer antes do fim do desenvolvimento.

Na hora de apagar:

1. Pedir ao grupo que envie o que estiver só na própria máquina.
2. Conferir cada branch. O resultado precisa ser `0` para apagar sem perder commit:

```bash
git fetch --prune origin
git rev-list --count origin/main..origin/<branch>
```

Em 27/11 as seis davam `0`.
