-- Datos base de roles
INSERT INTO `pgc_db`.`rol` (`name_role`) VALUES
  ('Estudiante'),
  ('Profesor'),
  ('Jurado'),
  ('Encargado de Ciclo'),
  ('Administrador');
 


-- (roles ya se insertan en schema.sql, no los repitas aquí)
 
-- -----------------------------------------------------
-- Usuarios de prueba, uno por rol
-- -----------------------------------------------------
USE `pgc_db` ;
INSERT INTO `pgc_db`.`users` (`id_rol`, `mail_user`, `password_user`) VALUES
  ((SELECT id_rol FROM rol WHERE name_role = 'Estudiante'),
    'estudiante@ucundinamarca.edu.co',
    '$2b$10$iUk/E0uUa0SvqERDmzF.Xu/4HUSYwabF1uTZalCaT16MvLwV6WfLy'),
 
  ((SELECT id_rol FROM rol WHERE name_role = 'Profesor'),
    'profesor@ucundinamarca.edu.co',
    '$2b$10$F9a4B.ZEJhewA1dxzfqaWupclh922oycXcXGmrJNw./7O1MltFi12'),
 
  ((SELECT id_rol FROM rol WHERE name_role = 'Jurado'),
    'jurado@ucundinamarca.edu.co',
    '$2b$10$eW4WSZK.udrN77gCFLTKgu0hnR6puLcBQMpFZDiPr4DbYRrAEenum'),
 
  ((SELECT id_rol FROM rol WHERE name_role = 'Encargado de Ciclo'),
    'encargado@ucundinamarca.edu.co',
    '$2b$10$OwFgphI440k6gl/vckfKqOgCZ39M1rO.Pm3IWMjYbBGnNie7JfYQm'),
 
  ((SELECT id_rol FROM rol WHERE name_role = 'Administrador'),
    'admin@ucundinamarca.edu.co',
    '$2b$10$4IIVzK.u1VGjG4pc4bxa8ON3hqwS54xtLmRRk7HcZSb6eUSMOpjV6');
 
-- -----------------------------------------------------
-- Registro de estudiante (extensión de la fila anterior)
-- -----------------------------------------------------
INSERT INTO `pgc_db`.`students` (`id_user`, `name_student`, `pgc_cycle`)
SELECT id_user, "Carlos Andres", 1
FROM `pgc_db`.`users`
WHERE mail_user = 'estudiante@ucundinamarca.edu.co';
 