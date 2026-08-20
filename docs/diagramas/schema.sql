-- =====================================================================
-- Plataforma de apoio a relacao paciente e psicologo
-- TCC Tecnico em Desenvolvimento de Sistemas, SENAI-SP, 4o termo
--
-- DER executavel. Testado em MariaDB 10.4 (XAMPP).
-- Identificadores em ingles (DP-14). Texto de usuario em portugues.
--
-- Este arquivo e a fonte de verdade do modelo. As migrations do Laravel
-- devem reproduzi-lo, nao divergir dele.
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP VIEW  IF EXISTS shared_reports;
DROP TABLE IF EXISTS notification_preferences, notifications, complaints, audit_logs,
                     analysis_versions, analysis_reports, analyses,
                     medication_intakes, medication_schedules, medications,
                     appointments, messages, tasks, reports,
                     contract_acceptances, service_contracts,
                     bonds, invitations,
                     consent_acceptances, consent_terms,
                     psychologist_documents, psychologists, patients, users;

SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- 1. Identidade e papeis  (RF-01, RF-02, RF-05, RF-45)
-- ---------------------------------------------------------------------

CREATE TABLE users (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(150)    NOT NULL,
  email           VARCHAR(190)    NOT NULL,
  password_hash   VARCHAR(255)    NOT NULL,          -- RNF-07: irreversivel, nunca exibido
  role            ENUM('patient','psychologist','admin') NOT NULL,
  status          ENUM('active','suspended') NOT NULL DEFAULT 'active', -- RF-45
  suspended_at    DATETIME        NULL,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email),
  KEY ix_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE patients (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  birth_date  DATE         NULL,
  phone       VARCHAR(20)  NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_patients_user (user_id),
  CONSTRAINT fk_patients_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- RF-33: registro profissional. RF-34: perfil publicado pelo proprio psicologo.
-- RF-44: aprovacao pelo administrador antes de o perfil ir ao ar.
CREATE TABLE psychologists (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id             INT UNSIGNED NOT NULL,
  crp_number          VARCHAR(20)  NOT NULL,
  crp_region          VARCHAR(5)   NOT NULL,
  approval_status     ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  approval_note       TEXT         NULL,             -- CA-44.3: justificativa obrigatoria na reprovacao
  approved_by_user_id INT UNSIGNED NULL,
  approval_decided_at DATETIME     NULL,
  profile_approach    VARCHAR(120) NULL,             -- RF-09: filtro de abordagem
  profile_specialty   VARCHAR(120) NULL,
  profile_modality    ENUM('online','presencial','ambos') NULL,
  profile_region      VARCHAR(120) NULL,
  profile_bio         TEXT         NULL,             -- RF-34: escrito pelo profissional, nunca gerado
  profile_published_at DATETIME    NULL,             -- CA-34.2: sem isso nao aparece no catalogo
  created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_psychologists_user (user_id),
  UNIQUE KEY uq_psychologists_crp (crp_region, crp_number),
  KEY ix_psy_catalog (approval_status, profile_published_at),
  CONSTRAINT fk_psy_user     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_psy_approver FOREIGN KEY (approved_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- RNF-11: acessivel so ao administrador e ao proprio dono, nunca no catalogo
CREATE TABLE psychologist_documents (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  psychologist_id INT UNSIGNED NOT NULL,
  file_path       VARCHAR(255) NOT NULL,
  original_name   VARCHAR(255) NOT NULL,
  mime_type       VARCHAR(100) NOT NULL,
  uploaded_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_docs_psy (psychologist_id),
  CONSTRAINT fk_docs_psy FOREIGN KEY (psychologist_id) REFERENCES psychologists(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. Consentimento versionado  (RF-03, RF-04, RF-46, RNF-13)
-- ---------------------------------------------------------------------

CREATE TABLE consent_terms (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  type              ENUM('general','ai_analysis') NOT NULL,  -- RF-04: consentimento de IA e separado
  version           VARCHAR(20)  NOT NULL,
  body              MEDIUMTEXT   NOT NULL,
  effective_from    DATETIME     NOT NULL,
  published_by_user_id INT UNSIGNED NULL,
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_terms_type_version (type, version),        -- CA-46.2: versao publicada nao se edita
  CONSTRAINT fk_terms_publisher FOREIGN KEY (published_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE consent_acceptances (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED NOT NULL,
  consent_term_id INT UNSIGNED NOT NULL,
  accepted_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at      DATETIME     NULL,                        -- CA-04.3: revogacao sem efeito retroativo
  UNIQUE KEY uq_acceptance (user_id, consent_term_id),
  KEY ix_acceptance_user (user_id, revoked_at),
  CONSTRAINT fk_acc_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_acc_term FOREIGN KEY (consent_term_id) REFERENCES consent_terms(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. Convite e vinculo  (RF-06 a RF-14, RNF-05, RNF-06)
-- ---------------------------------------------------------------------

CREATE TABLE invitations (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  psychologist_id INT UNSIGNED NOT NULL,
  code            VARCHAR(12)  NOT NULL,     -- RNF-05: aleatorio, alfabeto sem 0/O e 1/I/l
  expires_at      DATETIME     NOT NULL,     -- RNF-05: prazo definido
  consumed_at     DATETIME     NULL,         -- CA-07.1: uso unico
  consumed_by_patient_id INT UNSIGNED NULL,
  revoked_at      DATETIME     NULL,         -- RF-08
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_invitation_code (code),
  KEY ix_invitation_psy (psychologist_id, consumed_at),
  CONSTRAINT fk_inv_psy     FOREIGN KEY (psychologist_id) REFERENCES psychologists(id) ON DELETE CASCADE,
  CONSTRAINT fk_inv_patient FOREIGN KEY (consumed_by_patient_id) REFERENCES patients(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- RF-12 e DEC-03: no maximo 1 vinculo ativo por paciente, N por psicologo.
-- A coluna gerada active_patient_id vale o id do paciente so quando o vinculo
-- esta ativo, e o indice unico sobre ela impede o segundo ativo. Fora do
-- estado 'active' ela vale NULL, e NULL nao colide em indice unico.
-- Assim a regra vive no banco e sobrevive a duas requisicoes simultaneas.
CREATE TABLE bonds (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id      INT UNSIGNED NOT NULL,
  psychologist_id INT UNSIGNED NOT NULL,
  status          ENUM('pending','active','ended') NOT NULL DEFAULT 'pending',
  origin          ENUM('invitation','catalog') NOT NULL,
  invitation_id   INT UNSIGNED NULL,
  requested_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  responded_at    DATETIME     NULL,
  ended_at        DATETIME     NULL,
  ended_by_user_id INT UNSIGNED NULL,
  active_patient_id INT UNSIGNED AS (IF(status = 'active', patient_id, NULL)) PERSISTENT,
  UNIQUE KEY uq_one_active_bond_per_patient (active_patient_id),
  KEY ix_bond_psy (psychologist_id, status),
  KEY ix_bond_patient (patient_id, status),
  CONSTRAINT fk_bond_patient FOREIGN KEY (patient_id) REFERENCES patients(id),
  CONSTRAINT fk_bond_psy     FOREIGN KEY (psychologist_id) REFERENCES psychologists(id),
  CONSTRAINT fk_bond_inv     FOREIGN KEY (invitation_id) REFERENCES invitations(id) ON DELETE SET NULL,
  CONSTRAINT fk_bond_ender   FOREIGN KEY (ended_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- RF-48 e RNF-24: contrato de prestacao de servicos, exigido pela Resolucao CFP 9/2024
CREATE TABLE service_contracts (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  version        VARCHAR(20) NOT NULL,
  body           MEDIUMTEXT  NOT NULL,
  effective_from DATETIME    NOT NULL,
  UNIQUE KEY uq_contract_version (version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE contract_acceptances (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  bond_id             INT UNSIGNED NOT NULL,
  user_id             INT UNSIGNED NOT NULL,
  service_contract_id INT UNSIGNED NOT NULL,
  accepted_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_contract_acceptance (bond_id, user_id, service_contract_id),
  CONSTRAINT fk_ca_bond     FOREIGN KEY (bond_id) REFERENCES bonds(id) ON DELETE CASCADE,
  CONSTRAINT fk_ca_user     FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_ca_contract FOREIGN KEY (service_contract_id) REFERENCES service_contracts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. Relato e a garantia de privacidade  (RF-22, RF-23, RF-24, RNF-08)
-- ---------------------------------------------------------------------

CREATE TABLE reports (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  bond_id        INT UNSIGNED NOT NULL,
  patient_id     INT UNSIGNED NOT NULL,
  body           MEDIUMTEXT   NOT NULL,
  visibility     ENUM('shared','private') NOT NULL DEFAULT 'shared', -- DEC-13: padrao compartilhado
  unpublished_at DATETIME     NULL,          -- RF-24: despublicado pelo paciente
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_reports_bond_period (bond_id, created_at),
  KEY ix_reports_visibility (bond_id, visibility, created_at),
  CONSTRAINT fk_reports_bond    FOREIGN KEY (bond_id) REFERENCES bonds(id) ON DELETE CASCADE,
  CONSTRAINT fk_reports_patient FOREIGN KEY (patient_id) REFERENCES patients(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- RNF-08: TODA consulta do lado do psicologo e TODA rotina que monta o pacote
-- enviado ao servico de IA leem esta view, e nunca a tabela reports.
-- O relato privado nao aparece aqui nem no conteudo, nem na contagem.
CREATE VIEW shared_reports AS
  SELECT id, bond_id, patient_id, body, created_at
    FROM reports
   WHERE visibility = 'shared'
     AND unpublished_at IS NULL;

-- ---------------------------------------------------------------------
-- 5. Ciclo semanal: tarefa, mensagem, consulta  (RF-15, RF-25, RF-26, RF-37, RF-40)
-- ---------------------------------------------------------------------

CREATE TABLE tasks (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  bond_id            INT UNSIGNED NOT NULL,
  title              VARCHAR(150) NOT NULL,
  description        TEXT         NULL,
  due_date           DATE         NOT NULL,   -- CA-37.3: prazo nao pode ser no passado
  created_by_user_id INT UNSIGNED NOT NULL,
  completed_at       DATETIME     NULL,       -- CA-25.3: nao duplica conclusao
  archived_at        DATETIME     NULL,       -- CA-37.4: arquiva em vez de excluir
  created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_tasks_bond (bond_id, completed_at, due_date),
  CONSTRAINT fk_tasks_bond    FOREIGN KEY (bond_id) REFERENCES bonds(id) ON DELETE CASCADE,
  CONSTRAINT fk_tasks_creator FOREIGN KEY (created_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE messages (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  bond_id        INT UNSIGNED NOT NULL,
  sender_user_id INT UNSIGNED NOT NULL,
  body           TEXT         NOT NULL,
  sent_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at        DATETIME     NULL,
  KEY ix_messages_bond (bond_id, sent_at),
  KEY ix_messages_unread (bond_id, read_at),
  CONSTRAINT fk_msg_bond   FOREIGN KEY (bond_id) REFERENCES bonds(id) ON DELETE CASCADE,
  CONSTRAINT fk_msg_sender FOREIGN KEY (sender_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE appointments (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  bond_id            INT UNSIGNED NOT NULL,
  scheduled_at       DATETIME     NOT NULL,
  status             ENUM('scheduled','rescheduled','cancelled','done') NOT NULL DEFAULT 'scheduled',
  modality           ENUM('online','presencial') NULL,
  notes              VARCHAR(255) NULL,
  created_by_user_id INT UNSIGNED NOT NULL,
  created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY ix_appt_bond (bond_id, scheduled_at),
  KEY ix_appt_conflict (created_by_user_id, scheduled_at),   -- CA-40.3: deteccao de conflito
  CONSTRAINT fk_appt_bond    FOREIGN KEY (bond_id) REFERENCES bonds(id) ON DELETE CASCADE,
  CONSTRAINT fk_appt_creator FOREIGN KEY (created_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 6. Medicacao em uso  (RF-27, RF-28, RF-29, RF-38, RF-39, DEC-10)
-- A plataforma NAO prescreve. O psicologo registra medicacao ja prescrita
-- por medico, com origem obrigatoria, e o paciente confirma.
-- ---------------------------------------------------------------------

CREATE TABLE medications (
  id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  bond_id              INT UNSIGNED NOT NULL,
  name                 VARCHAR(150) NOT NULL,
  dosage               VARCHAR(100) NULL,
  prescription_source  VARCHAR(200) NOT NULL,   -- CA-38.2: obrigatorio, quem prescreveu
  status               ENUM('awaiting_confirmation','active','refused','suspended')
                         NOT NULL DEFAULT 'awaiting_confirmation',
  registered_by_user_id INT UNSIGNED NOT NULL,
  confirmed_at         DATETIME     NULL,
  refused_at           DATETIME     NULL,
  refusal_reason       TEXT         NULL,       -- CA-27.4: motivo obrigatorio na recusa
  suspended_at         DATETIME     NULL,
  suspended_by_user_id INT UNSIGNED NULL,       -- CA-29.2: visivel ao psicologo de quem partiu
  created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_med_bond (bond_id, status),
  CONSTRAINT fk_med_bond      FOREIGN KEY (bond_id) REFERENCES bonds(id) ON DELETE CASCADE,
  CONSTRAINT fk_med_registrar FOREIGN KEY (registered_by_user_id) REFERENCES users(id),
  CONSTRAINT fk_med_suspender FOREIGN KEY (suspended_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE medication_schedules (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  medication_id INT UNSIGNED NOT NULL,
  weekday       TINYINT UNSIGNED NOT NULL,   -- 0 domingo a 6 sabado
  time_of_day   TIME         NOT NULL,
  UNIQUE KEY uq_med_schedule (medication_id, weekday, time_of_day),
  CONSTRAINT fk_sched_med FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CA-28.4: ausencia de linha significa nao marcado. O sistema nunca presume a tomada.
CREATE TABLE medication_intakes (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  medication_id INT UNSIGNED NOT NULL,
  scheduled_for DATETIME     NOT NULL,
  marked_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_intake (medication_id, scheduled_for),
  CONSTRAINT fk_intake_med FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 7. Analise por IA  (RF-41, RF-42, RNF-30 a RNF-33)
-- A analise so roda quando o psicologo pede, e nada vai ao prontuario
-- sem a confirmacao dele.
-- ---------------------------------------------------------------------

CREATE TABLE analyses (
  id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  bond_id              INT UNSIGNED NOT NULL,
  requested_by_user_id INT UNSIGNED NOT NULL,   -- RNF-30: sempre humano, nunca rotina
  period_start         DATE         NOT NULL,
  period_end           DATE         NOT NULL,
  status               ENUM('generated','confirmed','discarded') NOT NULL DEFAULT 'generated',
  summary_raw          MEDIUMTEXT   NULL,       -- CA-42.2: apagado no descarte
  requested_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  confirmed_at         DATETIME     NULL,
  KEY ix_analyses_bond (bond_id, requested_at),
  CONSTRAINT fk_analyses_bond      FOREIGN KEY (bond_id) REFERENCES bonds(id) ON DELETE CASCADE,
  CONSTRAINT fk_analyses_requester FOREIGN KEY (requested_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CA-24.2: e daqui que sai o aviso de que o relato ja foi usado em uma analise
CREATE TABLE analysis_reports (
  analysis_id INT UNSIGNED NOT NULL,
  report_id   INT UNSIGNED NOT NULL,
  PRIMARY KEY (analysis_id, report_id),
  KEY ix_ar_report (report_id),
  CONSTRAINT fk_ar_analysis FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE,
  CONSTRAINT fk_ar_report   FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CA-42.4: cada edicao posterior preserva a versao anterior
CREATE TABLE analysis_versions (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  analysis_id    INT UNSIGNED NOT NULL,
  body           MEDIUMTEXT   NOT NULL,
  edited_by_user_id INT UNSIGNED NOT NULL,
  edited_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_av_analysis (analysis_id, edited_at),
  CONSTRAINT fk_av_analysis FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE,
  CONSTRAINT fk_av_editor   FOREIGN KEY (edited_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 8. Auditoria, denuncia e notificacao  (RF-16, RF-17, RF-18, RF-45, RNF-04)
-- ---------------------------------------------------------------------

-- CA-17.3: somente insercao. A aplicacao nunca altera nem apaga linha daqui.
CREATE TABLE audit_logs (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  actor_user_id     INT UNSIGNED NULL,
  action            VARCHAR(60)  NOT NULL,
  resource_type     VARCHAR(60)  NOT NULL,
  resource_id       INT UNSIGNED NULL,
  target_patient_id INT UNSIGNED NULL,
  result            ENUM('allowed','denied') NOT NULL,   -- CA-05.2 e CA-23.5: tentativa negada tambem entra
  occurred_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_audit_actor (actor_user_id, occurred_at),
  KEY ix_audit_target (target_patient_id, occurred_at),
  CONSTRAINT fk_audit_actor  FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_audit_target FOREIGN KEY (target_patient_id) REFERENCES patients(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE complaints (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reporter_user_id  INT UNSIGNED NOT NULL,
  reported_user_id  INT UNSIGNED NOT NULL,
  reason            VARCHAR(120) NOT NULL,     -- CA-18.2: motivo obrigatorio
  description       TEXT         NULL,
  status            ENUM('open','closed','reopened') NOT NULL DEFAULT 'open',
  decision          TEXT         NULL,
  decided_by_user_id INT UNSIGNED NULL,
  decided_at        DATETIME     NULL,
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_complaints_status (status, created_at),
  CONSTRAINT fk_comp_reporter FOREIGN KEY (reporter_user_id) REFERENCES users(id),
  CONSTRAINT fk_comp_reported FOREIGN KEY (reported_user_id) REFERENCES users(id),
  CONSTRAINT fk_comp_decider  FOREIGN KEY (decided_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CA-16.1: a notificacao carrega o tipo do evento, nunca conteudo clinico
CREATE TABLE notifications (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  type       VARCHAR(60)  NOT NULL,
  resource_id INT UNSIGNED NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at    DATETIME     NULL,
  KEY ix_notif_user (user_id, read_at, created_at),
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notification_preferences (
  user_id INT UNSIGNED NOT NULL,
  type    VARCHAR(60)  NOT NULL,
  enabled TINYINT(1)   NOT NULL DEFAULT 1,     -- CA-16.2
  PRIMARY KEY (user_id, type),
  CONSTRAINT fk_notifpref_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
