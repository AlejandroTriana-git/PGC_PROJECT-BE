-- Datos base de roles
INSERT INTO `pgc_db`.`rol` (`name_role`) VALUES
  ('Estudiante'),
  ('Profesor'),
  ('Administrador');
 


 
-- -----------------------------------------------------
-- Usuarios de prueba, uno por rol
-- -----------------------------------------------------
USE `pgc_db` ;
INSERT INTO `pgc_db`.`users` (`id_rol`, `mail_user`, `password_user`, `full_name`) VALUES
  ((SELECT id_rol FROM rol WHERE name_role = 'Estudiante'),
    'estudiante1@ucundinamarca.edu.co',
    '$2b$10$xEEINlvSDK6gR1uVunWbrOrQpkwPliTLniMJdXanv.WL2a8ei/Jxa',
    'Carlos Andrés Pérez'),
 
  ((SELECT id_rol FROM rol WHERE name_role = 'Estudiante'),
    'estudiante2@ucundinamarca.edu.co',
    '$2b$10$OGq2CdsOY2vAwdsJICM2y.B7L1enAvLhzUVKegEDTBmKnYZ63N/pS',
    'María José Rodríguez'),
 
  ((SELECT id_rol FROM rol WHERE name_role = 'Estudiante'),
    'estudiante3@ucundinamarca.edu.co',
    '$2b$10$HkQpwib6UO.SjjMJnfFCQet31NPB/yXN9BuWRyy9x0hDUAYVhr2yq',
    'Julián Esteban Gómez'),
 
  ((SELECT id_rol FROM rol WHERE name_role = 'Profesor'),
    'profesor1@ucundinamarca.edu.co',
    '$2b$10$/EAikjDSP3VAheGs9d4tIe1MtBVK9uZWALm80a0pg.U6Ap16cD6eS',
    'Ana Lucía García'),
 
  ((SELECT id_rol FROM rol WHERE name_role = 'Profesor'),
    'profesor2@ucundinamarca.edu.co',
    '$2b$10$3YDKGMI0YEACBRUsnl4SiObwgw4gjaNAPNW1Ww5Xdzq.jKkqBJpVu',
    'Jorge Iván López'),
 
  ((SELECT id_rol FROM rol WHERE name_role = 'Profesor'),
    'profesor3@ucundinamarca.edu.co',
    '$2b$10$hQgHyqRBDiGJNKylCKZIk.px5e/I9ytyKbDoxG41MbeyFeZigQnpq',
    'Sandra Milena Martínez'),
 
  ((SELECT id_rol FROM rol WHERE name_role = 'Administrador'),
    'admin@ucundinamarca.edu.co',
    '$2b$10$18wAmk7xcGck8MEVlh.IieqCZFw5e33En1M0NLFCk2NWwNbl7OlKq',
    'Diego Fernando Ramírez');
  
-- -----------------------------------------------------
-- Ciclos, se usan los 3 ciclos y se les asigna un encargado del ciclo
-- -----------------------------------------------------

INSERT INTO `pgc_db`.`cycles` (`name_cycle`, `max_members`, `id_person_charge`) VALUES
  ('Fundamentación', 4,
    (SELECT id_user FROM users WHERE mail_user = 'profesor1@ucundinamarca.edu.co')),
  ('Profundización', 4,
    (SELECT id_user FROM users WHERE mail_user = 'profesor2@ucundinamarca.edu.co')),
  ('Investigación-producción', 2,
    (SELECT id_user FROM users WHERE mail_user = 'profesor3@ucundinamarca.edu.co'));
 


-- -----------------------------------------------------
-- Jurados por ciclo, aunque falta para el tercer ciclo 
-- (mas adleante agregarlo, o agregarlo para probar desde el fe)
-- Se agregan en ciclos distinto para probar confiltos
-- -----------------------------------------------------
INSERT INTO `pgc_db`.`cycle_juror` (`id_juror`, `id_cycle`) VALUES
  ((SELECT id_user FROM users WHERE mail_user = 'profesor2@ucundinamarca.edu.co'),
    (SELECT id_cycle FROM cycles WHERE name_cycle = 'Fundamentación')),
  ((SELECT id_user FROM users WHERE mail_user = 'profesor3@ucundinamarca.edu.co'),
    (SELECT id_cycle FROM cycles WHERE name_cycle = 'Profundización'));
 



-- -----------------------------------------------------
-- Registro de estudiante (extensión de la fila user)
-- estudiante1 y estudiante2 quedan en el MISMO ciclo para
-- poder probar la radicación de una propuesta en equipo
-- (HU-09). estudiante3 queda en otro ciclo para poder
-- probar la validación de "integrantes de distinto ciclo".
-- -----------------------------------------------------
INSERT INTO `pgc_db`.`students` (`id_user`, `id_cycle`)
SELECT id_user, (SELECT id_cycle FROM cycles WHERE name_cycle = 'Fundamentación')
FROM `pgc_db`.`users` WHERE mail_user = 'estudiante1@ucundinamarca.edu.co';
 
INSERT INTO `pgc_db`.`students` (`id_user`, `id_cycle`)
SELECT id_user, (SELECT id_cycle FROM cycles WHERE name_cycle = 'Fundamentación')
FROM `pgc_db`.`users` WHERE mail_user = 'estudiante2@ucundinamarca.edu.co';
 
INSERT INTO `pgc_db`.`students` (`id_user`, `id_cycle`)
SELECT id_user, (SELECT id_cycle FROM cycles WHERE name_cycle = 'Profundización')
FROM `pgc_db`.`users` WHERE mail_user = 'estudiante3@ucundinamarca.edu.co';
 
-- -----------------------------------------------------
-- Categorías de proyectos
-- -----------------------------------------------------
INSERT INTO `pgc_db`.`categories` (`name_category`) VALUES
  ('Web'),
  ('App Móvil'),
  ('IoT'),
  ('Hardware'),
  ('Gestión');

INSERT INTO `pgc_db`.`cycle_dates` (id_cycle, updated_by, stage, start_date, end_date) VALUES
  (1, 4, "Registro PGC", '2026-09-24 00:00:00', '2026-10-24 00:00:00'),
  (2, 4, "Registro PGC", '2026-09-24 00:00:00', '2026-10-24 00:00:00'),
  (3, 4, "Registro PGC", '2026-09-24 00:00:00', '2026-10-24 00:00:00');