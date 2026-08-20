-- =====================================================================
-- Provas do modelo de dados
--
-- Nao e a suite de testes do projeto, que sera automatizada na semana 4.
-- E a demonstracao de que as duas regras mais criticas do produto sao
-- garantidas pelo BANCO, e nao por disciplina de quem programa.
--
-- Como rodar:
--   mysql -u root tcc_schema_test < testes-do-modelo.sql
-- =====================================================================

-- ------------------------- massa minima -------------------------------
INSERT INTO users (id, name, email, password_hash, role) VALUES
  (1, 'Paciente de teste',  'paciente@teste.local',  'hash', 'patient'),
  (2, 'Psicologa Um',       'psi1@teste.local',      'hash', 'psychologist'),
  (3, 'Psicologo Dois',     'psi2@teste.local',      'hash', 'psychologist');

INSERT INTO patients (id, user_id) VALUES (1, 1);
INSERT INTO psychologists (id, user_id, crp_number, crp_region, approval_status)
  VALUES (1, 2, '123456', '06', 'approved'), (2, 3, '654321', '06', 'approved');

-- =====================================================================
-- PROVA 1  (RF-12, DEC-03, RNF-50)
-- Um paciente nao pode ter dois vinculos ativos ao mesmo tempo.
-- =====================================================================

INSERT INTO bonds (id, patient_id, psychologist_id, status, origin)
  VALUES (1, 1, 1, 'active', 'invitation');
SELECT 'PROVA 1a: primeiro vinculo ativo criado' AS resultado;

-- A linha abaixo DEVE falhar com erro 1062 (Duplicate entry).
-- Se ela passar, o modelo esta errado e o RF-12 nao esta garantido.
INSERT INTO bonds (id, patient_id, psychologist_id, status, origin)
  VALUES (2, 1, 2, 'active', 'catalog');

-- O veredito olha o estado do banco, nao a ordem das linhas: assim a prova
-- diz a verdade tanto se o cliente abortar no erro quanto se seguir com --force.
SELECT CASE WHEN COUNT(*) = 1
            THEN 'PROVA 1b OK: o banco recusou o segundo vinculo ativo'
            ELSE CONCAT('PROVA 1b FALHOU: existem ', COUNT(*), ' vinculos ativos')
       END AS veredito
  FROM bonds WHERE status = 'active' AND patient_id = 1;

-- =====================================================================
-- PROVA 2  (RF-12, CA-13.3)
-- Encerrado o primeiro vinculo, o paciente pode ter outro ativo.
-- =====================================================================

UPDATE bonds SET status = 'ended', ended_at = NOW() WHERE id = 1;
INSERT INTO bonds (id, patient_id, psychologist_id, status, origin)
  VALUES (3, 1, 2, 'active', 'catalog');
SELECT 'PROVA 2 OK: apos encerrar, o novo vinculo ativo foi aceito' AS resultado;

-- =====================================================================
-- PROVA 3  (RF-23, DEC-12, DEC-14, RNF-08)
-- O relato privado nao aparece na view que o lado do psicologo consulta,
-- nem no conteudo, nem na contagem.
-- =====================================================================

INSERT INTO reports (id, bond_id, patient_id, body, visibility) VALUES
  (1, 3, 1, 'Relato compartilhado numero um', 'shared'),
  (2, 3, 1, 'SEGREDO: este relato e privado',  'private'),
  (3, 3, 1, 'Relato compartilhado numero dois','shared'),
  (4, 3, 1, 'Relato que sera despublicado',    'shared');

UPDATE reports SET unpublished_at = NOW() WHERE id = 4;   -- RF-24

SELECT 'PROVA 3: contagens' AS resultado;
SELECT
  (SELECT COUNT(*) FROM reports        WHERE bond_id = 3) AS total_real,
  (SELECT COUNT(*) FROM shared_reports WHERE bond_id = 3) AS visivel_ao_psicologo,
  CASE WHEN (SELECT COUNT(*) FROM shared_reports WHERE bond_id = 3) = 2
       THEN 'OK: psicologo ve 2 de 4' ELSE 'FALHOU' END AS veredito;

SELECT 'PROVA 3b: nenhum relato privado vaza na view' AS resultado;
SELECT CASE WHEN COUNT(*) = 0 THEN 'OK: nenhuma linha privada na view' ELSE 'FALHOU' END AS veredito
  FROM shared_reports WHERE body LIKE 'SEGREDO%';

-- =====================================================================
-- PROVA 4  (RNF-05)
-- Codigo de convite e de uso unico, garantido por indice.
-- =====================================================================

INSERT INTO invitations (id, psychologist_id, code, expires_at)
  VALUES (1, 1, 'K7M9PQ', NOW() + INTERVAL 7 DAY);
SELECT 'PROVA 4a: convite criado' AS resultado;

-- A linha abaixo DEVE falhar com erro 1062.
INSERT INTO invitations (id, psychologist_id, code, expires_at)
  VALUES (2, 2, 'K7M9PQ', NOW() + INTERVAL 7 DAY);

SELECT CASE WHEN COUNT(*) = 1
            THEN 'PROVA 4b OK: o banco recusou o codigo repetido'
            ELSE CONCAT('PROVA 4b FALHOU: existem ', COUNT(*), ' convites com o mesmo codigo')
       END AS veredito
  FROM invitations WHERE code = 'K7M9PQ';
