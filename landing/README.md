# landing

Página de divulgação do Calmind. Aparece na tabela de stack do `README.md` da raiz e na semana 11 do cronograma.

A implementação em HTML e CSS está disponível em `index.html`, com estilos em `style.css` e imagens e fontes locais em `assets/`. Abra `index.html` no navegador para visualizar a página. Login e cadastro são demonstrativos.

## O que ela pode e o que ela não pode dizer

O Calmind divulga profissionais de psicologia, então a landing herda as mesmas restrições do catálogo, que não são preferência do grupo e sim exigência do Conselho Federal de Psicologia:

- Sem preço, sem promoção, sem comparação de valores.
- Sem nota, sem estrela, sem ranking de profissional.
- Sem promessa de resultado terapêutico.
- Se citar profissional, com nome completo e CRP, conforme o art. 20 do Código de Ética.

O contexto completo está na seção 7 do [`../docs/documento-base-sprint1.md`](../docs/documento-base-sprint1.md).

Vale dizer também, com todas as letras, que o projeto é acadêmico e opera só com dados fictícios.

## Páginas

Além do `index.html`, o rodapé leva a páginas próprias, todas com o mesmo header, footer e estilos (`style.css`) e o script `site.js`:

| Rota | Conteúdo |
|---|---|
| `politica-de-privacidade.html` | Política de Privacidade |
| `termos-de-uso.html` | Termos de Uso |
| `lgpd.html` | Direitos do titular, bases legais e como pedir acesso ou exclusão |
| `codigo-de-etica.html` | Código de Ética do Calmind |
| `fale-com-a-gente.html` | Canais de contato e formulário |
| `imprensa.html` | Kit de imprensa |
| `trabalhe-conosco.html` | Vagas e banco de talentos |
| `precos.html` | Gratuidade para o paciente (sem valores de profissionais) |

Os textos de Privacidade, Termos, LGPD e Código de Ética são conteúdo-base e precisam de revisão jurídica antes de qualquer uso real. Os e-mails `@calmind.example` são canais de demonstração, e o formulário de contato não envia nada: ele monta a mensagem para abrir no e-mail ou copiar.
