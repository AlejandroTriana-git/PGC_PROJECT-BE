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
CREATE SCHEMA IF NOT EXISTS `pgc_db` DEFAULT CHARACTER SET utf8 ;
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
  `password_user` VARCHAR(255) CHARACTER SET 'ascii' NOT NULL,
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
-- Table `pgc_db`.`students`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `pgc_db`.`students` (
  `id_student` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_user` INT UNSIGNED NOT NULL,
  `name_student` VARCHAR(45) NOT NULL,
  `pgc_cycle` TINYINT UNSIGNED NOT NULL,
  PRIMARY KEY (`id_student`),
  INDEX `fk_students_users_idx` (`id_user` ASC) VISIBLE,
  CONSTRAINT `fk_students_users`
    FOREIGN KEY (`id_user`)
    REFERENCES `pgc_db`.`users` (`id_user`)
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


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
