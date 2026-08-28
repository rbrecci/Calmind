# Calmind — Saúde Mental & Acolhimento
## Estudo do Modelo de Negócio e Operação da Marca e do Aplicativo

Este documento analisa e consolida o **Modelo de Negócio e Operação** da marca e do aplicativo **Calmind**, fundamentado estritamente nas definições estratégicas, requisitos funcionais/não funcionais e decisões ético-regulatórias estabelecidos pela equipe do projeto.

---

### 1. Contexto e Natureza do Projeto (TCC)
O **Calmind** é uma marca e plataforma idealizada como Trabalho de Conclusão de Curso (TCC) do curso Técnico em Desenvolvimento de Sistemas do **SENAI-SP** (4º termo, 2026). Por sua natureza acadêmica e de pesquisa de campo inicial, o produto:
*   **Dados fictícios:** Opera exclusivamente com dados fictícios de demonstração nos ambientes de teste.
*   **Responsável Técnico:** Não conta com psicólogo Responsável Técnico registrado no Conselho Regional de Psicologia (CRP) — limitação explicitamente declarada na documentação para fins éticos e de conformidade com a regulamentação real do setor.

---

### 2. Propósito e Hipótese Central de Valor (Value Proposition)
A premissa fundamental do Calmind é de que a qualidade do tratamento psicológico depende tanto do que acontece **"na"** consulta quanto do que acontece **"entre"** as sessões de terapia. Atualmente, o intervalo semanal entre atendimentos carece de ferramentas estruturadas de apoio, resultando em comunicação fragmentada, baixa adesão de tarefas e esquecimento de marcos importantes.

O Calmind ataca justamente este "entre-sessões", atuando como uma ponte de continuidade e acolhimento clínico:

*   **Para o Paciente:** Oferece um porto seguro digital para registros de relatos diários (diário livre), organização e marcação de tarefas prescritas, lembretes de adesão a medicações preexistentes e um canal seguro para comunicação assíncrona com seu terapeuta.
*   **Para o Psicólogo:** Atua como centralizador de gestão de pauta e histórico. Fornece uma visão consolidada do prontuário (relatos compartilhados, tarefas cumpridas e medicação) e disponibiliza resumos automáticos gerados por Inteligência Artificial sob demanda, otimizando o preparo clínico e economizando tempo de sessão antes gasto apenas com recapitulações.

---

### 3. Atores do Ecossistema
*   **Paciente:** Usuário em acompanhamento. Restrito a no máximo **1 vínculo ativo** por vez para espelhar a prática clínica e simplificar a modelagem. Idade mínima de **12 anos** (autonomia de escrita e regime de consentimento LGPD diferenciado).
*   **Psicólogo:** Profissional validado com CRP ativo (aprovado manualmente por um administrador). Pode manter **N vínculos ativos** com múltiplos pacientes.
*   **Administrador:** Perfil de controle interno. Responsável por triar e aprovar os cadastros de novos psicólogos com seus documentos e gerenciar denúncias.
*   **Responsável Legal (Não-Ator):** Não possui conta ou login. Informado de forma obrigatória para pacientes menores de idade (12 a 17 anos), sendo o consentimento obtido fora do sistema e registrado administrativamente pelo psicólogo.

---

### 4. Canais e Fluxo de Adesão (Onboarding)
O Calmind opera em duas frentes complementares de captação e onboarding:
*   **Ferramenta de Continuidade (Convite Direto):** O psicólogo que já atende o paciente fisicamente ou fora do app gera um código seguro e não-sequencial de convite. O paciente insere o código no aplicativo e o vínculo é ativado de forma direta e privada.
*   **Facilitador de Acesso (Catálogo Aberto):** Pacientes que entram no app sem um profissional associado podem navegar por um catálogo aberto, utilizando filtros clínicos legítimos (abordagem, especialidade, modalidade e região) para localizar profissionais aprovados e solicitar o vínculo diretamente na plataforma.

---

### 5. As 4 Diretrizes Éticas e Regulatórias (Diferenciais da Marca)
A marca Calmind e sua operação se diferenciam por quatro compromissos inegociáveis, traduzidos diretamente na camada de dados e na arquitetura do sistema:

1.  **Sem Lógica Comercial no Catálogo (DEC-06 / RNF-23):**
    Em total consonância com o Código de Ética do Psicólogo e resoluções dos CRPs, o aplicativo veta avaliações, notas, estrelas, depoimentos públicos ou rankings de profissionais. O catálogo serve para democratizar o acesso ético à saúde, sem mercantilizar a escolha terapêutica ou criar competições de preço.
2.  **Ausência de Transações Financeiras (DEC-07 / RF-20):**
    Não há processamento de pagamentos, taxas, cobranças ou registro de honorários dentro do ecossistema do app. Isso reduz a complexidade regulatória do projeto pedagógico e mantém o foco estritamente clínico e assistencial.
3.  **Sigilo e Privacidade de Dados por Arquitetura (DEC-12 / RNF-08):**
    A garantia do relato privado do paciente vive no banco de dados (provada por testes automatizados em cada integração), e não apenas no layout de telas. O paciente define o que deseja compartilhar. Relatos marcados como privados são invisíveis ao psicólogo, não constam na contagem do diário, não são enviados à IA e ficam restritos apenas ao dispositivo/exportação pessoal do paciente.
4.  **IA de Apoio sob Controle Humano (DEC-04 / DEC-05 / RNF-30):**
    A inteligência artificial nunca roda de forma automática, reativa ou independente. O resumo semanal de relatos compartilhados só é gerado sob iniciativa explícita e manual do psicólogo. Nenhuma análise gerada é gravada no prontuário sem a revisão, edição e confirmação intencional do profissional humano.

---

### 6. Segurança e Conformidade Legal (LGPD & CFP)
*   **Dados de Saúde:** Tratados sob regime de dados pessoais sensíveis (Art. 11, LGPD), exigindo consentimento geral destacado de saúde do paciente, além de um consentimento específico, separado e revogável a qualquer momento para o envio de dados à IA (pseudonimizados na camada de envio).
*   **Segurança de Dados:** Tráfego 100% criptografado (TLS), dados de saúde criptografados em repouso no banco e tokens de autenticação armazenados em áreas nativas seguras dos celulares (Keystore no Android e Keychain no iOS), rejeitando armazenamento em texto claro (AsyncStorage).
*   **Prescrição Responsável:** A marca se posiciona estritamente fora do escopo de prescrever medicamentos (uma atribuição estritamente médica/psiquiátrica). O psicólogo apenas registra medicações preexistentes informadas e o paciente deve confirmar voluntariamente para ativar os lembretes de tomada de dose. Telas de medicação exibem de forma permanente avisos legais claros de não-prescrição.

---
_Documento técnico gerado para formalização do ecossistema Calmind._
