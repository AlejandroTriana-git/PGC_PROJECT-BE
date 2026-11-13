-- db/schema.sql
-- Estructura de la base de datos PGC.
-- El runner (db/run.js) crea la BD y hace USE antes de ejecutar este archivo.

-- -----------------------------------------------------
-- Tablas base
-- -----------------------------------------------------

CREATE TABLE `rol` (
  `id_rol`    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name_role` VARCHAR(30) CHARACTER SET 'utf8mb4' NOT NULL,
  PRIMARY KEY (`id_rol`)
) ENGINE = InnoDB;

CREATE TABLE `users` (
  `id_user`       INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_rol`        INT UNSIGNED NOT NULL,
  `mail_user`     VARCHAR(150) NOT NULL,
  `password_user` VARCHAR(255) CHARACTER SET 'utf8mb4' NOT NULL,
  `full_name`     VARCHAR(150) NOT NULL DEFAULT '',
  PRIMARY KEY (`id_user`),
  UNIQUE INDEX `mail_user_UNIQUE` (`mail_user` ASC) VISIBLE,
  INDEX `fk_users_rol1_idx` (`id_rol` ASC) VISIBLE,
  CONSTRAINT `fk_users_rol1`
    FOREIGN KEY (`id_rol`) REFERENCES `rol` (`id_rol`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

CREATE TABLE `cycles` (
  `id_cycle`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name_cycle`       VARCHAR(50) NOT NULL,
  `max_members`      TINYINT UNSIGNED NOT NULL,
  `id_person_charge` INT UNSIGNED NULL,
  PRIMARY KEY (`id_cycle`),
  INDEX `fk_cycles_users1_idx` (`id_person_charge` ASC) VISIBLE,
  CONSTRAINT `fk_cycles_users1`
    FOREIGN KEY (`id_person_charge`) REFERENCES `users` (`id_user`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB;

CREATE TABLE `students` (
  `id_student` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_user`    INT UNSIGNED NOT NULL,
  `id_cycle`   INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id_student`),
  INDEX `fk_students_users_idx` (`id_user` ASC) VISIBLE,
  INDEX `fk_students_cycles1_idx` (`id_cycle` ASC) VISIBLE,
  CONSTRAINT `fk_students_users`
    FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_students_cycles1`
    FOREIGN KEY (`id_cycle`) REFERENCES `cycles` (`id_cycle`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

CREATE TABLE `blacklisted_tokens` (
  `id_token`   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_user`    INT UNSIGNED NOT NULL,
  `token`      LONGTEXT NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  PRIMARY KEY (`id_token`),
  INDEX `fk_blacklisted_tokens_users1_idx` (`id_user` ASC) VISIBLE,
  CONSTRAINT `fk_blacklisted_tokens_users1`
    FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

CREATE TABLE `proposals` (
  `id_proposal`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_leader`              INT UNSIGNED NOT NULL,
  `id_cycle`               INT UNSIGNED NOT NULL,
  `title_proposal`         VARCHAR(150) NOT NULL,
  `descr_proposal`         VARCHAR(500) NOT NULL,
  `problem_proposal`       TEXT NOT NULL,
  `justification_proposal` TEXT NOT NULL,
  `objectives_proposal`    TEXT NOT NULL,
  `solution_proposal`      TEXT NOT NULL,
  `pdf_storage_path`       VARCHAR(500) NOT NULL,
  `state_proposal`         ENUM('Pendiente de validación', 'Aprobada', 'Rechazada', 'Anulada')
                             NOT NULL DEFAULT 'Pendiente de validación',
  `rejection_comment`      VARCHAR(500) NULL,
  `resubmit_count`         TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `created_at`             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `reviewed_by`            INT UNSIGNED NULL,
  `reviewed_at`            DATETIME NULL,
  PRIMARY KEY (`id_proposal`),
  INDEX `fk_proposals_students1_idx` (`id_leader` ASC) VISIBLE,
  UNIQUE INDEX `unique_leader_cycle` (`id_leader` ASC, `id_cycle` ASC) VISIBLE,
  INDEX `fk_proposals_users1_idx` (`reviewed_by` ASC) VISIBLE,
  INDEX `fk_proposals_cycles1_idx` (`id_cycle` ASC) VISIBLE,
  CONSTRAINT `fk_proposals_students1`
    FOREIGN KEY (`id_leader`) REFERENCES `students` (`id_student`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_proposals_users1`
    FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id_user`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_proposals_cycles1`
    FOREIGN KEY (`id_cycle`) REFERENCES `cycles` (`id_cycle`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

CREATE TABLE `categories` (
  `id_category`   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name_category` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`id_category`)
) ENGINE = InnoDB;

CREATE TABLE `proposal_categories` (
  `id_proposal` INT UNSIGNED NOT NULL,
  `id_category` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id_proposal`, `id_category`),
  INDEX `fk_proposals_has_categories_categories1_idx` (`id_category` ASC) VISIBLE,
  INDEX `fk_proposals_has_categories_proposals1_idx` (`id_proposal` ASC) VISIBLE,
  UNIQUE INDEX `category_proposal_UNIQUE` (`id_category` ASC, `id_proposal` ASC) VISIBLE,
  CONSTRAINT `fk_proposals_has_categories_proposals1`
    FOREIGN KEY (`id_proposal`) REFERENCES `proposals` (`id_proposal`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_proposals_has_categories_categories1`
    FOREIGN KEY (`id_category`) REFERENCES `categories` (`id_category`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

CREATE TABLE `proposal_students` (
  `id_proposal` INT UNSIGNED NOT NULL,
  `id_student`  INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id_proposal`, `id_student`),
  INDEX `fk_proposals_has_students_students1_idx` (`id_student` ASC) VISIBLE,
  INDEX `fk_proposals_has_students_proposals1_idx` (`id_proposal` ASC) VISIBLE,
  CONSTRAINT `fk_proposals_has_students_proposals1`
    FOREIGN KEY (`id_proposal`) REFERENCES `proposals` (`id_proposal`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_proposals_has_students_students1`
    FOREIGN KEY (`id_student`) REFERENCES `students` (`id_student`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB;

CREATE TABLE `cycle_juror` (
  `id_juror` INT UNSIGNED NOT NULL,
  `id_cycle` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id_juror`, `id_cycle`),
  INDEX `fk_users_has_cycles_cycles1_idx` (`id_cycle` ASC) VISIBLE,
  INDEX `fk_users_has_cycles_users1_idx`   (`id_juror` ASC) VISIBLE,
  CONSTRAINT `fk_users_has_cycles_users1`
    FOREIGN KEY (`id_juror`) REFERENCES `users` (`id_user`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_users_has_cycles_cycles1`
    FOREIGN KEY (`id_cycle`) REFERENCES `cycles` (`id_cycle`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB;

CREATE TABLE `cycle_dates` (
  `id_cycle_date` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_cycle`      INT UNSIGNED NOT NULL,
  `updated_by`    INT UNSIGNED NULL,
  `stage`         ENUM('Radicación', 'Registro PGC', 'Sustentación', 'Calificación') NOT NULL,
  `start_date`    DATETIME NOT NULL,
  `end_date`      DATETIME NOT NULL,
  `updated_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_cycle_date`),
  INDEX `fk_cycle_dates_cycles1_idx` (`id_cycle` ASC) VISIBLE,
  INDEX `fk_cycle_dates_users1_idx`  (`updated_by` ASC) VISIBLE,
  UNIQUE INDEX `unique_cycle_stage`  (`stage` ASC, `id_cycle` ASC) VISIBLE,
  CONSTRAINT `fk_cycle_dates_cycles1`
    FOREIGN KEY (`id_cycle`)   REFERENCES `cycles` (`id_cycle`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_cycle_dates_users1`
    FOREIGN KEY (`updated_by`) REFERENCES `users` (`id_user`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB;

CREATE TABLE `pgc` (
  `id_pgc`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_cycle`        INT UNSIGNED NOT NULL,
  `id_proposal`     INT UNSIGNED NOT NULL,
  `id_pgc_previous` INT UNSIGNED NULL,
  `state_pgc`       ENUM('En Proceso', 'Terminado') NOT NULL DEFAULT 'En Proceso',
  `registered_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_pgc`),
  INDEX `fk_pgc_pgc1_idx`       (`id_pgc_previous` ASC) VISIBLE,
  INDEX `fk_pgc_cycles1_idx`    (`id_cycle` ASC) VISIBLE,
  INDEX `fk_pgc_proposals1_idx` (`id_proposal` ASC) VISIBLE,
  UNIQUE INDEX `id_proposal_UNIQUE` (`id_proposal` ASC) VISIBLE,
  CONSTRAINT `fk_pgc_pgc1`
    FOREIGN KEY (`id_pgc_previous`) REFERENCES `pgc` (`id_pgc`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_pgc_cycles1`
    FOREIGN KEY (`id_cycle`) REFERENCES `cycles` (`id_cycle`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_pgc_proposals1`
    FOREIGN KEY (`id_proposal`) REFERENCES `proposals` (`id_proposal`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

CREATE TABLE `pgc_files` (
  `id_pgc_file`  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_pgc`       INT UNSIGNED NOT NULL,
  `storage_path` VARCHAR(500) NOT NULL,
  `file_format`  VARCHAR(20) NOT NULL,
  `uploaded_by`  INT UNSIGNED NOT NULL,
  `uploaded_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `title_file`   VARCHAR(150) NOT NULL,
  `desc_file`    TEXT NOT NULL,
  PRIMARY KEY (`id_pgc_file`),
  INDEX `fk_pgc_files_pgc1_idx`      (`id_pgc` ASC) VISIBLE,
  INDEX `fk_pgc_files_students1_idx` (`uploaded_by` ASC) VISIBLE,
  CONSTRAINT `fk_pgc_files_pgc1`
    FOREIGN KEY (`id_pgc`) REFERENCES `pgc` (`id_pgc`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_pgc_files_students1`
    FOREIGN KEY (`uploaded_by`) REFERENCES `students` (`id_student`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

CREATE TABLE `jury_grades` (
  `id_jury_grades` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_pgc`         INT UNSIGNED NOT NULL,
  `id_juror`       INT UNSIGNED NOT NULL,
  `grade`          DECIMAL(2,1) UNSIGNED NOT NULL,
  `comment`        TEXT NOT NULL,
  `graded_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_jury_grades`),
  INDEX `fk_jury_grades_pgc1_idx`   (`id_pgc` ASC) VISIBLE,
  INDEX `fk_jury_grades_users1_idx` (`id_juror` ASC) VISIBLE,
  UNIQUE INDEX `unique_pgc_juror`   (`id_pgc` ASC, `id_juror` ASC) INVISIBLE,
  CONSTRAINT `fk_jury_grades_pgc1`
    FOREIGN KEY (`id_pgc`) REFERENCES `pgc` (`id_pgc`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_jury_grades_users1`
    FOREIGN KEY (`id_juror`) REFERENCES `users` (`id_user`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

CREATE TABLE `cycle_documents` (
  `id_cycle_document` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_cycle`          INT UNSIGNED NOT NULL,
  `storage_path`      VARCHAR(500) NOT NULL,
  `doc_type`          ENUM('Rúbrica') NOT NULL,
  `version_label`     VARCHAR(20) NOT NULL,
  `uploaded_at`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `uploaded_by`       INT UNSIGNED NOT NULL,
  `title_file`        VARCHAR(150) NOT NULL,
  `desc_file`         TEXT NULL,
  PRIMARY KEY (`id_cycle_document`),
  INDEX `fk_cycle_documents_cycles1_idx` (`id_cycle` ASC) VISIBLE,
  INDEX `fk_cycle_documents_users1_idx`  (`uploaded_by` ASC) VISIBLE,
  UNIQUE INDEX `uq_cycle_doc_version` (`id_cycle` ASC, `doc_type` ASC, `title_file` ASC, `version_label` ASC) VISIBLE,
  CONSTRAINT `fk_cycle_documents_cycles1`
    FOREIGN KEY (`id_cycle`) REFERENCES `cycles` (`id_cycle`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_cycle_documents_users1`
    FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id_user`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

CREATE TABLE `guideline_documents` (
  `id_guideline_document` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title_file`            VARCHAR(150) NOT NULL,
  `desc_file`             TEXT NULL,
  `storage_path`          VARCHAR(500) NOT NULL,
  `version_label`         VARCHAR(20) NOT NULL,
  `uploaded_at`           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `uploaded_by`           INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id_guideline_document`),
  INDEX `fk_guideline_documents_users1_idx` (`uploaded_by` ASC) VISIBLE,
  CONSTRAINT `fk_guideline_documents_users1`
    FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id_user`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Tablas de auditoria (usadas por triggers)
-- -----------------------------------------------------

CREATE TABLE `proposal_state_history` (
  `id_history`        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_proposal`       INT UNSIGNED NOT NULL,
  `old_state`         VARCHAR(50) NOT NULL,
  `new_state`         VARCHAR(50) NOT NULL,
  `rejection_comment` VARCHAR(500) NULL,
  `resubmit_count`    TINYINT UNSIGNED NOT NULL,
  `reviewed_by`       INT UNSIGNED NULL,
  `changed_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_history`),
  INDEX `idx_psh_proposal`   (`id_proposal` ASC) VISIBLE,
  INDEX `idx_psh_changed_at` (`changed_at` ASC) VISIBLE,
  INDEX `idx_psh_reviewer`   (`reviewed_by` ASC) VISIBLE,
  CONSTRAINT `fk_psh_proposal`
    FOREIGN KEY (`id_proposal`) REFERENCES `proposals` (`id_proposal`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB;

CREATE TABLE `cycle_dates_history` (
  `id_history`     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_cycle_date`  INT UNSIGNED NOT NULL,
  `id_cycle`       INT UNSIGNED NOT NULL,
  `stage`          VARCHAR(50) NOT NULL,
  `old_start_date` DATETIME NOT NULL,
  `old_end_date`   DATETIME NOT NULL,
  `new_start_date` DATETIME NOT NULL,
  `new_end_date`   DATETIME NOT NULL,
  `updated_by`     INT UNSIGNED NULL,
  `changed_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_history`),
  INDEX `idx_cdh_cycle`      (`id_cycle` ASC) VISIBLE,
  INDEX `idx_cdh_cycle_date` (`id_cycle_date` ASC) VISIBLE,
  INDEX `idx_cdh_changed_at` (`changed_at` ASC) VISIBLE,
  INDEX `idx_cdh_updated_by` (`updated_by` ASC) VISIBLE,
  CONSTRAINT `fk_cdh_cycle_date`
    FOREIGN KEY (`id_cycle_date`) REFERENCES `cycle_dates` (`id_cycle_date`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB;