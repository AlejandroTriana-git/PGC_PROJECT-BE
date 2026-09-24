
DROP SCHEMA IF EXISTS `pgc_db`;
CREATE SCHEMA `pgc_db` DEFAULT CHARACTER SET utf8 ;



-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema pgc_db
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema pgc_db
-- -----------------------------------------------------
DROP SCHEMA IF EXISTS `pgc_db`;
CREATE SCHEMA `pgc_db` DEFAULT CHARACTER SET utf8 ;
USE `pgc_db` ;

-- -----------------------------------------------------
-- Table `pgc_db`.`rol`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `pgc_db`.`rol` (
  `id_rol` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name_role` VARCHAR(30) CHARACTER SET 'utf8mb4' NOT NULL,
  PRIMARY KEY (`id_rol`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `pgc_db`.`users`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `pgc_db`.`users` (
  `id_user` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_rol` INT UNSIGNED NOT NULL,
  `mail_user` VARCHAR(150) NOT NULL,
  `password_user` VARCHAR(255) CHARACTER SET 'utf8mb4' NOT NULL,
  `full_name` VARCHAR(150) NOT NULL DEFAULT '',
  PRIMARY KEY (`id_user`),
  UNIQUE INDEX `mail_user_UNIQUE` (`mail_user` ASC) VISIBLE,
  INDEX `fk_users_rol1_idx` (`id_rol` ASC) VISIBLE,
  CONSTRAINT `fk_users_rol1`
    FOREIGN KEY (`id_rol`)
    REFERENCES `pgc_db`.`rol` (`id_rol`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `pgc_db`.`cycles`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `pgc_db`.`cycles` (
  `id_cycle` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name_cycle` VARCHAR(50) NOT NULL,
  `max_members` TINYINT UNSIGNED NOT NULL,
  `id_person_charge` INT UNSIGNED NULL,
  PRIMARY KEY (`id_cycle`),
  INDEX `fk_cycles_users1_idx` (`id_person_charge` ASC) VISIBLE,
  CONSTRAINT `fk_cycles_users1`
    FOREIGN KEY (`id_person_charge`)
    REFERENCES `pgc_db`.`users` (`id_user`)
    ON DELETE SET NULL
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `pgc_db`.`students`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `pgc_db`.`students` (
  `id_student` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_user` INT UNSIGNED NOT NULL,
  `id_cycle` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id_student`),
  INDEX `fk_students_users_idx` (`id_user` ASC) VISIBLE,
  INDEX `fk_students_cycles1_idx` (`id_cycle` ASC) VISIBLE,
  CONSTRAINT `fk_students_users`
    FOREIGN KEY (`id_user`)
    REFERENCES `pgc_db`.`users` (`id_user`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_students_cycles1`
    FOREIGN KEY (`id_cycle`)
    REFERENCES `pgc_db`.`cycles` (`id_cycle`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `pgc_db`.`blacklisted_tokens`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `pgc_db`.`blacklisted_tokens` (
  `id_token` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_user` INT UNSIGNED NOT NULL,
  `token` LONGTEXT NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  PRIMARY KEY (`id_token`),
  INDEX `fk_blacklisted_tokens_users1_idx` (`id_user` ASC) VISIBLE,
  CONSTRAINT `fk_blacklisted_tokens_users1`
    FOREIGN KEY (`id_user`)
    REFERENCES `pgc_db`.`users` (`id_user`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `pgc_db`.`proposals`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `pgc_db`.`proposals` (
  `id_proposal` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_leader` INT UNSIGNED NOT NULL,
  `id_cycle` INT UNSIGNED NOT NULL,
  `title_proposal` VARCHAR(150) NOT NULL,
  `descr_proposal` VARCHAR(500) NOT NULL,
  `problem_proposal` TEXT NOT NULL,
  `justification_proposal` TEXT NOT NULL,
  `objectives_proposal` TEXT NOT NULL,
  `solution_proposal` TEXT NOT NULL,
  `pdf_storage_path` VARCHAR(500) NOT NULL,
  `state_proposal` ENUM('Pendiente de validación', 'Aprobada', 'Rechazada', 'Anulada') NOT NULL DEFAULT 'Pendiente de validación',
  `rejection_comment` VARCHAR(500) NULL,
  `resubmit_count` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `reviewed_by` INT UNSIGNED NULL,
  `reviewed_at` DATETIME NULL,
  PRIMARY KEY (`id_proposal`),
  INDEX `fk_proposals_students1_idx` (`id_leader` ASC) VISIBLE,
  UNIQUE INDEX `unique_leader_cycle` (`id_leader` ASC, `id_cycle` ASC) VISIBLE,
  INDEX `fk_proposals_users1_idx` (`reviewed_by` ASC) VISIBLE,
  INDEX `fk_proposals_cycles1_idx` (`id_cycle` ASC) VISIBLE,
  CONSTRAINT `fk_proposals_students1`
    FOREIGN KEY (`id_leader`)
    REFERENCES `pgc_db`.`students` (`id_student`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_proposals_users1`
    FOREIGN KEY (`reviewed_by`)
    REFERENCES `pgc_db`.`users` (`id_user`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_proposals_cycles1`
    FOREIGN KEY (`id_cycle`)
    REFERENCES `pgc_db`.`cycles` (`id_cycle`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `pgc_db`.`categories`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `pgc_db`.`categories` (
  `id_category` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name_category` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`id_category`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `pgc_db`.`proposal_categories`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `pgc_db`.`proposal_categories` (
  `id_proposal` INT UNSIGNED NOT NULL,
  `id_category` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id_proposal`, `id_category`),
  INDEX `fk_proposals_has_categories_categories1_idx` (`id_category` ASC) VISIBLE,
  INDEX `fk_proposals_has_categories_proposals1_idx` (`id_proposal` ASC) VISIBLE,
  UNIQUE INDEX `category_proposal_UNIQUE` (`id_category` ASC, `id_proposal` ASC) VISIBLE,
  CONSTRAINT `fk_proposals_has_categories_proposals1`
    FOREIGN KEY (`id_proposal`)
    REFERENCES `pgc_db`.`proposals` (`id_proposal`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_proposals_has_categories_categories1`
    FOREIGN KEY (`id_category`)
    REFERENCES `pgc_db`.`categories` (`id_category`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `pgc_db`.`proposal_students`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `pgc_db`.`proposal_students` (
  `id_proposal` INT UNSIGNED NOT NULL,
  `id_student` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id_proposal`, `id_student`),
  INDEX `fk_proposals_has_students_students1_idx` (`id_student` ASC) VISIBLE,
  INDEX `fk_proposals_has_students_proposals1_idx` (`id_proposal` ASC) VISIBLE,
  CONSTRAINT `fk_proposals_has_students_proposals1`
    FOREIGN KEY (`id_proposal`)
    REFERENCES `pgc_db`.`proposals` (`id_proposal`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_proposals_has_students_students1`
    FOREIGN KEY (`id_student`)
    REFERENCES `pgc_db`.`students` (`id_student`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `pgc_db`.`cycle_juror`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `pgc_db`.`cycle_juror` (
  `id_juror` INT UNSIGNED NOT NULL,
  `id_cycle` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id_juror`, `id_cycle`),
  INDEX `fk_users_has_cycles_cycles1_idx` (`id_cycle` ASC) VISIBLE,
  INDEX `fk_users_has_cycles_users1_idx` (`id_juror` ASC) VISIBLE,
  CONSTRAINT `fk_users_has_cycles_users1`
    FOREIGN KEY (`id_juror`)
    REFERENCES `pgc_db`.`users` (`id_user`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_users_has_cycles_cycles1`
    FOREIGN KEY (`id_cycle`)
    REFERENCES `pgc_db`.`cycles` (`id_cycle`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `pgc_db`.`cycle_dates`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `pgc_db`.`cycle_dates` (
  `id_cycle_date` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_cycle` INT UNSIGNED NOT NULL,
  `updated_by` INT UNSIGNED NULL,
  `stage` ENUM('Radicación', 'Registro PGC', 'Sustentación', 'Calificación') NOT NULL,
  `start_date` DATETIME NOT NULL,
  `end_date` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_cycle_date`),
  INDEX `fk_cycle_dates_cycles1_idx` (`id_cycle` ASC) VISIBLE,
  INDEX `fk_cycle_dates_users1_idx` (`updated_by` ASC) VISIBLE,
  UNIQUE INDEX `unique_cycle_stage` (`stage` ASC, `id_cycle` ASC) VISIBLE,
  CONSTRAINT `fk_cycle_dates_cycles1`
    FOREIGN KEY (`id_cycle`)
    REFERENCES `pgc_db`.`cycles` (`id_cycle`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_cycle_dates_users1`
    FOREIGN KEY (`updated_by`)
    REFERENCES `pgc_db`.`users` (`id_user`)
    ON DELETE SET NULL
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `pgc_db`.`pgc`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `pgc_db`.`pgc` (
  `id_pgc` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_cycle` INT UNSIGNED NOT NULL,
  `id_proposal` INT UNSIGNED NOT NULL,
  `id_pgc_previous` INT UNSIGNED NULL,
  `state_pgc` ENUM('En Proceso', 'Terminado') NOT NULL DEFAULT 'En Proceso',
  `registered_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_pgc`),
  INDEX `fk_pgc_pgc1_idx` (`id_pgc_previous` ASC) VISIBLE,
  INDEX `fk_pgc_cycles1_idx` (`id_cycle` ASC) VISIBLE,
  INDEX `fk_pgc_proposals1_idx` (`id_proposal` ASC) VISIBLE,
  UNIQUE INDEX `id_proposal_UNIQUE` (`id_proposal` ASC) VISIBLE,
  CONSTRAINT `fk_pgc_pgc1`
    FOREIGN KEY (`id_pgc_previous`)
    REFERENCES `pgc_db`.`pgc` (`id_pgc`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_pgc_cycles1`
    FOREIGN KEY (`id_cycle`)
    REFERENCES `pgc_db`.`cycles` (`id_cycle`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_pgc_proposals1`
    FOREIGN KEY (`id_proposal`)
    REFERENCES `pgc_db`.`proposals` (`id_proposal`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `pgc_db`.`pgc_files`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `pgc_db`.`pgc_files` (
  `id_pgc_file` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_pgc` INT UNSIGNED NOT NULL,
  `storage_path` VARCHAR(500) NOT NULL,
  `file_format` VARCHAR(20) NOT NULL,
  `uploaded_by` INT UNSIGNED NOT NULL,
  `uploaded_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_pgc_file`),
  INDEX `fk_pgc_files_pgc1_idx` (`id_pgc` ASC) VISIBLE,
  INDEX `fk_pgc_files_students1_idx` (`uploaded_by` ASC) VISIBLE,
  CONSTRAINT `fk_pgc_files_pgc1`
    FOREIGN KEY (`id_pgc`)
    REFERENCES `pgc_db`.`pgc` (`id_pgc`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_pgc_files_students1`
    FOREIGN KEY (`uploaded_by`)
    REFERENCES `pgc_db`.`students` (`id_student`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `pgc_db`.`jury_grades`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `pgc_db`.`jury_grades` (
  `id_jury_grades` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_pgc` INT UNSIGNED NOT NULL,
  `id_juror` INT UNSIGNED NOT NULL,
  `grade` DECIMAL(2,1) UNSIGNED NOT NULL,
  `comment` TEXT NOT NULL,
  `graded_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_jury_grades`),
  INDEX `fk_jury_grades_pgc1_idx` (`id_pgc` ASC) VISIBLE,
  INDEX `fk_jury_grades_users1_idx` (`id_juror` ASC) VISIBLE,
  UNIQUE INDEX `unique_pgc_juror` (`id_pgc` ASC, `id_juror` ASC) INVISIBLE,
  CONSTRAINT `fk_jury_grades_pgc1`
    FOREIGN KEY (`id_pgc`)
    REFERENCES `pgc_db`.`pgc` (`id_pgc`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_jury_grades_users1`
    FOREIGN KEY (`id_juror`)
    REFERENCES `pgc_db`.`users` (`id_user`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `pgc_db`.`cycle_documents`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `pgc_db`.`cycle_documents` (
  `id_cycle_document` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_cycle` INT UNSIGNED NOT NULL,
  `storage_path` VARCHAR(500) NOT NULL,
  `doc_type` ENUM('Rúbrica', 'Lineamiento') NOT NULL,
  `version_label` VARCHAR(20) NOT NULL,
  `uploaded_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_cycle_document`),
  INDEX `fk_cycle_documents_cycles1_idx` (`id_cycle` ASC) VISIBLE,
  CONSTRAINT `fk_cycle_documents_cycles1`
    FOREIGN KEY (`id_cycle`)
    REFERENCES `pgc_db`.`cycles` (`id_cycle`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
